// Document-mode rendering tests (self-contained styled HTML page).

import { describe, it, expect } from 'vitest';
import { parse } from '@witlang/parser';
import { resolve, expand } from '@witlang/runtime';
import { renderHtml } from './render.js';
import { defaultThemeCss } from './theme.js';

function expanded(src: string) {
  return expand(resolve(parse(src)));
}

describe('renderHtml — empty paragraphs', () => {
  it('drops paragraphs that render to nothing', () => {
    // Two real paragraphs around an omitted definition + blank lines.
    const out = renderHtml(expanded('First.\n\n#x: 1 !!\n\nSecond.\n'));
    expect(out).not.toContain('<p></p>');
    expect(out).toContain('<p>First.</p>');
    expect(out).toContain('<p>Second.</p>');
  });
});

describe('renderHtml — fragment mode (default)', () => {
  it('emits only the bare article with no doctype', () => {
    const out = renderHtml(expanded('hello world\n'));
    expect(out.startsWith('<article class="wit-doc">')).toBe(true);
    expect(out).not.toContain('<!doctype');
    expect(out).not.toContain('<style>');
  });

  it('is unchanged when an empty options object is passed', () => {
    const doc = expanded('hi\n');
    expect(renderHtml(doc, {})).toBe(renderHtml(doc));
  });
});

describe('renderHtml — document mode', () => {
  it('wraps the fragment in a complete HTML page', () => {
    const out = renderHtml(expanded('@h1 Title h1@\nbody.\n'), { mode: 'document' });
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('<meta charset="utf-8">');
    expect(out).toContain('<article class="wit-doc">');
    expect(out).toContain('<h1>Title</h1>');
    expect(out.trimEnd().endsWith('</html>')).toBe(true);
  });

  it('inlines the default theme by default', () => {
    const out = renderHtml(expanded('hi\n'), { mode: 'document' });
    expect(out).toContain('<style>');
    expect(out).toContain('.wit-doc');
    expect(out).toContain(defaultThemeCss);
  });

  it('uses the provided title, escaped', () => {
    const out = renderHtml(expanded('hi\n'), { mode: 'document', title: 'A & B <x>' });
    expect(out).toContain('<title>A &amp; B &lt;x&gt;</title>');
  });

  it('defaults the title to "Wit document"', () => {
    const out = renderHtml(expanded('hi\n'), { mode: 'document' });
    expect(out).toContain('<title>Wit document</title>');
  });

  it('emits an unstyled document when css is empty', () => {
    const out = renderHtml(expanded('hi\n'), { mode: 'document', css: '' });
    expect(out).not.toContain('<style>');
  });

  it('accepts a custom stylesheet and neutralizes a nested </style>', () => {
    const out = renderHtml(expanded('hi\n'), {
      mode: 'document',
      css: 'body{color:red} /* </style> */',
    });
    expect(out).toContain('body{color:red}');
    // The closing tag must not appear before the real one terminating
    // the inlined stylesheet.
    const firstStyleClose = out.indexOf('</style>');
    const injected = out.indexOf('*/');
    expect(injected).toBeLessThan(firstStyleClose);
  });
});
