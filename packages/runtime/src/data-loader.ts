// External-data load pass — the seam between Wit and the outside world.
//
// A `@load <alias> load@` node names data that lives outside the document
// (a program's output, a file, environment variables). This pass runs
// AFTER parse and BEFORE resolve: it finds every `@load` use, hands the
// alias + captures to a host-supplied DataLoader, normalises the returned
// JSON value into the Wit value model, and rewrites the `@load` node into
// an ordinary DataDef. From that point on the loaded data is
// indistinguishable from a hand-written `#name: … !!` — it flows through
// `@name.field`, `(each @name)`, and interpolation with no special casing.
//
// The DataLoader is the whole seam. A CLI host builds one that spawns the
// program named by an alias in a sources config; an embedded host (a
// program using this package) passes its own — e.g. a lookup into an
// in-memory map. Everything downstream is identical either way.

import type {
  Document,
  Block,
  Inline,
  DataDef,
  DataValue,
  NodeUse,
  Text,
  Paragraph,
  Italic,
  Bold,
  IfStatement,
  EachStatement,
} from '@witlang/parser';
import type { Loc } from '@witlang/parser';
import { RuntimeError, RuntimeErrorCode } from './errors.js';

export interface DataLoadRequest {
  // The alias in the `@load` body — e.g. `results` in `@load results load@`.
  alias: string;
  // Named captures on the use — e.g. `@load cite |key devlin2019| load@`
  // yields `{ key: 'devlin2019' }`. The `|as name|` capture is consumed as
  // the binding name and never appears here.
  args: Record<string, string>;
  // The load node's source location, for error reporting.
  loc: Loc;
}

// Turns a load request into a JSON-shaped value (object, array, or scalar).
// May throw; the message surfaces as an E_LOAD_FAILED at the load site.
export type DataLoader = (req: DataLoadRequest) => unknown;

// The seam accepts either a loader function or — the simplest embedded case —
// a plain dictionary pairing each alias with its already-resolved data.
export type DataSource = DataLoader | Record<string, unknown>;

// Walk the document, replacing every top-level (and if/each-nested) `@load`
// use with a DataDef built from the source's value for that alias.
export function loadExternalData(doc: Document, source: DataSource): Document {
  const loader = toLoader(source);
  return { ...doc, children: transformBlocks(doc.children, loader) };
}

// A dictionary source becomes a loader that looks each alias up by key.
function toLoader(source: DataSource): DataLoader {
  if (typeof source === 'function') return source;
  return (req) => {
    if (!Object.prototype.hasOwnProperty.call(source, req.alias)) {
      throw new Error(`no data provided for alias "${req.alias}"`);
    }
    return source[req.alias];
  };
}

function transformBlocks(
  blocks: readonly Block[],
  loader: DataLoader,
): Block[] {
  return blocks.map((b) => transformBlock(b, loader));
}

function transformBlock(block: Block, loader: DataLoader): Block {
  if (isLoadUse(block)) return loadToDataDef(block, loader);
  if (block.kind === 'ifStatement') return transformIf(block, loader);
  if (block.kind === 'eachStatement') {
    return { ...block, body: transformBlocks(block.body, loader) };
  }
  return block;
}

function transformIf(block: IfStatement, loader: DataLoader): IfStatement {
  const next: IfStatement = { ...block, then: transformBlocks(block.then, loader) };
  if (block.else) next.else = transformBlocks(block.else, loader);
  return next;
}

function isLoadUse(block: Block): block is NodeUse {
  return block.kind === 'nodeUse' && block.name === 'load' && block.raw !== true;
}

function loadToDataDef(use: NodeUse, loader: DataLoader): DataDef {
  // The alias is the body prose (`@load results load@`); when the use only
  // carries pipes it may instead come from a `|from …|` capture, so the
  // parameterized form `@load |from cite| |key …| load@` parses cleanly
  // (pipes must sit right after `@load` to be captured as params).
  const fromParam = use.params.find((p) => p.name === 'from')?.value;
  const alias = (bodyText(use.body).trim() || fromParam || '').trim();
  if (alias === '') {
    throw new RuntimeError(
      RuntimeErrorCode.E_LOAD_FAILED,
      '@load needs an alias, e.g. @load results load@',
      use.loc,
    );
  }
  const { args, bindName } = readParams(use, alias);
  let value: unknown;
  try {
    value = loader({ alias, args, loc: use.loc });
  } catch (err) {
    throw new RuntimeError(
      RuntimeErrorCode.E_LOAD_FAILED,
      `@load ${alias}: ${(err as Error).message ?? String(err)}`,
      use.loc,
    );
  }
  return {
    kind: 'dataDef',
    name: bindName,
    value: toDataValue(value, use.loc),
    loc: structuredClone(use.loc),
  };
}

function readParams(
  use: NodeUse,
  alias: string,
): { args: Record<string, string>; bindName: string } {
  const args: Record<string, string> = {};
  let bindName = alias;
  for (const p of use.params) {
    if (p.name === null) continue;
    if (p.name === 'as') { bindName = p.value; continue; }
    if (p.name === 'from') continue; // consumed as the alias
    args[p.name] = p.value;
  }
  return { args, bindName };
}

// ---------------------------------------------------------------------------
// JSON value → Wit value model. object → record, array → collection,
// primitives → the matching scalar. This is the only shape that crosses
// the seam, which is what decouples Wit from every external format/tool.
// ---------------------------------------------------------------------------

export function toDataValue(value: unknown, loc: Loc): DataValue {
  const at = structuredClone(loc);
  if (value === null || value === undefined) return { kind: 'nullValue', loc: at };
  if (typeof value === 'string') return { kind: 'stringValue', value, loc: at };
  if (typeof value === 'number') return { kind: 'numberValue', value, loc: at };
  if (typeof value === 'boolean') return { kind: 'booleanValue', value, loc: at };
  if (Array.isArray(value)) {
    return { kind: 'collection', items: value.map((v) => toDataValue(v, loc)), loc: at };
  }
  if (typeof value === 'object') {
    const fields = Object.entries(value as Record<string, unknown>).map(
      ([key, v]) => ({ key, value: toDataValue(v, loc) }),
    );
    return { kind: 'record', fields, loc: at };
  }
  return { kind: 'stringValue', value: String(value), loc: at };
}

// ---------------------------------------------------------------------------
// Extract the plain text of a node's body (the alias sits there as prose).
// ---------------------------------------------------------------------------

function bodyText(body: readonly (Block | Inline)[] | null): string {
  if (body === null) return '';
  let out = '';
  for (const node of body) out += nodeText(node);
  return out;
}

function nodeText(node: Block | Inline): string {
  if (node.kind === 'text') return (node as Text).value;
  if (node.kind === 'paragraph') return childrenText((node as Paragraph).children);
  if (node.kind === 'italic') return childrenText((node as Italic).children);
  if (node.kind === 'bold') return childrenText((node as Bold).children);
  return '';
}

function childrenText(children: readonly Inline[]): string {
  let out = '';
  for (const c of children) out += nodeText(c);
  return out;
}
