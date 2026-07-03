// Raw-node tests for `@@name ... name@@` literal-bodied node uses.
// Verifies: verbatim body capture (Wit sigils inert), inline vs block
// detection, boundary-whitespace trimming, and the unclosed error.

import { describe, expect, it } from 'vitest';

import { parse, ParseError } from './parser.js';
import type { Block, NodeUse, Paragraph, Text } from './ast.js';

function firstBlock(source: string): Block {
  const doc = parse(source);
  expect(doc.children.length).toBeGreaterThan(0);
  return doc.children[0]!;
}

function rawBody(use: NodeUse): string {
  expect(use.raw).toBe(true);
  const child = (use.body ?? [])[0] as Text | undefined;
  return child?.value ?? '';
}

describe('raw node — @@name ... name@@', () => {
  it('captures a block body verbatim, leaving @ # _ * inert', () => {
    const block = firstBlock('@@pre\ndef f(@x, #y):\n    return _a_ * 2\npre@@\n');
    const use = block as NodeUse;
    expect(use.kind).toBe('nodeUse');
    expect(use.name).toBe('pre');
    expect(use.inline).toBe(false);
    expect(rawBody(use)).toBe('def f(@x, #y):\n    return _a_ * 2');
  });

  it('parses an inline raw span inside a paragraph', () => {
    const para = firstBlock('Call @@code map(f, @xs) code@@ now.\n') as Paragraph;
    expect(para.kind).toBe('paragraph');
    const use = para.children.find((c) => c.kind === 'nodeUse') as NodeUse;
    expect(use.raw).toBe(true);
    expect(use.inline).toBe(true);
    expect(rawBody(use)).toBe('map(f, @xs)');
  });

  it('does not interpret a closer buried mid-line (only name@@ closes)', () => {
    const use = firstBlock('@@css\n.x { color: red }\ncss@@\n') as NodeUse;
    expect(rawBody(use)).toBe('.x { color: red }');
  });

  it('keeps an empty body as an empty body', () => {
    const use = firstBlock('@@code\ncode@@\n') as NodeUse;
    expect(use.body).toEqual([]);
  });

  it('double @@ is not frozen (interpolation allowed downstream)', () => {
    const use = firstBlock('@@code\nx\ncode@@\n') as NodeUse;
    expect(use.frozen).toBe(false);
  });

  it('triple @@@ is frozen and captures {{...}} verbatim', () => {
    const use = firstBlock('@@@tpl\n<div>{{ user.name }}</div>\ntpl@@@\n') as NodeUse;
    expect(use.raw).toBe(true);
    expect(use.frozen).toBe(true);
    expect(rawBody(use)).toBe('<div>{{ user.name }}</div>');
  });

  it('raises E_UNCLOSED_RAW_NODE when the closer is missing', () => {
    expect(() => parse('@@code\nnever closed\n')).toThrow(ParseError);
    try {
      parse('@@code\nnope\n');
    } catch (err) {
      expect((err as ParseError).code).toBe('E_UNCLOSED_RAW_NODE');
    }
  });
});
