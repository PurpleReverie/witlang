// HTML core-vocab + @node + @table tests (M10.core-vocab).

import { describe, it, expect } from 'vitest';
import { parse } from '@witlang/parser';
import { resolve, expand } from '@witlang/runtime';
import { renderHtml } from './render.js';

function render(src: string): string {
  return renderHtml(expand(resolve(parse(src))));
}

describe('renderHtml — core vocab', () => {
  it('emits `<h1>` for `@h1`', () => {
    expect(render('@h1 Title h1@')).toContain('<h1>Title</h1>');
  });

  it('emits `<em>` and `<strong>` for inline marks', () => {
    const out = render('@em x em@ @strong y strong@');
    expect(out).toContain('<em>x</em>');
    expect(out).toContain('<strong>y</strong>');
  });

  it('emits `<a href=...>` from |href| param', () => {
    const out = render('@a |href https://example.org| ex a@');
    expect(out).toContain('<a href="https://example.org">');
    expect(out).toContain('ex');
  });

  it('maps |size| and |align| to a self-contained inline style', () => {
    const small = render('@img |src a.png| |size small| |align center|');
    expect(small).toContain('max-width:220px');
    expect(small).toContain('margin-left:auto;margin-right:auto');
    expect(render('@img |src a.png| |size 300|')).toContain('max-width:300px');
    expect(render('@img |src a.png| |size full|')).toContain('width:100%'); // fills, not caps
    expect(render('@img |src a.png| |size 50%|')).toContain('width:50%');
    expect(render('@img |src a.png| |align right|')).toContain('margin-left:auto');
  });

  it('applies |align| / |size| to a @figure element', () => {
    const out = render('@figure |align center| |size large|\n@img |src a.png|\nfigure@');
    expect(out).toMatch(/<figure style="[^"]*max-width:600px/);
    expect(out).toContain('text-align:center'); // figure aligns its contents
  });

  it('emits self-closing img with src + alt', () => {
    const out = render('@img |src ./x.png| |alt A picture|');
    expect(out).toContain('<img src="./x.png" alt="A picture">');
  });

  it('emits `<ul><li>` for lists', () => {
    const out = render('@ul\n@li A li@\n@li B li@\nul@');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>A</li>');
    expect(out).toContain('<li>B</li>');
  });

  it('emits `<hr>` self-closing', () => {
    expect(render('@hr hr@')).toContain('<hr>');
  });
});

describe('renderHtml — @node opaque container', () => {
  it('dispatches `@node(type X)` to core handler when X is core vocab', () => {
    const out = render('@node |type img| |src ./n.png| |alt N|');
    expect(out).toContain('<img src="./n.png" alt="N">');
  });

  it('emits generic div for unknown type', () => {
    const out = render('@node |type custom-widget| |id q1|');
    expect(out).toContain('<div');
    expect(out).toContain('data-id="q1"');
  });
});

describe('renderHtml — @table', () => {
  it('renders inline CSV rows with header', () => {
    const src = '@table |rows [[A, B], [1, 2], [3, 4]]|';
    const out = render(src);
    expect(out).toContain('<table>');
    expect(out).toContain('<thead>');
    expect(out).toContain('<th>A</th>');
    expect(out).toContain('<td>1</td>');
  });

  it('renders |header false| with no thead', () => {
    const out = render('@table |rows [[a, b], [c, d]]| |header false|');
    expect(out).not.toContain('<thead>');
    expect(out).toContain('<td>a</td>');
  });

  it('renders caption from |caption|', () => {
    const out = render(
      '@table |rows [[A, B], [1, 2]]| |caption Practicum Hours|',
    );
    expect(out).toContain('<caption>Practicum Hours</caption>');
  });

  it('emits empty `<table></table>` when no rows param', () => {
    expect(render('@table table@')).toContain('<table></table>');
  });

  it('renders `|rows @ref|` from a referenced collection of records', () => {
    const src =
      '#sales: [ { site - Dunmore, lit - yes }, { site - Carrick, lit - no } ] !!\n\n' +
      '@table |rows @sales|';
    const out = render(src);
    // columns derived from the first record's keys
    expect(out).toContain('<th>site</th><th>lit</th>');
    expect(out).toContain('<td>Dunmore</td><td>yes</td>');
    expect(out).toContain('<td>Carrick</td><td>no</td>');
  });

  it('renders `|schema …| |rows @ref|` honouring the schema order', () => {
    const src =
      '#sales: [ { lit - yes, site - Dunmore } ] !!\n\n' +
      '@table |schema [site, lit]| |rows @sales|';
    const out = render(src);
    expect(out).toContain('<th>site</th><th>lit</th>');
    expect(out).toContain('<td>Dunmore</td><td>yes</td>');
  });

  it('emits a `<div class>` container from `@div(class ...)`', () => {
    const out = render('@div(class card)\nInside the card.\ndiv@');
    expect(out).toContain('<div class="card"><p>Inside the card.</p></div>');
  });

  it('emits an inline `<span class>`', () => {
    expect(render('a @span(class tag) x span@ b')).toMatch(/<span class="tag">\s*x\s*<\/span>/);
  });

  it('lays out `@row` / `@col` as an invisible flex band with columns', () => {
    const src =
      '@row\n@col |size 220|\n@img |src a.png| |alt A|\ncol@\n@col\nBeside text.\ncol@\nrow@';
    const out = render(src);
    expect(out).toContain('display:flex');
    expect(out).toContain('flex:0 0 220px'); // fixed image column
    expect(out).toContain('flex:1 1 0'); // text column fills the rest
    expect(out).toContain('<img src="a.png"');
    expect(out).toContain('Beside text.');
  });

  it('accepts a percent column width', () => {
    expect(render('@row\n@col |size 30%|\nx\ncol@\nrow@')).toContain('flex:0 0 30%');
  });
});
