// The default "house style" for rendered Wit documents.
//
// The default aims to look like a document you'd get out of Microsoft Word
// or Google Docs: a sans-serif body face, an 11pt measure, and a white
// "page" sitting on a light-grey canvas. A `.wit` file that specifies no
// CSS of its own renders as a familiar word-processor document. It is
// authored as a string constant (rather than a sibling `.css` file) so
// `renderHtml(doc, { mode: 'document' })` can inline it into `<head>` and
// produce a single self-contained `.html`/PDF with no external deps.
//
// Everything is expressed with CSS custom properties + `.wit-doc`-scoped
// rules, so a document can retheme by overriding a variable or two from an
// `@@style` block. For total control, use the raw pathway (`rawThemeCss`).
//
// Later milestone: extract this into a standalone `@witlang/theme` package
// shipping multiple themes + a raw `.css` for `<link>` use
// (see docs/universal-render-target.md).

// The "raw" pathway: the least-opinionated base. A mechanical reset only —
// the box model, no body margin, responsive media — and nothing else. No
// fonts, colours, measure, or spacing are imposed, so the document has full
// freedom to define its own look and containers via `@@style` + wrapping
// nodes (`@div`, `@section`, …). Pair with `wit build --raw`.
export const rawThemeCss = `*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; }
img, svg, video { max-width: 100%; height: auto; }
`;

