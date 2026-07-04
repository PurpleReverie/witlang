// CLI implementation of the external-data seam. Builds a DataLoader that
// the runtime's load pass calls once per `@load <alias>` use.
//
// Two source kinds:
//   • `env`     — built in, no config. Returns the process environment
//                 (optionally merged with a --env dotenv file) as a record.
//   • <alias>   — looked up in the --sources config; runs the named program
//                 and parses its stdout by the declared `format`. Gated
//                 behind --allow-exec so a document can never run a command
//                 the operator didn't configure.
//
// Config is JSON for now (zero new dependency — Wit already parses JSON);
// the schema is format-agnostic, so swapping to TOML later changes only
// readConfig. Captures reach the program two ways: `{{name}}` substituted
// into the argv, and the full capture object as JSON on stdin.

import * as fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { DataLoader, DataLoadRequest } from '@witlang/runtime';

type Format = 'json' | 'csv' | 'tsv' | 'lines' | 'text' | 'svg' | 'html';

interface SourceSpec {
  run: string[];
  format?: Format;
  timeoutMs?: number;
}

interface SourcesConfig {
  sources: Record<string, SourceSpec>;
}

export interface DataSourceOptions {
  sourcesPath?: string; // path to wit.sources.json
  envPath?: string; // path to a dotenv file
  allowExec: boolean;
  cwd: string;
}

export function makeDataLoader(opts: DataSourceOptions): DataLoader {
  const config = opts.sourcesPath ? readConfig(opts.sourcesPath) : { sources: {} };
  const env = loadEnv(opts.envPath);
  return (req: DataLoadRequest): unknown => {
    if (req.alias === 'env') return env;
    const spec = config.sources[req.alias];
    if (spec === undefined) {
      throw new Error(
        `no source configured for alias "${req.alias}" — add it to ${opts.sourcesPath ?? 'a --sources file'}`,
      );
    }
    if (!opts.allowExec) {
      throw new Error(
        `running programs is disabled; pass --allow-exec to run "${req.alias}"`,
      );
    }
    return runSource(spec, req.args, env, opts.cwd);
  };
}

// ---------------------------------------------------------------------------
// Config + environment.
// ---------------------------------------------------------------------------

function readConfig(sourcesPath: string): SourcesConfig {
  let text: string;
  try {
    text = fs.readFileSync(sourcesPath, 'utf8');
  } catch (err) {
    throw new Error(`cannot read sources file ${sourcesPath}: ${(err as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`invalid JSON in ${sourcesPath}: ${(err as Error).message}`);
  }
  const sources = (parsed as SourcesConfig)?.sources;
  if (sources === undefined || typeof sources !== 'object') {
    throw new Error(`${sourcesPath}: expected a top-level "sources" object`);
  }
  return { sources };
}

function loadEnv(envPath: string | undefined): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) merged[k] = v;
  }
  if (envPath !== undefined) {
    for (const [k, v] of Object.entries(parseDotenv(envPath))) merged[k] = v;
  }
  return merged;
}

function parseDotenv(envPath: string): Record<string, string> {
  let text: string;
  try {
    text = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    throw new Error(`cannot read --env file ${envPath}: ${(err as Error).message}`);
  }
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Program invocation.
// ---------------------------------------------------------------------------

function runSource(
  spec: SourceSpec,
  args: Record<string, string>,
  env: Record<string, string>,
  cwd: string,
): unknown {
  if (!Array.isArray(spec.run) || spec.run.length === 0) {
    throw new Error('source "run" must be a non-empty argv array');
  }
  const argv = spec.run.map((tok) => substitute(tok, args));
  const res = spawnSync(argv[0]!, argv.slice(1), {
    cwd,
    env,
    input: JSON.stringify(args),
    encoding: 'utf8',
    timeout: spec.timeoutMs ?? 30_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error) throw new Error(res.error.message);
  if (res.status !== 0) {
    const why = (res.stderr ?? '').trim() || `exit ${res.status ?? res.signal}`;
    throw new Error(why);
  }
  return parseOutput(res.stdout ?? '', spec.format ?? 'json');
}

// `{{name}}` in an argv token is replaced by the capture value (missing → '').
function substitute(token: string, args: Record<string, string>): string {
  return token.replace(/\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g, (_m, name: string) =>
    args[name] ?? '',
  );
}

function parseOutput(stdout: string, format: Format): unknown {
  switch (format) {
    case 'json':
      return stdout.trim() === '' ? null : JSON.parse(stdout);
    case 'csv':
      return parseDelimited(stdout, ',');
    case 'tsv':
      return parseDelimited(stdout, '\t');
    case 'lines':
      return stdout.split(/\r?\n/).filter((l) => l.length > 0);
    case 'text':
    case 'svg':
    case 'html':
      return stdout;
  }
}

// Minimal delimited parser: first row is the header, each later row becomes
// a record keyed by the header. No quoted-field handling (kept simple).
function parseDelimited(text: string, sep: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(sep).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(sep);
    const rec: Record<string, string> = {};
    header.forEach((h, i) => {
      rec[h] = (cells[i] ?? '').trim();
    });
    return rec;
  });
}
