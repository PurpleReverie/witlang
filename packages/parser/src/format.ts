// `wit fmt` core — a safe, structural re-indenter.
//
// It parses the source, computes each line's nesting depth from the AST,
// then rewrites ONLY the leading whitespace of each line. Content is never
// reparsed or reflowed, so prose is preserved exactly. Regions whose inner
// whitespace is significant — raw `@@` bodies, `<% %>` scripts, record/data
// values, and form-fill bodies — are marked verbatim and left untouched.
//
// Depth is a function of structural nesting alone: flat prose stays flat, a
// nested container tree gets indented. So it never *forces* indentation on a
// prose-first document — there's simply nothing to indent.
//
// Functions ≤ 20 lines (RULES 2). File ≤ 350 lines (RULES 1).

import { parse } from './parser.js';
import type { Block, Inline } from './ast.js';
import type { Loc } from './loc.js';

export interface FormatOptions {
  indent: string;
}

type Node = Block | Inline;

interface Ctx {
  lineStarts: number[];
  depth: number[];
  verbatim: boolean[];
}

export function format(source: string, opts: FormatOptions = { indent: '  ' }): string {
  const doc = parse(source);
  const lines = source.split('\n');
  const ctx: Ctx = {
    lineStarts: computeLineStarts(lines),
    depth: new Array<number>(lines.length).fill(0),
    verbatim: new Array<boolean>(lines.length).fill(false),
  };
  layout(doc.children, 0, ctx);
  return lines
    .map((line, i) => reindent(line, ctx.depth[i]!, ctx.verbatim[i]!, opts.indent))
    .join('\n');
}

function layout(children: readonly Node[], d: number, ctx: Ctx): void {
  for (const child of children) {
    const start = child.loc.line - 1;
    const end = endLine(child.loc, ctx.lineStarts);
    if (isVerbatim(child)) {
      for (let i = start; i <= end; i++) mark(ctx.verbatim, i, true);
      continue;
    }
    const body = bodyOf(child);
    if (body !== null && body.length > 0 && end > start) {
      layout(body, indentsBody(child) ? d + 1 : d, ctx);
      setDepth(ctx.depth, start, d);
      setDepth(ctx.depth, end, d);
    } else {
      for (let i = start; i <= end; i++) setDepth(ctx.depth, i, d);
    }
  }
}

// Layout containers (`@div … div@`) and statements indent their bodies. A
// definition does NOT — its body sits flush under the `#name`, matching how
// prose-first documents are written (a chapter's prose stays at the margin).
function indentsBody(node: Node): boolean {
  return node.kind === 'nodeUse'
    || node.kind === 'ifStatement'
    || node.kind === 'eachStatement';
}

// A container whose children indent one level. Raw / script / data / form-fill
// bodies are NOT containers here — they are verbatim (handled separately).
function bodyOf(node: Node): readonly Node[] | null {
  if (node.kind === 'nodeUse') return node.body;
  if (node.kind === 'nodeDef') return node.body as readonly Node[];
  if (node.kind === 'eachStatement') return node.body;
  if (node.kind === 'ifStatement') return [...node.then, ...(node.else ?? [])];
  return null;
}

// Regions whose interior whitespace carries meaning — leave them exactly as
// written so the formatter can never corrupt a value or a raw payload.
function isVerbatim(node: Node): boolean {
  if (node.kind === 'scriptBlock') return true;
  if (node.kind === 'dataDef') return true;
  if (node.kind === 'nodeUse') {
    return node.raw === true || node.paramsSource === 'form-fill';
  }
  return false;
}

function reindent(line: string, d: number, verbatim: boolean, unit: string): string {
  if (verbatim) return line;
  const content = line.replace(/^[ \t]+/, '');
  if (content.length === 0) return '';
  return unit.repeat(Math.max(0, d)) + content;
}

function setDepth(depth: number[], line: number, d: number): void {
  if (line >= 0 && line < depth.length) depth[line] = d;
}

function mark(flags: boolean[], line: number, value: boolean): void {
  if (line >= 0 && line < flags.length) flags[line] = value;
}

function endLine(loc: Loc, lineStarts: number[]): number {
  const lastCharOffset = loc.offset + Math.max(0, loc.length - 1);
  return lineOf(lastCharOffset, lineStarts);
}

function computeLineStarts(lines: string[]): number[] {
  const starts: number[] = [0];
  let offset = 0;
  for (const line of lines) {
    offset += line.length + 1;
    starts.push(offset);
  }
  return starts;
}

function lineOf(offset: number, starts: number[]): number {
  let lo = 0;
  let hi = starts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid]! <= offset) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return ans;
}
