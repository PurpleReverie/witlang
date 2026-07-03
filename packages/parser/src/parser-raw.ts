// Builds a NodeUse from a `rawNode` token (`@@name ... name@@`). The literal
// body becomes a single verbatim Text child and `raw: true` flags it so
// resolve / expand treat the body as opaque (no interpolation, no re-parse)
// and renderers know to emit it as-is.

import type { NodeUse, Text } from './ast.js';
import type { TokenCursor } from './parser-cursor.js';
import type { RawNode } from './tokens.js';

export function parseRawNodeUse(cursor: TokenCursor): NodeUse {
  const tok = cursor.advance() as RawNode;
  const text: Text = { kind: 'text', value: tok.text, loc: tok.loc };
  return {
    kind: 'nodeUse',
    name: tok.name,
    access: [],
    params: [],
    paramsSource: 'none',
    body: tok.text.length > 0 ? [text] : [],
    inline: tok.inline,
    closeStyle: 'named',
    raw: true,
    frozen: tok.frozen,
    loc: tok.loc,
  };
}
