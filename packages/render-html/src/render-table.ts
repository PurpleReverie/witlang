// `@table` HTML renderer (M10.core-vocab Thread 4).
//
// Supports four authoring forms:
//   1. Inline CSV-style: `|rows [[Header,...], [Row1,...], ...]|`
//   2. Records with positional schema: `|schema [k1, k2]| |rows [...]|`
//   3. Records with labelled schema: `|schema { k - Label, ... }| |rows [...]|`
//   4. Body-based: `@row`/`@col` (or `@tr`/`@td`/`@th`) child nodes — the
//      only form whose cells may carry rich content (links, emphasis,
//      nested nodes) rather than plain strings.
//
// `|caption ...|` adds a `<caption>` element.
// `|header N|`, `|header false|`, `|header [a,b,c]|` override the
// default "row 0 of rows is the header" behaviour (forms 1–3); for the
// body-based form `|header false|` turns off the first-row header.
//
// Row values may be parsed Records (when `|rows @sites|` was inlined as
// a Collection of Records by the resolver) or strings (CSV style).

import {
  tryParseCollectionFromText,
} from '@witlang/parser';
import type {
  Block, Collection as CollectionNode, DataValue, Inline,
  NodeUse, Param, Record as RecordNode,
} from '@witlang/parser';
import { escapeHtml } from './escape.js';

// Renders a node's body to HTML (shared with the main renderer) so
// body-based table cells can hold the same rich content as any node.
type NodeBodyRenderer = (use: NodeUse) => string;

export function tryRenderTable(
  use: NodeUse,
  renderNodeBody: NodeBodyRenderer,
): string | null {
  if (use.name !== 'table') return null;
  const rows = readRowsParam(use.params);
  // No `rows` param: author the table from `@row`/`@col` (or `@tr`/`@td`/
  // `@th`) child nodes. Falls back to an empty `<table></table>` when the
  // body has no row children (preserving `@table table@`).
  if (rows === null) return renderBodyTable(use, renderNodeBody);
  const schema = readSchemaParam(use.params) ?? deriveSchemaFromRecords(rows);
  const header = pickHeader(use.params, rows, schema);
  const body = pickBody(rows, schema, header.usedFromRows);
  const caption = paramOf(use.params, 'caption');
  return renderHtmlTable(header.cells, body, schema, caption);
}

// ---------------------------------------------------------------------------
// Body-based form: `@table` whose children are `@row`/`@tr` rows, each
// holding `@col`/`@td`/`@th` cells. The first row is the header (its cells
// render as `<th>`) unless `|header false|`; a `@th` cell is always a header
// cell. Cell bodies render through the shared node-body renderer, so a cell
// may contain links, emphasis, or nested nodes.
// ---------------------------------------------------------------------------

const ROW_NAMES = new Set<string>(['row', 'tr']);
const CELL_NAMES = new Set<string>(['col', 'td', 'th']);

function renderBodyTable(use: NodeUse, renderNodeBody: NodeBodyRenderer): string {
  const rowNodes = childUses(use.body).filter((u) => ROW_NAMES.has(u.name));
  const open = '<table>' + captionHtml(paramOf(use.params, 'caption'));
  if (rowNodes.length === 0) return open + '</table>';
  const headed = paramOf(use.params, 'header') !== 'false';
  let out = open;
  if (headed) out += `<thead>${renderNodeRow(rowNodes[0]!, true, renderNodeBody)}</thead>`;
  out += '<tbody>';
  for (let i = headed ? 1 : 0; i < rowNodes.length; i += 1) {
    out += renderNodeRow(rowNodes[i]!, false, renderNodeBody);
  }
  return out + '</tbody></table>';
}

function renderNodeRow(
  rowUse: NodeUse, isHead: boolean, renderNodeBody: NodeBodyRenderer,
): string {
  let out = '<tr>';
  for (const cell of childUses(rowUse.body).filter((u) => CELL_NAMES.has(u.name))) {
    const tag = isHead || cell.name === 'th' ? 'th' : 'td';
    out += `<${tag}>${cellContent(cell, renderNodeBody)}</${tag}>`;
  }
  return out + '</tr>';
}

