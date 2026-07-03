// Tests for the `wit fmt` structural re-indenter.

import { describe, it, expect } from 'vitest';
import { format } from './format.js';

describe('format — structural re-indent', () => {
  it('re-indents a nested container tree by nesting depth', () => {
    const messy = '@div(class a)\n     @div(class b)\n@p hi p@\n  div@\ndiv@\n';
    expect(format(messy)).toBe(
      '@div(class a)\n  @div(class b)\n    @p hi p@\n  div@\ndiv@\n',
    );
  });

  it('keeps a definition body flush; only containers indent', () => {
    const src = '#foreword\n@div(class band)\n@p hi p@\ndiv@\nforeword#\n';
    expect(format(src)).toBe(
      '#foreword\n@div(class band)\n  @p hi p@\ndiv@\nforeword#\n',
    );
  });

  it('leaves a prose-first document flat', () => {
    const src = '#chapter\n\nFirst para.\n\nSecond para.\n\nchapter#\n';
    expect(format(src)).toBe(src);
  });

  it('leaves a raw @@ body exactly as written', () => {
    const src = '@div(class x)\n@@style\n.a { color: red }\n    .b { margin: 0 }\nstyle@@\ndiv@\n';
    expect(format(src)).toContain('.a { color: red }\n    .b { margin: 0 }');
  });

  it('collapses blank/whitespace-only lines to truly empty lines', () => {
    expect(format('@div(class a)\n   \n@p x p@\ndiv@\n')).toBe(
      '@div(class a)\n\n  @p x p@\ndiv@\n',
    );
  });

  it('is idempotent', () => {
    const src = '@div(class a)\n@div(class b)\nprose\ndiv@\ndiv@\n';
    const once = format(src);
    expect(format(once)).toBe(once);
  });
});
