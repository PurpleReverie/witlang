// HTML rendering for the core reserved vocabulary (M10.core-vocab).
//
// Each core-vocab name maps to one HTML element. Param names mirror
// the element's attribute names (e.g. `@a |href ...|` → `<a href=...>`)
// — only a small allowlist per element makes it through escapeHtml.
//
// `@node(type X)` is special: it's a universal opaque pass-through.
// Render strategy: dispatch on `type` if recognized as core-vocab,
// otherwise emit a tag derived from `type` (or a `<div data-wit-type=...>`).

import type { NodeUse, Param } from '@witlang/parser';
import { isCoreVocabName, RESERVED_OPAQUE } from '@witlang/runtime';
import { escapeHtml } from './escape.js';

export type BodyRenderer = (use: NodeUse) => string;

export function tryRenderCore(
  use: NodeUse, renderBody: BodyRenderer,
): string | null {
  if (use.name === RESERVED_OPAQUE) return renderOpaque(use, renderBody);
  if (!isCoreVocabName(use.name)) return null;
  return renderCoreElement(use.name, use, renderBody);
}

// ---------------------------------------------------------------------------
// @node dispatch — pick a tag from `type` param.
// ---------------------------------------------------------------------------

function renderOpaque(use: NodeUse, renderBody: BodyRenderer): string {
  const type = paramValue(use.params, 'type');
  if (type !== undefined && isCoreVocabName(type)) {
    return renderCoreElement(type, use, renderBody);
  }
  // Unknown type → emit a generic div carrying every param as data-*.
  const attrs = passThroughAttrs(use.params);
  const body = renderBody(use);
  return `<div${attrs}>${body}</div>`;
}

function passThroughAttrs(params: readonly Param[]): string {
  let out = '';
  for (const p of params) {
    if (p.name === null) continue;
    out += ` data-${attrName(p.name)}="${escapeHtml(p.value)}"`;
  }
  return out;
}

function attrName(name: string): string {
  return escapeHtml(name).replace(/[^a-zA-Z0-9_-]/g, '-');
}

// ---------------------------------------------------------------------------
// Core element dispatch.
// ---------------------------------------------------------------------------

function renderCoreElement(
  tag: string, use: NodeUse, renderBody: BodyRenderer,
): string {
  if (tag === 'a') return renderAnchor(use, renderBody);
  if (tag === 'img') return renderImg(use);
  if (tag === 'figure') return renderFigure(use, renderBody);
  if (tag === 'row') return renderRow(use, renderBody);
  if (tag === 'col') return renderColumn(use, renderBody);
  if (tag === 'audio' || tag === 'video') return renderMedia(tag, use, renderBody);
  if (tag === 'br' || tag === 'hr') return `<${tag}>`;
  if (tag === 'table') {
    // table handled in render-table; this branch is a fallback.
    return renderGeneric(tag, use, renderBody);
  }
  return renderGeneric(tag, use, renderBody);
}

function renderGeneric(
  tag: string, use: NodeUse, renderBody: BodyRenderer,
): string {
  const attrs = coreAttrs(use.params, tag);
  const body = renderBody(use);
  return `<${tag}${attrs}>${flattenIfInline(tag, body)}</${tag}>`;
}

// Inline-context core elements unwrap a single leading `<p>...</p>` so
// `@h1 Title h1@` (whose body is a Paragraph) renders as `<h1>Title</h1>`
// instead of `<h1><p>Title</p></h1>`. `p` itself is included: a `@p …` body
// is already a Paragraph, so without the unwrap `@p x p@` would nest an
// invalid `<p><p>x</p></p>`.
const INLINE_CONTEXT_TAGS = new Set<string>([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'em', 'strong', 'code', 'u', 's', 'sub', 'sup', 'mark', 'small',
  'a', 'figcaption', 'caption', 'th', 'td', 'li', 'dt', 'dd', 'cite',
  'p',
]);

function flattenIfInline(tag: string, body: string): string {
  if (!INLINE_CONTEXT_TAGS.has(tag)) return body;
  const m = /^<p>([\s\S]*)<\/p>$/.exec(body.trim());
  if (m === null) return body.trim();
  return m[1]!.trim();
}

function renderAnchor(use: NodeUse, renderBody: BodyRenderer): string {
  const href = escapeHtml(paramValue(use.params, 'href') ?? '#');
  const target = paramValue(use.params, 'target');
  const targetAttr = target !== undefined ? ` target="${escapeHtml(target)}"` : '';
  return `<a href="${href}"${targetAttr}>${flattenIfInline('a', renderBody(use))}</a>`;
}

function renderImg(use: NodeUse): string {
  const src = escapeHtml(paramValue(use.params, 'src') ?? '');
  const alt = escapeHtml(paramValue(use.params, 'alt') ?? '');
  let extra = '';
  const w = paramValue(use.params, 'width');
  if (w !== undefined) extra += ` width="${escapeHtml(w)}"`;
  const h = paramValue(use.params, 'height');
  if (h !== undefined) extra += ` height="${escapeHtml(h)}"`;
  const style = layoutStyle(use.params, 'img');
  if (style !== '') extra += ` style="${escapeHtml(style)}"`;
  return `<img src="${src}" alt="${alt}"${extra}>`;
}

