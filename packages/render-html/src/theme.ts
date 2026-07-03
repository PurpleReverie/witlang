// The default "house style" for rendered Wit documents.
//
// This is the literary default theme: a comfortable reading measure, a
// serif body face, oldstyle numerals, and a restrained purple accent.
// It is authored as a string constant (rather than a sibling `.css`
// file) so `renderHtml(doc, { mode: 'document' })` can inline it into
// `<head>` and produce a single self-contained `.html` file with no
// external dependencies — open it anywhere and it looks right.
//
// All rules are scoped under `.wit-doc` (the class on the rendered
// `<article>`) so the stylesheet is safe to drop next to other content;
// only the body/background rules, which exist purely for the standalone
// document, sit at the top level.
//
// Later milestone: extract this into a standalone `@witlang/theme`
// package shipping multiple themes + a raw `.css` for `<link>` use
// (see docs/universal-render-target.md).

export const defaultThemeCss = `:root {
  --wit-bg: #fdfdfb;
  --wit-surface: #ffffff;
  --wit-ink: #1b1b18;
  --wit-muted: #6c6a62;
  --wit-faint: #ecebe4;
  --wit-rule: #e0ded5;
  --wit-accent: #6d4aff;
  --wit-accent-soft: #efeaff;
  --wit-flag: #b4322a;
  --wit-serif: Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", "Times New Roman", serif;
  --wit-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --wit-mono: "SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, "Liberation Mono", monospace;
  --wit-measure: 68ch;
}

@media (prefers-color-scheme: dark) {
  :root {
    --wit-bg: #15151a;
    --wit-surface: #1c1c22;
    --wit-ink: #e9e7e0;
    --wit-muted: #9d9a90;
    --wit-faint: #24242b;
    --wit-rule: #2d2d35;
    --wit-accent: #ab9cff;
    --wit-accent-soft: #25223a;
    --wit-flag: #ff8a80;
  }
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  padding: 3.5rem 1.25rem 6rem;
  background: var(--wit-bg);
  color: var(--wit-ink);
  font-family: var(--wit-serif);
  font-size: 1.125rem;
  line-height: 1.65;
}

.wit-doc {
  max-width: var(--wit-measure);
  margin: 0 auto;
  font-feature-settings: "kern", "liga", "onum", "pnum";
  hanging-punctuation: first last;
  text-rendering: optimizeLegibility;
}

.wit-doc > :first-child { margin-top: 0; }

.wit-doc p {
  margin: 0 0 1.15em;
  text-wrap: pretty;
}

.wit-doc h1, .wit-doc h2, .wit-doc h3,
.wit-doc h4, .wit-doc h5, .wit-doc h6 {
  font-family: var(--wit-serif);
  font-weight: 600;
  line-height: 1.2;
  margin: 2.2em 0 0.6em;
  text-wrap: balance;
}

.wit-doc h1 { font-size: 2.3rem; letter-spacing: -0.012em; margin-top: 0.2em; }
.wit-doc h2 { font-size: 1.7rem; letter-spacing: -0.008em; }
.wit-doc h3 { font-size: 1.32rem; }
.wit-doc h4 { font-size: 1.12rem; }
.wit-doc h5 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--wit-muted); }
.wit-doc h6 { font-size: 0.9rem; color: var(--wit-muted); }

.wit-doc a {
  color: var(--wit-accent);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
.wit-doc a:hover { text-decoration-thickness: 2px; }

.wit-doc em, .wit-doc cite { font-style: italic; }
.wit-doc strong { font-weight: 600; }
.wit-doc mark { background: var(--wit-accent-soft); color: inherit; padding: 0 0.15em; }
.wit-doc small { font-size: 0.85em; color: var(--wit-muted); }

.wit-doc blockquote {
  margin: 1.6em 0;
  padding: 0.2em 0 0.2em 1.25em;
  border-left: 3px solid var(--wit-accent);
  color: var(--wit-muted);
  font-style: italic;
}
.wit-doc blockquote p:last-child { margin-bottom: 0; }

.wit-doc ul, .wit-doc ol { margin: 0 0 1.15em; padding-left: 1.5em; }
.wit-doc li { margin: 0.25em 0; }
.wit-doc li::marker { color: var(--wit-muted); }

.wit-doc dl { margin: 0 0 1.15em; }
.wit-doc dt { font-weight: 600; margin-top: 0.8em; }
.wit-doc dd { margin: 0 0 0.4em; padding-left: 1.25em; color: var(--wit-muted); }

.wit-doc code {
  font-family: var(--wit-mono);
  font-size: 0.9em;
  background: var(--wit-faint);
  padding: 0.12em 0.36em;
  border-radius: 4px;
}
.wit-doc pre {
  font-family: var(--wit-mono);
  font-size: 0.88em;
  line-height: 1.55;
  background: var(--wit-faint);
  padding: 1em 1.15em;
  border-radius: 8px;
  overflow-x: auto;
}
.wit-doc pre code { background: none; padding: 0; }

.wit-doc img { max-width: 100%; height: auto; border-radius: 6px; }

.wit-doc figure { margin: 1.8em 0; text-align: center; }
.wit-doc figcaption {
  font-family: var(--wit-sans);
  font-size: 0.85em;
  color: var(--wit-muted);
  margin-top: 0.6em;
}

.wit-doc hr {
  border: 0;
  height: 1px;
  background: var(--wit-rule);
  margin: 2.6em auto;
  width: 40%;
}

.wit-doc table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.6em 0;
  font-size: 0.96em;
}
.wit-doc th, .wit-doc td {
  text-align: left;
  padding: 0.5em 0.7em;
  border-bottom: 1px solid var(--wit-rule);
  vertical-align: top;
}
.wit-doc thead th {
  font-family: var(--wit-sans);
  font-size: 0.82em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--wit-muted);
}
.wit-doc caption {
  caption-side: bottom;
  font-size: 0.85em;
  color: var(--wit-muted);
  font-style: italic;
  padding-top: 0.6em;
}

.wit-doc .wit-record { max-width: 32rem; }
.wit-doc .wit-record th { width: 12rem; color: var(--wit-muted); font-weight: 600; }

.wit-doc .wit-bibliography { margin: 1.6em 0; }
.wit-doc .wit-bibliography p {
  padding-left: 1.6em;
  text-indent: -1.6em;
  margin-bottom: 0.7em;
}

.wit-doc .wit-unresolved {
  color: var(--wit-flag);
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}

.wit-doc ::selection { background: var(--wit-accent-soft); }
`;