// A cell body arrives wrapped in `<p>…</p>` when it is a single paragraph;
// unwrap it so a simple cell isn't `<td><p>x</p></td>` (matches the inline-
// context flattening the generic renderer already does for `<td>`/`<th>`).
function cellContent(cell: NodeUse, renderNodeBody: NodeBodyRenderer): string {
  const html = renderNodeBody(cell).trim();
  const m = /^<p>([\s\S]*)<\/p>$/.exec(html);
  return m === null ? html : m[1]!.trim();
}

// Collect the child `NodeUse`s of a body, descending one level into a
// Paragraph — an inline single-line `@row … row@` (or `@col … col@`) wraps
// its children in a Paragraph, while a multi-line one keeps them as direct
// block children. Both shapes must yield the same rows/cells.
function childUses(body: readonly (Block | Inline)[] | null): NodeUse[] {
  if (body === null) return [];
  const out: NodeUse[] = [];
  for (const child of body) {
    const kind = (child as { kind: string }).kind;
    if (kind === 'nodeUse') out.push(child as NodeUse);
    else if (kind === 'paragraph') {
      const kids = (child as unknown as { children: (Block | Inline)[] }).children;
      for (const inner of kids) {
        if ((inner as { kind: string }).kind === 'nodeUse') out.push(inner as NodeUse);
      }
    }
  }
  return out;
}

function captionHtml(caption: string | undefined): string {
  return caption === undefined ? '' : `<caption>${escapeHtml(caption)}</caption>`;
}

// ---------------------------------------------------------------------------
// Param parsing.
// ---------------------------------------------------------------------------

function readRowsParam(params: readonly Param[]): CollectionNode | null {
  const p = findParam(params, 'rows');
  if (p === undefined) return null;
  // A `@ref` rows value (e.g. `|rows @sales|`) is resolved to its collection
  // by the expander and left on typedValue — prefer it over literal text.
  if (p.typedValue !== undefined && p.typedValue.kind === 'collection') {
    return p.typedValue;
  }
  const trimmed = p.value.trim();
  if (!trimmed.startsWith('[')) return null;
  const r = tryParseCollectionFromText(
    trimmed,
    { file: '', line: 1, col: 1, offset: 0, length: trimmed.length },
  );
  return r === null ? null : r.collection;
}

// When rows are records and no schema was given, use the first record's
// keys as the columns — so a loaded collection of records renders directly.
function deriveSchemaFromRecords(rows: CollectionNode): SchemaInfo | null {
  const first = rows.items[0];
  if (first === undefined || first.kind !== 'record') return null;
  const keys = first.fields.map((f) => f.key);
  if (keys.length === 0) return null;
  return { keys, labels: keys, isLabelled: false };
}

interface SchemaInfo {
  keys: string[];                 // record field keys
  labels: string[];               // display labels
  isLabelled: boolean;
}

function readSchemaParam(params: readonly Param[]): SchemaInfo | null {
  const p = findParam(params, 'schema');
  if (p === undefined) return null;
  if (p.typedValue !== undefined && p.typedValue.kind === 'collection') {
    const keys = p.typedValue.items.map(asStringValue);
    return { keys, labels: keys, isLabelled: false };
  }
  const trimmed = p.value.trim();
  if (trimmed.startsWith('{')) return parseLabelledSchema(trimmed);
  if (trimmed.startsWith('[')) return parsePositionalSchema(trimmed);
  return null;
}

function parsePositionalSchema(text: string): SchemaInfo | null {
  const r = tryParseCollectionFromText(text, baseLoc(text));
  if (r === null) return null;
  const keys = r.collection.items.map(asStringValue);
  return { keys, labels: keys, isLabelled: false };
}

function parseLabelledSchema(text: string): SchemaInfo | null {
  // Reuse the record parser by wrapping text directly.
  // Note: we go through the collection parser indirectly by quick-parsing.
  // Instead, parse a leading `{ ... }` here — simple split.
  const inner = text.replace(/^\{|\}$/g, '').trim();
  const keys: string[] = [];
  const labels: string[] = [];
  for (const field of splitTopLevel(inner, ',')) {
    const m = /^([^-]+?)\s+-\s+(.*)$/.exec(field.trim());
    if (m === null) { keys.push(field.trim()); labels.push(field.trim()); continue; }
    keys.push(m[1]!.trim());
    labels.push(m[2]!.trim());
  }
  return { keys, labels, isLabelled: true };
}

