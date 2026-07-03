// `wit build <file> [-o output.{html,md}] [--format html|md] [--fragment]`
// — parse + resolve + expand the file then render it. Output format is
// inferred from the -o path extension when present, or taken from
// --format. The default (no -o, no --format) is HTML on stdout.
//
// HTML output defaults to a complete, self-contained styled document
// (doctype + <head> + inlined theme). Pass --fragment to emit just the
// bare `<article class="wit-doc">…</article>` for embedding.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse, WitError } from '@witlang/parser';
import { resolve, expand, RuntimeError } from '@witlang/runtime';
import { renderHtml, type RenderHtmlOptions } from '@witlang/render-html';
import { renderMarkdown } from '@witlang/render-markdown';
import type { CliIo } from './bin.js';

export type OutputFormat = 'html' | 'md';

export interface BuildArgs {
  file: string;
  outPath: string | undefined;
  format: OutputFormat;
  fragment: boolean;
}

export function runBuild(args: readonly string[], io: CliIo): number {
  const raw = collectRawArgs(args, io);
  if (raw === null) return 2;
  if (raw.file === undefined) {
    io.stderr('wit build: missing <file>\n');
    return 2;
  }
  const format = resolveFormat(raw, io);
  if (format === null) return 1;
  const parsed: BuildArgs = {
    file: raw.file,
    outPath: raw.outPath,
    format,
    fragment: raw.fragment,
  };
  const source = readSource(parsed.file, io);
  if (source === null) return 1;
  return performBuild(parsed, source, io);
}

interface RawArgs {
  file: string | undefined;
  outPath: string | undefined;
  format: OutputFormat | undefined;
  fragment: boolean;
}

function collectRawArgs(args: readonly string[], io: CliIo): RawArgs | null {
  const raw: RawArgs = {
    file: undefined,
    outPath: undefined,
    format: undefined,
    fragment: false,
  };
  for (let i = 0; i < args.length; i++) {
    const next = applyArg(args, i, raw, io);
    if (next === null) return null;
    i = next;
  }
  return raw;
}

function applyArg(args: readonly string[], i: number, raw: RawArgs, io: CliIo): number | null {
  const a = args[i]!;
  if (a === '-o' || a === '--out') {
    raw.outPath = args[i + 1];
    if (raw.outPath === undefined) { io.stderr('wit build: -o requires a path\n'); return null; }
    return i + 1;
  }
  if (a === '--format') {
    const parsed = parseFormatFlag(args[i + 1], io);
    if (parsed === null) return null;
    raw.format = parsed;
    return i + 1;
  }
  if (a === '--fragment') { raw.fragment = true; return i; }
  if (raw.file === undefined) { raw.file = a; return i; }
  io.stderr(`wit build: unexpected arg "${a}"\n`);
  return null;
}

function parseFormatFlag(value: string | undefined, io: CliIo): OutputFormat | null {
  if (value === undefined) {
    io.stderr('wit build: --format requires html|md\n');
    return null;
  }
  if (value === 'html' || value === 'md') return value;
  io.stderr(`wit build: --format must be html or md (got "${value}")\n`);
  return null;
}

function resolveFormat(raw: RawArgs, io: CliIo): OutputFormat | null {
  if (raw.format !== undefined) return raw.format;
  if (raw.outPath === undefined) return 'html';
  const inferred = formatForExtension(raw.outPath);
  if (inferred !== null) return inferred;
  io.stderr(
    `wit build: E_UNKNOWN_OUTPUT_FORMAT: cannot infer format from "${raw.outPath}". ` +
      `Use .html/.htm/.md/.markdown, or pass --format html|md.\n`,
  );
  return null;
}

function formatForExtension(outPath: string): OutputFormat | null {
  const ext = path.extname(outPath).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.md' || ext === '.markdown') return 'md';
  return null;
}

function readSource(file: string, io: CliIo): string | null {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (err) {
    io.stderr(`wit build: cannot read ${file}: ${(err as Error).message}\n`);
    return null;
  }
}

function performBuild(args: BuildArgs, source: string, io: CliIo): number {
  try {
    const doc = parse(source, args.file);
    const resolved = resolve(doc, { rootPath: path.resolve(args.file) });
    const expanded = expand(resolved);
    const rendered = args.format === 'md'
      ? renderMarkdown(expanded)
      : renderHtml(expanded, htmlOptions(args));
    return emit(rendered, args.outPath, io);
  } catch (err) {
    io.stderr(formatStageError(err, args.file));
    return 1;
  }
}

// HTML render options. The CLI emits a complete, self-contained styled
// document by default (so `wit build -o out.html` "just looks right"),
// and the bare fragment only when `--fragment` is passed. The <title>
// comes from the source filename.
function htmlOptions(args: BuildArgs): RenderHtmlOptions | undefined {
  if (args.fragment) return undefined;
  return { mode: 'document', title: titleFromPath(args.file) };
}

function titleFromPath(file: string): string {
  const base = path.basename(file);
  const ext = path.extname(base);
  return ext.length > 0 ? base.slice(0, -ext.length) : base;
}

function emit(rendered: string, outPath: string | undefined, io: CliIo): number {
  if (outPath === undefined) { io.stdout(rendered); return 0; }
  try {
    fs.writeFileSync(outPath, rendered, 'utf8');
    io.stdout(`wrote ${outPath}\n`);
    return 0;
  } catch (err) {
    io.stderr(`wit build: cannot write ${outPath}: ${(err as Error).message}\n`);
    return 1;
  }
}

function formatStageError(err: unknown, file: string): string {
  if (err instanceof WitError || err instanceof RuntimeError) {
    const { line, col } = err.loc;
    return `${file}:${line}:${col}: ${err.code}: ${err.message}\n`;
  }
  return `wit build: ${(err as Error).message ?? String(err)}\n`;
}
