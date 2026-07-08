// AsciiMath → MathML converter tests.

import { describe, it, expect } from 'vitest';
import { parse } from '@witlang/parser';
import { resolve, expand } from '@witlang/runtime';
import { renderMath } from './render-math.js';
import { renderHtml } from './render.js';

describe('renderMath — AsciiMath → MathML', () => {
  it('renders E = mc^2 as a superscript', () => {
    const m = renderMath('E = mc^2');
    expect(m.startsWith('<math>')).toBe(true);
    expect(m).toContain('<mo>=</mo>');
    expect(m).toContain('<msup><mi>c</mi><mn>2</mn></msup>');
  });

  it('renders a/b as a fraction', () => {
    expect(renderMath('a/b')).toContain('<mfrac><mi>a</mi><mi>b</mi></mfrac>');
  });

  it('renders sqrt and strips the argument brackets', () => {
    expect(renderMath('sqrt(2)')).toContain('<msqrt><mn>2</mn></msqrt>');
  });

  it('renders a combined sub/superscript', () => {
    expect(renderMath('x_i^2')).toContain(
      '<msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup>',
    );
  });

  it('maps AsciiMath words to Greek letters and relations', () => {
    const m = renderMath('alpha <= pi');
    expect(m).toContain('<mi>α</mi>');
    expect(m).toContain('<mo>≤</mo>');
    expect(m).toContain('<mi>π</mi>');
  });

  it('escapes a literal < operator', () => {
    expect(renderMath('a < b')).toContain('<mo>&lt;</mo>');
  });

  it('sets display="block" for block math', () => {
    expect(renderMath('x', { display: true }).startsWith('<math display="block">')).toBe(true);
  });

  it('falls back to AsciiMath for an unknown engine', () => {
    expect(renderMath('x^2', { engine: 'nope' })).toContain('<msup>');
  });

  it('does not crash on empty or unbalanced input', () => {
    expect(renderMath('')).toBe('<math><mrow></mrow></math>');
    expect(() => renderMath('(a+b')).not.toThrow();
  });
});

describe('renderHtml — @@math nodes', () => {
  const render = (src: string): string =>
    renderHtml(expand(resolve(parse(src, 'm.wit'))));

  it('renders an inline @@math node to inline MathML', () => {
    const html = render('mass is @@math E = mc^2 math@@ today');
    expect(html).toContain('<math><mrow><mi>E</mi>');
    expect(html).not.toContain('display="block"');
  });

  it('renders @@mathblock as display MathML', () => {
    const html = render('@@mathblock sum_(i=1)^n i mathblock@@');
    expect(html).toContain('<math display="block">');
    expect(html).toContain('∑');
  });
});
