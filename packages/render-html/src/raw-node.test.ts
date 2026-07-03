// HTML rendering of `@@name ... name@@` literal nodes.
// Verbatim body, HTML-escaped for normal elements; raw (unescaped) for the
// raw-text elements `<style>` / `<script>`, guarded against tag break-out.

import { describe, it, expect } from 'vitest';
import { parse } from '@witlang/parser';
import { resolve, expand } from '@witlang/runtime';
import { renderHtml } from './render.js';

function render(src: string): string {
  return renderHtml(expand(resolve(parse(src))));
}

describe('renderHtml — raw nodes', () => {
  it('renders a block @@pre with verbatim, HTML-escaped content', () => {
    const out = render('@@pre\n<b>@x #y</b>\npre@@\n');
    expect(out).toContain('<pre>&lt;b&gt;@x #y&lt;/b&gt;</pre>');
  });

  it('renders an inline @@code span', () => {
    const out = render('Use @@code map(f, @xs) code@@ here.\n');
    expect(out).toContain('<code>map(f, @xs)</code>');
  });

  it('emits @@style as an unescaped raw-text <style> element', () => {
    const out = render('@@style\n.wit-doc a > em { font-weight: 600 }\nstyle@@\n');
    expect(out).toContain('<style>.wit-doc a > em { font-weight: 600 }</style>');
    expect(out).not.toContain('&gt;');
  });

  it('guards a nested </style> from breaking out of the element', () => {
    const out = render('@@style\nx{} /* </style> */\nstyle@@\n');
    // The literal closing tag must be neutralized; only the real one closes.
    expect(out).toContain('<\\/style');
    expect(out.match(/<\/style>/g)?.length).toBe(1);
  });
});

describe('renderHtml — raw node {{interpolation}}', () => {
  it('substitutes {{path}} in a @@ body; single CSS braces stay literal', () => {
    const out = render('#theme: { accent - green }\n\n@@style\n.x { color: {{theme.accent}} }\nstyle@@\n');
    expect(out).toContain('<style>.x { color: green }</style>');
  });

  it('resolves a single-line #name: value def', () => {
    const out = render('#accent: teal\n\n@@style\n.x { color: {{accent}} }\nstyle@@\n');
    expect(out).toContain('color: teal');
  });

  it('does NOT interpolate inside a frozen @@@ body', () => {
    const out = render('#x: hi\n\n@@@tpl\n{{x}} and {{y}}\ntpl@@@\n');
    expect(out).toContain('{{x}} and {{y}}');
    expect(out).not.toContain('>hi');
  });
});