export const defaultThemeCss = `:root {
  --wit-canvas: #f4f4f5;
  --wit-bg: #ffffff;
  --wit-ink: #202124;
  --wit-muted: #5f6368;
  --wit-faint: #f1f3f4;
  --wit-rule: #d4d4d6;
  --wit-accent: #1a56db;
  --wit-accent-soft: #d6e4ff;
  --wit-flag: #c5221f;
  --wit-sans: "Calibri", "Carlito", "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif;
  --wit-mono: "Cascadia Code", "Consolas", "SF Mono", Menlo, "Liberation Mono", monospace;
  --wit-page: 8.5in;
  --wit-pad: 1in;
}

@media (prefers-color-scheme: dark) {
  :root {
    --wit-canvas: #1c1c1f;
    --wit-bg: #292a2d;
    --wit-ink: #e8eaed;
    --wit-muted: #9aa0a6;
    --wit-faint: #35363a;
    --wit-rule: #45464a;
    --wit-accent: #8ab4f8;
    --wit-accent-soft: #2b3a55;
    --wit-flag: #ff8a80;
  }
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  padding: 2.5rem 1rem;
  background: var(--wit-canvas);
  color: var(--wit-ink);
  font-family: var(--wit-sans);
  font-size: 11pt;
  line-height: 1.5;
}

/* The page — a white sheet on the canvas, US-Letter width with 1in margins,
   the way a word processor presents a document. */
.wit-doc {
  max-width: var(--wit-page);
  margin: 0 auto;
  padding: var(--wit-pad);
  background: var(--wit-bg);
  border: 1px solid var(--wit-rule);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.10);
}

.wit-doc > :first-child { margin-top: 0; }
.wit-doc > :last-child { margin-bottom: 0; }

.wit-doc p { margin: 0 0 0.7em; }

.wit-doc h1, .wit-doc h2, .wit-doc h3,
.wit-doc h4, .wit-doc h5, .wit-doc h6 {
  font-family: var(--wit-sans);
  font-weight: 400;
  color: var(--wit-ink);
  line-height: 1.25;
  margin: 1.3em 0 0.4em;
}
.wit-doc h1 { font-size: 2rem; }
.wit-doc h2 { font-size: 1.55rem; }
.wit-doc h3 { font-size: 1.25rem; color: var(--wit-muted); }
.wit-doc h4 { font-size: 1.05rem; font-weight: 600; }
.wit-doc h5 { font-size: 0.95rem; font-weight: 600; color: var(--wit-muted); }
.wit-doc h6 { font-size: 0.9rem; font-weight: 600; color: var(--wit-muted); }

.wit-doc a { color: var(--wit-accent); text-decoration: underline; }
.wit-doc strong { font-weight: 700; }
.wit-doc em { font-style: italic; }
.wit-doc mark { background: #fff3a3; color: inherit; }
.wit-doc small { font-size: 0.85em; color: var(--wit-muted); }

.wit-doc ul, .wit-doc ol { margin: 0 0 0.7em; padding-left: 1.6em; }
.wit-doc li { margin: 0.15em 0; }

.wit-doc dl { margin: 0 0 0.7em; }
.wit-doc dt { font-weight: 700; margin-top: 0.6em; }
.wit-doc dd { margin: 0 0 0.3em 1.4em; }

.wit-doc blockquote {
  margin: 1em 0;
  padding: 0.3em 0 0.3em 1em;
  border-left: 3px solid var(--wit-rule);
  color: var(--wit-muted);
}
.wit-doc blockquote p:last-child { margin-bottom: 0; }

.wit-doc code {
  font-family: var(--wit-mono);
  font-size: 0.92em;
  background: var(--wit-faint);
  padding: 0.1em 0.32em;
  border-radius: 3px;
}
.wit-doc pre {
  font-family: var(--wit-mono);
  font-size: 0.88em;
  line-height: 1.5;
  background: var(--wit-faint);
  padding: 0.9em 1em;
  border: 1px solid var(--wit-rule);
  border-radius: 4px;
  overflow-x: auto;
}
.wit-doc pre code { background: none; padding: 0; }

.wit-doc img { max-width: 100%; height: auto; }
.wit-doc figure { margin: 1.2em 0; }
.wit-doc figcaption { font-size: 0.9em; color: var(--wit-muted); margin-top: 0.4em; }

.wit-doc hr { border: 0; border-top: 1px solid var(--wit-rule); margin: 1.6em 0; }

/* Tables — full cell borders, the way Word / Docs default table styles look. */
.wit-doc table { border-collapse: collapse; margin: 1em 0; }
.wit-doc th, .wit-doc td {
  border: 1px solid var(--wit-rule);
  padding: 0.4em 0.6em;
  text-align: left;
  vertical-align: top;
}
.wit-doc thead th { background: var(--wit-faint); font-weight: 700; }
.wit-doc caption { color: var(--wit-muted); font-size: 0.9em; padding: 0.4em 0; }

.wit-doc .wit-record th { color: var(--wit-muted); font-weight: 700; }
.wit-doc .wit-bibliography p {
  padding-left: 1.5em;
  text-indent: -1.5em;
  margin-bottom: 0.5em;
}
.wit-doc .wit-unresolved { color: var(--wit-flag); text-decoration: underline dotted; }

.wit-doc ::selection { background: var(--wit-accent-soft); }

/* Narrow screens: drop the page frame and the desk, read edge to edge. */
@media (max-width: 860px) {
  body { padding: 0; background: var(--wit-bg); }
  .wit-doc { border: 0; box-shadow: none; padding: 1.25rem; }
}

/* Print / PDF — the default pathway also targets paged output. Drop the
   canvas + page frame and let @page margins do the framing, the way a word
   processor prints. Keep headings and figures from splitting across pages. */
@page { margin: 1in; }

@media print {
  body { background: #fff; padding: 0; }
  .wit-doc {
    max-width: none;
    margin: 0;
    padding: 0;
    border: 0;
    box-shadow: none;
  }
  .wit-doc h1, .wit-doc h2, .wit-doc h3,
  .wit-doc h4, .wit-doc h5, .wit-doc h6 { break-after: avoid; }
  .wit-doc figure, .wit-doc blockquote, .wit-doc pre,
  .wit-doc table { break-inside: avoid; }
  .wit-doc p { orphans: 3; widows: 3; }
}
`;
