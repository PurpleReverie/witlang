// `wit build <file> [-o output.{html,md}] [--format html|md] [--fragment]`
// — parse + resolve + expand the file then render it. Output format is
// inferred from the -o path extension when present, or taken from
// --format. The default (no -o, no --format) is HTML on stdout.
//
// HTML output defaults to a complete, self-contained styled document
// (doctype + <head> + inlined theme). Pass --fragment to emit just the
// bare `<article class="wit-doc">…</article>` for embedding.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parse, WitError } from '@witlang/parser';
import { resolve, expand, RuntimeError } from '@witlang/runtime';
import { renderHtml, rawThemeCss, type RenderHtmlOptions } from '@witlang/render-html';
import { renderMarkdown } from '@witlang/render-markdown';
import type { CliIo } from './bin.js';

export type OutputFormat = 'html' | 'md' | 'pdf';

export interface BuildArgs {
  file: string;
  outPath: string | undefined;
  format: OutputFormat;
  fragment: boolean;
  raw: boolean;
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
    raw: raw.raw,
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
  raw: boolean;
}

function collectRawArgs(args: readonly string[], io: CliIo): RawArgs | null {
  const raw: RawArgs = {
    file: undefined,
    outPath: undefined,
    format: undefined,
    fragment: false,
    raw: false,
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
  if (a === '--raw') { raw.raw = true; return i; }
  if (raw.file === undefined) { raw.file = a; return i; }
  io.stderr(`wit build: unexpected arg "${a}"\n`);
  return null;
}

function parseFormatFlag(value: string | undefined, io: CliIo): OutputFormat | null {
  if (value === undefined) {
    io.stderr('wit build: --format requires html|md|pdf\n');
    return null;
  }
  if (value === 'html' || value === 'md' || value === 'pdf') return value;
  io.stderr(`wit build: --format must be html, md or pdf (got "${value}")\n`);
  return null;
}

function resolveFormat(raw: RawArgs, io: CliIo): OutputFormat | null {
  if (raw.format !== undefined) return raw.format;
  if (raw.outPath === undefined) return 'html';
  const inferred = formatForExtension(raw.outPath);
  if (inferred !== null) return inferred;
  io.stderr(
    `wit build: E_UNKNOWN_OUTPUT_FORMAT: cannot infer format from "${raw.outPath}". ` +
      `Use .html/.htm/.md/.markdown/.pdf, or pass --format html|md|pdf.\n`,
  );
  return null;
}

function formatForExtension(outPath: string): OutputFormat | null {
  const ext = path.extname(outPath).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.md' || ext === '.markdown') return 'md';
  if (ext === '.pdf') return 'pdf';
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
  let expanded: ReturnType<typeof expand>;
  try {
    const doc = parse(source, args.file);
    const resolved = resolve(doc, { rootPath: path.resolve(args.file) });
    expanded = expand(resolved);
  } catch (err) {
    io.stderr(formatStageError(err, args.file));
    return 1;
  }
  if (args.format === 'pdf') return emitPdf(expanded, args, io);
  const rendered = args.format === 'md'
    ? renderMarkdown(expanded)
    : renderHtml(expanded, htmlOptions(args));
  return emit(rendered, args.outPath, io);
}

// HTML render options — three pathways:
//   default    → self-contained styled document (batteries-included theme).
//   --raw      → a full document with only a mechanical reset, so the file
//                styles everything itself via @@style + wrapping nodes.
//   --fragment → the bare <article> only, for embedding elsewhere.
// The <title> comes from the source filename.
function htmlOptions(args: BuildArgs): RenderHtmlOptions | undefined {
  if (args.fragment) return undefined;
  const opts: RenderHtmlOptions = { mode: 'document', title: titleFromPath(args.file) };
  if (args.raw) opts.css = rawThemeCss;
  return opts;
}

// PDF output — render the same self-contained document (default theme, or
// the reset-only `--raw` base), then paginate it with a headless system
// Chrome/Chromium. No npm dependency: we drive an already-installed browser.
// Both paths are for PDF — default gives a Word-like document, `--raw`
// gives a fully author-designed page (its own `@page` rules in `@@style`).
function emitPdf(
  expanded: ReturnType<typeof expand>, args: BuildArgs, io: CliIo,
): number {
  if (args.outPath === undefined) {
    io.stderr('wit build: PDF output needs an -o <file.pdf> path\n');
    return 1;
  }
  const chrome = findChrome();
  if (chrome === null) {
    io.stderr(
      'wit build: no headless Chrome/Chromium found for PDF output. Install ' +
      'Google Chrome, or point WIT_CHROME at a browser executable. ' +
      '(Or render to .html and convert with your own tool.)\n',
    );
    return 1;
  }
  const html = renderHtml(expanded, {
    mode: 'document',
    title: titleFromPath(args.file),
    ...(args.raw ? { css: rawThemeCss } : {}),
  });
  return runChromePdf(chrome, html, path.resolve(args.outPath), args.outPath, io);
}

function runChromePdf(
  chrome: string, html: string, outAbs: string, outLabel: string, io: CliIo,
): number {
  const tmpHtml = path.join(os.tmpdir(), `wit-${process.pid}-${Date.now()}.html`);
  try {
    fs.writeFileSync(tmpHtml, html, 'utf8');
    const res = spawnSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      '--no-pdf-header-footer', `--print-to-pdf=${outAbs}`,
      pathToFileURL(tmpHtml).href,
    ], { stdio: 'ignore', timeout: 60_000 });
    if (res.status !== 0 || !fs.existsSync(outAbs)) {
      const why = res.error?.message ?? `chrome exit ${res.status ?? res.signal}`;
      io.stderr(`wit build: PDF generation failed (${why}).\n`);
      return 1;
    }
  } catch (err) {
    io.stderr(`wit build: PDF generation error: ${(err as Error).message}\n`);
    return 1;
  } finally {
    try { fs.unlinkSync(tmpHtml); } catch { /* best-effort cleanup */ }
  }
  io.stdout(`wrote ${outLabel}\n`);
  return 0;
}

// Headless-capable browsers to try, in order. `WIT_CHROME`, when set,
// overrides the search entirely (no fallback) so it stays testable.
const CHROME_CANDIDATES: readonly string[] = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findChrome(): string | null {
  const override = process.env['WIT_CHROME'];
  if (override !== undefined && override !== '') {
    return fs.existsSync(override) ? override : null;
  }
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
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
