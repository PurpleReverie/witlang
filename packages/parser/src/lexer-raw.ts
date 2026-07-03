// Raw-node lexer for `@@name ... name@@` — literal-bodied node uses.
//
// `@@` (the doubled node sigil) opens a literal body: everything from after
// `@@name` up to the matching `name@@` close is captured verbatim. No Wit
// tokens are emitted inside, so `@`, `#`, `_`, `*`, `::` are all inert —
// this is how a Wit document embeds foreign syntax (code, CSS, math, ...).
// Mirrors the `<% %>` script-block recognizer (lexer-script.ts).
//
// Inline vs block follows the nodeOpen rule: block when a newline directly
// follows `@@name`, inline otherwise. The closer is the first literal
// `name@@`; if none is found, raise E_UNCLOSED_RAW_NODE at the open marker.
//
// Functions ≤ 20 lines (RULES 2). File ≤ 350 lines (RULES 1).

import { isAsciiLetter, isHandleChar } from './char.js';
import { ErrorCode } from './errors.js';
import {
  advance,
  bufHasAnyContent,
  flushTextRun,
  flushTextRunBeforeInline,
  LexerError,
  locFrom,
  snapshot,
} from './lexer-internals.js';
import type { Cursor, LexState, RunBuf } from './lexer-internals.js';
import type { RawNode } from './tokens.js';

export function tryRawNode(state: LexState, buf: RunBuf): boolean {
  const { src, cur } = state;
  if (src.charAt(cur.offset) !== '@') return false;
  if (src.charAt(cur.offset + 1) !== '@') return false;
  // `@@@` (triple) is the fully-frozen form; `@@` (double) interpolates.
  // Match greedily — check the third `@` before settling on double.
  const frozen = src.charAt(cur.offset + 2) === '@';
  const markerLen = frozen ? 3 : 2;
  if (!isAsciiLetter(src.charAt(cur.offset + markerLen))) return false;

  let bodyStart = cur.offset + markerLen;
  while (isHandleChar(src.charAt(bodyStart))) bodyStart += 1;
  const name = src.slice(cur.offset + markerLen, bodyStart);
  const closer = name + (frozen ? '@@@' : '@@');
  const closeAt = src.indexOf(closer, bodyStart);
  const inline = src.charAt(bodyStart) !== '\n';
  const start = snapshot(cur);
  if (closeAt === -1) throwUnclosed(state, start, bodyStart, name);

  if (inline && bufHasAnyContent(buf)) flushTextRunBeforeInline(state, buf);
  else flushTextRun(state, buf);
  const rawBody = src.slice(bodyStart, closeAt);
  emitRawNode(state, start, name, rawBody, inline, frozen, closeAt + closer.length);
  if (inline) state.afterInline = true;
  return true;
}

function emitRawNode(
  state: LexState, start: Cursor, name: string,
  rawBody: string, inline: boolean, frozen: boolean, endOffset: number,
): void {
  while (state.cur.offset < endOffset) advance(state);
  const tok: RawNode = {
    kind: 'rawNode',
    name,
    text: trimBoundary(rawBody, inline),
    inline,
    frozen,
    loc: locFrom(state.file, start, state.cur),
  };
  state.tokens.push(tok);
}

function trimBoundary(raw: string, inline: boolean): string {
  // Drop exactly one boundary whitespace the markers introduce: a leading
  // newline (block) or space/tab (inline) and the symmetric trailing one.
  // Interior bytes are preserved byte-for-byte.
  const lead = inline ? /^[ \t]/ : /^\n/;
  const trail = inline ? /[ \t]$/ : /\n$/;
  return raw.replace(lead, '').replace(trail, '');
}

function throwUnclosed(
  state: LexState, start: Cursor, endOffset: number, name: string,
): never {
  throw new LexerError(
    ErrorCode.E_UNCLOSED_RAW_NODE,
    `unclosed @@${name} (expected ${name}@@)`,
    {
      file: state.file,
      line: start.line,
      col: start.col,
      offset: start.offset,
      length: endOffset - start.offset,
    },
  );
}
