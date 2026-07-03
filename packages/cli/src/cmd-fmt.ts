// `wit fmt <file> [-w|--write]` — re-indent a .wit file to match its
// structural nesting. Prints to stdout by default; `-w` writes in place.
// Formatting requires the file to parse; a parse error is reported and
// nothing is written.

import * as fs from 'node:fs';
import { WitError, format } from '@witlang/parser';
import type { CliIo } from './bin.js';

export function runFmt(args: readonly string[], io: CliIo): number {
  const parsed = collectArgs(args, io);
  if (parsed === null) return 2;
  const source = readSource(parsed.file, io);
  if (source === null) return 1;
  let out: string;
  try {
    out = format(source);
  } catch (err) {
    io.stderr(formatStageError(err, parsed.file));
    return 1;
  }
  return emit(out, source, parsed, io);
}

interface FmtArgs {
  file: string;
  write: boolean;
}

function collectArgs(args: readonly string[], io: CliIo): FmtArgs | null {
  let file: string | undefined;
  let write = false;
  for (const a of args) {
    if (a === '-w' || a === '--write') { write = true; continue; }
    if (file === undefined) { file = a; continue; }
    io.stderr(`wit fmt: unexpected arg "${a}"\n`);
    return null;
  }
  if (file === undefined) { io.stderr('wit fmt: missing <file>\n'); return null; }
  return { file, write };
}

function readSource(file: string, io: CliIo): string | null {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (err) {
    io.stderr(`wit fmt: cannot read ${file}: ${(err as Error).message}\n`);
    return null;
  }
}

function emit(out: string, source: string, args: FmtArgs, io: CliIo): number {
  if (!args.write) { io.stdout(out); return 0; }
  if (out === source) { io.stdout(`unchanged ${args.file}\n`); return 0; }
  try {
    fs.writeFileSync(args.file, out, 'utf8');
    io.stdout(`formatted ${args.file}\n`);
    return 0;
  } catch (err) {
    io.stderr(`wit fmt: cannot write ${args.file}: ${(err as Error).message}\n`);
    return 1;
  }
}

function formatStageError(err: unknown, file: string): string {
  if (err instanceof WitError) {
    const { line, col } = err.loc;
    return `${file}:${line}:${col}: ${err.code}: ${err.message}\n`;
  }
  return `wit fmt: ${(err as Error).message ?? String(err)}\n`;
}
