// Builds a NodeUse from a `rawNode` token (`@@name ... name@@`). The literal
// body becomes a single verbatim Text child and `raw: true` flags it so
// resolve / expand treat the body as opaque (no interpolation, no re-parse)
// and renderers know to emit it as-is.

import type { NodeUse, Param, Text } from './ast.js';
import type { Loc } from './loc.js';
import type { TokenCursor } from './parser-cursor.js';
import type { RawNode } from './tokens.js';

export function parseRawNodeUse(cursor: TokenCursor): NodeUse {
  const tok = cursor.advance() as RawNode;
  const text: Text = { kind: 'text', value: tok.text, loc: tok.loc };
  const params = parseRawParams(tok.params, tok.loc);
  return {
    kind: 'nodeUse',
    name: tok.name,
    access: [],
    params,
    paramsSource: params.length > 0 ? 'parens' : 'none',
    body: tok.text.length > 0 ? [text] : [],
    inline: tok.inline,
    closeStyle: 'named',
    raw: true,
    frozen: tok.frozen,
    loc: tok.loc,
  };
}

// Parse glued `(key value)` group(s) on a raw node into params. Each group is
// one param; the first space splits name from value (a value-only group is
// positional). Enough for metadata like `(engine asciimath)`.
function parseRawParams(src: string | undefined, loc: Loc): Param[] {
  if (src === undefined || src === '') return [];
  const out: Param[] = [];
  const re = /\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const inner = m[1]!.trim();
    if (inner === '') continue;
    const sp = inner.indexOf(' ');
    if (sp === -1) out.push({ name: null, value: inner, loc });
    else out.push({ name: inner.slice(0, sp), value: inner.slice(sp + 1).trim(), loc });
  }
  return out;
}