function renderFigure(use: NodeUse, renderBody: BodyRenderer): string {
  const style = layoutStyle(use.params, 'figure');
  const styleAttr = style !== '' ? ` style="${escapeHtml(style)}"` : '';
  // A single-line `@figcaption` parses inline and is grouped into a Paragraph,
  // so it arrives wrapped in `<p>`. `<figcaption>` is block-level and must not
  // sit inside a `<p>` — unwrap a paragraph that holds only the caption.
  const body = renderBody(use).replace(
    /<p>(\s*<figcaption[\s\S]*?<\/figcaption>\s*)<\/p>/g, '$1',
  );
  return `<figure${styleAttr}>${body}</figure>`;
}

// Invisible layout: `@row` is a flex band, each `@col` a side-by-side block.
// No floats — content after the row simply continues below. A `@col |size …|`
// is fixed-width; a bare `@col` fills the remaining space. Columns wrap
// (stack) when the row is too narrow.
const ROW_STYLE =
  'display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin:1.2em 0';

function renderRow(use: NodeUse, renderBody: BodyRenderer): string {
  return `<div style="${ROW_STYLE}">${renderBody(use)}</div>`;
}

function renderColumn(use: NodeUse, renderBody: BodyRenderer): string {
  const size = paramValue(use.params, 'size');
  const basis = size !== undefined ? resolveColumnBasis(size.trim().toLowerCase()) : null;
  const style =
    basis !== null ? `flex:0 0 ${basis};min-width:0` : 'flex:1 1 0;min-width:0';
  return `<div style="${style}">${renderBody(use)}</div>`;
}

// A column's `size` is its width: a preset (small/medium/large), a number
// (px), or a percent. No size → the column flexes to fill.
function resolveColumnBasis(size: string): string | null {
  if (size in SIZE_PRESETS) return SIZE_PRESETS[size]!;
  if (/^\d+$/.test(size)) return `${size}px`;
  if (/^\d+px$/.test(size)) return size;
  if (/^\d+(\.\d+)?%$/.test(size)) return size;
  return null;
}

// Writer-friendly size + placement, no CSS knowledge required. `|size …|`
// takes a preset (small/medium/large/full) or a raw number (px) / percent;
// `|align …|` is left / center / right. Both compile to a self-contained
// inline style so they work in every pathway (default, --raw, and PDF).
//
// `align` means different things per element: on an image it block-aligns
// the image itself; on a figure it aligns the figure's *contents* (the
// image and caption together), which is what a writer expects.
const SIZE_PRESETS: Record<string, string> = {
  small: '220px',
  medium: '380px',
  large: '600px',
};

function layoutStyle(params: readonly Param[], tag: 'img' | 'figure'): string {
  const decls: string[] = [];
  const size = paramValue(params, 'size');
  if (size !== undefined) {
    const sizing = resolveSize(size.trim().toLowerCase());
    if (sizing !== null) {
      decls.push(sizing, 'height:auto');
      // a capped figure shrinks below full width, so centre the box itself
      if (tag === 'figure' && sizing.startsWith('max-width')) {
        decls.push('margin-left:auto', 'margin-right:auto');
      }
    }
  }
  const align = paramValue(params, 'align');
  if (align !== undefined) {
    const a = align.trim().toLowerCase();
    if (tag === 'figure') {
      if (a === 'center' || a === 'right' || a === 'left') decls.push(`text-align:${a}`);
    } else if (a === 'center') {
      decls.push('display:block', 'margin-left:auto', 'margin-right:auto');
    } else if (a === 'right') {
      decls.push('display:block', 'margin-left:auto');
    } else if (a === 'left') {
      decls.push('display:block', 'margin-right:auto');
    }
  }
  return decls.join(';');
}

// Returns a single CSS declaration. Named presets and explicit pixel values
// *cap* the image (max-width — never upscale). `full` and any percent *fill*
// that fraction of the column (width — so `full` genuinely spans it).
function resolveSize(size: string): string | null {
  if (size === 'full') return 'width:100%';
  if (size in SIZE_PRESETS) return `max-width:${SIZE_PRESETS[size]}`;
  if (/^\d+$/.test(size)) return `max-width:${size}px`;
  if (/^\d+px$/.test(size)) return `max-width:${size}`;
  if (/^\d+(\.\d+)?%$/.test(size)) return `width:${size}`;
  return null;
}

function renderMedia(
  tag: 'audio' | 'video', use: NodeUse, renderBody: BodyRenderer,
): string {
  const src = paramValue(use.params, 'src');
  const srcAttr = src !== undefined ? ` src="${escapeHtml(src)}"` : '';
  const controls = paramFlag(use.params, 'controls');
  const ctlAttr = controls ? ' controls' : '';
  return `<${tag}${srcAttr}${ctlAttr}>${renderBody(use)}</${tag}>`;
}

// ---------------------------------------------------------------------------
// Per-tag attribute mapping (the lean: explicit allowlist; ignore extras).
// ---------------------------------------------------------------------------

function coreAttrs(params: readonly Param[], _tag: string): string {
  // Generic core elements get only an optional `id` and `class` attr if
  // explicitly supplied — keeps the renderer's surface area predictable.
  let out = '';
  const id = paramValue(params, 'id');
  if (id !== undefined) out += ` id="${escapeHtml(id)}"`;
  const cls = paramValue(params, 'class');
  if (cls !== undefined) out += ` class="${escapeHtml(cls)}"`;
  return out;
}

export function paramValue(
  params: readonly Param[], name: string,
): string | undefined {
  for (const p of params) if (p.name === name) return p.value;
  return undefined;
}

function paramFlag(params: readonly Param[], name: string): boolean {
  for (const p of params) if (p.name === name) return true;
  return false;
}
