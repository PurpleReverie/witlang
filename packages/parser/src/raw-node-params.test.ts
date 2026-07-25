// Params glued to a raw node's name: `@@math(engine asciimath) … math@@`.

import { describe, it, expect } from 'vitest';
import { parse } from './index.js';

interface AnyNode { kind?: string; children?: AnyNode[]; body?: AnyNode[] }

function firstNodeUse(node: AnyNode): AnyNode | null {
  if (node.kind === 'nodeUse') return node;
  for (const kid of node.children ?? node.body ?? []) {
    const found = firstNodeUse(kid);
    if (found !== null) return found;
  }
  return null;
}

describe('raw node params — @@name(k v)', () => {
  it('captures a glued (engine asciimath) param, body stays verbatim', () => {
    const use = firstNodeUse(parse('@@math(engine asciimath) x^2 math@@', 't')) as
      { name: string; raw: boolean; paramsSource: string;
        params: { name: string | null; value: string }[]; body: { value: string }[] };
    expect(use.name).toBe('math');
    expect(use.raw).toBe(true);
    expect(use.paramsSource).toBe('parens');
    expect(use.params).toEqual([{ name: 'engine', value: 'asciimath', loc: expect.anything() }]);
    expect(use.body[0]!.value).toBe('x^2');
  });

  it('treats a spaced paren as body, not a param', () => {
    const use = firstNodeUse(parse('@@math (a+b) math@@', 't')) as
      { params: unknown[]; body: { value: string }[] };
    expect(use.params).toEqual([]);
    expect(use.body[0]!.value).toContain('(a+b)');
  });

  it('leaves an ordinary raw node (no glued paren) param-free', () => {
    const use = firstNodeUse(parse('@@style .a{color:red} style@@', 't')) as
      { paramsSource: string; params: unknown[] };
    expect(use.paramsSource).toBe('none');
    expect(use.params).toEqual([]);
  });
});