function splitTopLevel(text: string, sep: ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const c of text) {
    if (c === '{' || c === '[') depth += 1;
    else if (c === '}' || c === ']') depth -= 1;
    if (c === sep && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim().length > 0) out.push(buf);
  return out;
}

// ---------------------------------------------------------------------------
// Header / body partitioning.
// ---------------------------------------------------------------------------

interface HeaderPick {
  cells: string[] | null;
  usedFromRows: number;            // count of rows consumed for header
}

function pickHeader(
  params: readonly Param[],
  rows: CollectionNode,
  schema: SchemaInfo | null,
): HeaderPick {
  const raw = paramOf(params, 'header');
  const override = pickHeaderOverride(raw, rows);
  if (override !== undefined) return override;
  if (schema !== null) return { cells: schema.labels, usedFromRows: 0 };
  return pickDefaultHeader(rows);
}

function pickHeaderOverride(
  raw: string | undefined, rows: CollectionNode,
): HeaderPick | undefined {
  if (raw === 'false') return { cells: null, usedFromRows: 0 };
  if (raw !== undefined && raw.startsWith('[')) {
    const r = tryParseCollectionFromText(raw, baseLoc(raw));
    if (r !== null) {
      return { cells: r.collection.items.map(asStringValue), usedFromRows: 0 };
    }
  }
  if (raw !== undefined && /^\d+$/.test(raw)) {
    const idx = parseInt(raw, 10);
    const row = rows.items[idx];
    if (row !== undefined && row.kind === 'collection') {
      return { cells: row.items.map(asStringValue), usedFromRows: idx + 1 };
    }
  }
  return undefined;
}

function pickDefaultHeader(rows: CollectionNode): HeaderPick {
  if (rows.items.length === 0) return { cells: null, usedFromRows: 0 };
  const first = rows.items[0];
  if (first === undefined || first.kind !== 'collection') {
    return { cells: null, usedFromRows: 0 };
  }
  return { cells: first.items.map(asStringValue), usedFromRows: 1 };
}

function pickBody(
  rows: CollectionNode,
  schema: SchemaInfo | null,
  skip: number,
): DataValue[] {
  if (schema !== null) return rows.items;          // every row is data
  return rows.items.slice(skip);
}

// ---------------------------------------------------------------------------
// HTML emission.
// ---------------------------------------------------------------------------

function renderHtmlTable(
  header: string[] | null,
  bodyRows: DataValue[],
  schema: SchemaInfo | null,
  caption: string | undefined,
): string {
  let out = '<table>';
  if (caption !== undefined) out += `<caption>${escapeHtml(caption)}</caption>`;
  if (header !== null) out += renderHead(header);
  out += '<tbody>';
  for (const row of bodyRows) out += renderBodyRow(row, schema);
  out += '</tbody></table>';
  return out;
}

function renderHead(cells: readonly string[]): string {
  let row = '<tr>';
  for (const c of cells) row += `<th>${escapeHtml(c)}</th>`;
  return `<thead>${row}</tr></thead>`;
}

function renderBodyRow(row: DataValue, schema: SchemaInfo | null): string {
  if (row.kind === 'collection') return renderCellRow(row.items.map(asStringValue));
  if (row.kind === 'record' && schema !== null) {
    return renderCellRow(extractByKeys(row, schema.keys));
  }
  return `<tr><td>${escapeHtml(asStringValue(row))}</td></tr>`;
}

function renderCellRow(cells: readonly string[]): string {
  let row = '<tr>';
  for (const c of cells) row += `<td>${escapeHtml(c)}</td>`;
  return row + '</tr>';
}

function extractByKeys(rec: RecordNode, keys: readonly string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const field = rec.fields.find((f) => f.key === k);
    out.push(field === undefined ? '' : asStringValue(field.value));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function paramOf(params: readonly Param[], name: string): string | undefined {
  for (const p of params) if (p.name === name) return p.value;
  return undefined;
}

function findParam(params: readonly Param[], name: string): Param | undefined {
  for (const p of params) if (p.name === name) return p;
  return undefined;
}

function asStringValue(v: DataValue): string {
  if (v.kind === 'stringValue') return v.value;
  if (v.kind === 'numberValue') return String(v.value);
  if (v.kind === 'booleanValue') return String(v.value);
  if (v.kind === 'nullValue') return '';
  return '';
}

function baseLoc(text: string) {
  return { file: '', line: 1, col: 1, offset: 0, length: text.length };
}
