// Static documentation-site generator.
//
// Content is authored in Wit (`website/content/**/*.wit`). At build time this
// script compiles each page with the already-built @witlang pipeline
// (parse → resolve → expand → renderHtml) into an HTML fragment, wraps it in
// the docs chrome (sidebar + top bar), and writes a static site to
// `website/build/`. No per-request compute; deploy the folder anywhere.
//
//   node website/generate.mjs
//
// The chrome is plain HTML/CSS here; a SvelteKit shell (for the live
// playground / search islands) can wrap this same content + pipeline later.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '../packages/parser/dist/index.js';
import { resolve, expand } from '../packages/runtime/dist/index.js';
import { renderHtml } from '../packages/render-html/dist/index.js';

import { site, nav } from './docs.nav.mjs';
import { headTags } from './site-meta.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, 'content');
const OUT = path.join(HERE, 'build');
const DOCS_OUT = path.join(OUT, 'docs');

// ---------------------------------------------------------------------------
// Wit → HTML fragment
// ---------------------------------------------------------------------------

function renderWit(absFile) {
  const source = readFileSync(absFile, 'utf8');
  const doc = parse(source, absFile);
  const resolved = resolve(doc, { rootPath: absFile });
  const expanded = expand(resolved);
  return renderHtml(expanded, { mode: 'fragment' });
}

// first <h1>…</h1> text, for the <title>
function titleFromFragment(html, fallback) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : fallback;
}

// ---------------------------------------------------------------------------
// Build-time syntax highlighting for `<pre>` blocks.
//
// `@@@pre` renders to a bare `<pre>` whose (HTML-escaped) body is literal Wit.
// A single-pass tokenizer wraps recognised constructs in <span class="tok-…">;
// the token CSS colours them. Static output — no client JS, no flash. Shell
// examples (npm/wit commands) tokenise sensibly too (the `wit` keyword, refs).
// The proper long-term signal is `<pre class="language-wit">` — see the
// renderer enhancement noted in the docs plan.
// ---------------------------------------------------------------------------

const HL_RE = new RegExp([
  '(~[^\\n]*)',                       // comment
  '(@@@|@@|!!)',                      // literal fences
  '(\\((?:if|each|end)\\b[^)]*\\))',  // (if…)/(each…)/(end)
  '(\\{\\{[^}]*\\}\\})',              // {{ interpolation }}
  '(::[A-Za-z0-9_-]+::)',             // ::capture::
  '(\\|[^|\\n]*\\|)',                 // |captures|
  '((?<!\\S)reference\\b)',           // reference
  '((?<!\\S)wit(?=\\s))',             // wit (CLI)
  '(@[A-Za-z0-9_-]+)',                // @node open
  '([A-Za-z0-9_-]+@(?!@))',           // node@ close
  '(#[A-Za-z0-9_-]+)',                // #def open
  '([A-Za-z0-9_-]+#(?!#))',           // def# close
  '(\\.\\/[^\\s]+)',                  // ./path
  '(\\\\[@#|*_~])',                   // backslash escape — literal, no class
].join('|'), 'g');
const HL_CLS = ['tok-com', 'tok-fence', 'tok-ctrl', 'tok-interp', 'tok-interp',
  'tok-cap', 'tok-kw', 'tok-kw', 'tok-node', 'tok-node', 'tok-def', 'tok-def', 'tok-str'];

function highlightWit(escaped) {
  return escaped.replace(HL_RE, (...a) => {
    for (let i = 1; i <= HL_CLS.length; i++) {
      if (a[i] !== undefined) return `<span class="${HL_CLS[i - 1]}">${a[0]}</span>`;
    }
    return a[0];
  });
}

// Reverse the HTML escaping renderHtml applied to a <pre> body, recovering the
// literal Wit source so we can re-render it for a live preview.
function unescapeHtml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Shell/CLI snippets (npm/pnpm/yarn/node/wit/$) and plain prose aren't Wit — no
// preview for those. A real Wit example uses at least one sigil (@node, #def,
// bare @ref, or {{interp}}).
function looksRenderable(src) {
  const t = src.trim();
  if (!t) return false;
  const first = t.split('\n', 1)[0].trim();
  if (/^(\$|npm|pnpm|yarn|node|wit|npx|cd|git|make|brew)\b/.test(first)) return false;
  // Annotated / cheatsheet blocks show "source → <output>" or literal HTML as
  // the rendered result. Re-rendering those as Wit produces noise, so skip any
  // block with an annotation arrow or a literal HTML tag.
  if (/[→⇒↦]|=>/.test(t)) return false;
  if (/<\/[a-zA-Z]|<[a-zA-Z][^>]*>/.test(t)) return false;
  // Schematic examples use `…` as a "content goes here" placeholder (e.g. the
  // node catalogues: `@mark … mark@`). Rendering them prints literal ellipses —
  // not a real result. Skip.
  if (t.includes('…')) return false;
  // Media examples reference illustrative assets that don't exist in the build
  // (`|src ./gauge.png|`), so a preview only shows a broken image. Skip.
  if (/@(img|audio|video)\b/.test(t) || /\|\s*src\b/.test(t)) return false;
  // Must contain at least one Wit sigil to be worth rendering.
  return /[@#]|\{\{/.test(t);
}

// Try to compile a snippet to an HTML fragment. Returns null when it doesn't
// parse/resolve/expand/render cleanly (partial snippets, intentional error
// examples, cross-file references) — those simply show source with no preview.
function tryPreview(src) {
  if (!looksRenderable(src)) return null;
  try {
    const doc = parse(src, '<example>');
    const resolved = resolve(doc, { rootPath: HERE });
    const expanded = expand(resolved);
    const html = renderHtml(expanded, { mode: 'fragment' }).trim();
    // Reject empties and pass-throughs that render to just the escaped source.
    if (!html) return null;
    if (html === src.trim()) return null;
    // Reject renders with no visible result (e.g. a def-only snippet that emits
    // just an empty <article> wrapper) — a blank result pane helps no one,
    // unless the output is genuinely non-text (image / rule / table / figure).
    const text = html.replace(/<[^>]+>/g, '').trim();
    if (!text && !/<(img|hr|svg|table|figure|iframe)\b/.test(html)) return null;
    // An unresolved marker means the snippet referenced data/captures it can't
    // see in isolation (a def in a separate block) or a deliberately-broken
    // demo. Either way a red "unresolved" span reads as breakage in public —
    // show source only.
    if (html.includes('wit-unresolved')) return null;
    return html;
  } catch {
    return null;
  }
}

// Replace each <pre> with either a highlighted source block, or — when the Wit
// renders cleanly — a side-by-side "source | result" example. Fully static.
function highlightPre(fragment) {
  return fragment.replace(/<pre>([\s\S]*?)<\/pre>/g, (_m, body) => {
    const source = `<pre class="hl">${highlightWit(body)}</pre>`;
    const preview = tryPreview(unescapeHtml(body));
    if (!preview) return source;
    // Layout examples (flex rows, tables) need full width to read; crushing
    // them into a half-width pane misrepresents the output. Stack those (source
    // above, result full-width below); keep prose/inline examples side by side.
    const wide = /display:\s*flex|<table/.test(preview);
    return `<div class="example${wide ? ' wide' : ''}">`
      + `<div class="ex-pane ex-src"><span class="ex-label">source</span>${source}</div>`
      + `<div class="ex-pane ex-out"><span class="ex-label">result</span>`
      + `<div class="wit-doc ex-render">${preview}</div></div>`
      + `</div>`;
  });
}

// Content authored with root-relative doc links (`/docs/write/tables/`, `/`)
// is rewritten to the correct relative path per page — so authors never hand-
// compute `../../`, and the output still works over file://.
function rewriteDocLinks(fragment, slug) {
  return fragment
    .replace(/href="\/docs\/([^"]*?)\/?"/g,
      (_m, t) => `href="${relPage(slug, t.replace(/\/+$/, ''))}"`)
    .replace(/href="\/"/g, `href="${relRoot(slug, 'index.html')}"`);
}

// ---------------------------------------------------------------------------
// Link helpers — relative so the built site works over file:// or any host
// ---------------------------------------------------------------------------

const allItems = nav.flatMap((s) => s.items);

function pageDir(slug) { return path.posix.join('docs', slug); }

// relative href from one page's dir to another page's index.html — pointing at
// the file (not the dir) so links work over file:// as well as a web server.
function relPage(fromSlug, toSlug) {
  const rel = path.posix.relative(pageDir(fromSlug), pageDir(toSlug));
  return (rel === '' ? '' : rel + '/') + 'index.html';
}
// relative href from a page's dir to a build-root-relative target
function relRoot(fromSlug, target) {
  return path.posix.relative(pageDir(fromSlug), target) || '.';
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function sidebar(currentSlug) {
  const groups = nav.map((section) => {
    const links = section.items.map((it) => {
      const cur = it.slug === currentSlug ? ' class="cur"' : '';
      return `<li><a${cur} href="${relPage(currentSlug, it.slug)}">${it.title}</a></li>`;
    }).join('');
    return `<div class="navgroup"><div class="navhead">${section.section}</div><ul>${links}</ul></div>`;
  }).join('');
  return groups;
}

// A meta description: the page's first paragraph text, trimmed to ~155 chars,
// falling back to the site tagline.
function descFromFragment(fragment) {
  const m = /<p[^>]*>([\s\S]*?)<\/p>/.exec(fragment);
  const text = (m ? m[1] : '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const base = text || site.tagline;
  return base.length > 155 ? base.slice(0, 152).trimEnd() + '…' : base;
}

function layout({ slug, title, fragment }) {
  const css = relRoot(slug, 'docs/assets/docs.css');
  const home = relRoot(slug, 'index.html');
  const docsHome = relPage(slug, '') // -> docs root
    .replace(/^/, ''); // docs/ index
  const meta = headTags({
    title: `${title} · ${site.title} docs`,
    description: descFromFragment(fragment),
    path: `/docs/${slug ? slug + '/' : ''}`,
  });
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${site.title} docs</title>
${meta}
<link rel="stylesheet" href="${css}">
</head>
<body>
<header class="topbar">
  <button class="menubtn" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>
  <a class="brand" href="${home}">${site.title}</a>
  <nav class="topnav">
    <a href="${relRoot(slug, 'docs/index.html')}">Docs</a>
    <a href="${site.repo}">GitHub</a>
    <button class="themebtn" type="button" aria-label="Toggle theme">◑</button>
  </nav>
</header>
<div class="shell">
  <aside class="sidebar" id="sidebar">${sidebar(slug)}</aside>
  <main class="content">${fragment}</main>
</div>
<script>
  (function(){
    var root=document.documentElement, k='wit-docs-theme';
    var saved=localStorage.getItem(k); if(saved) root.setAttribute('data-theme',saved);
    var b=document.querySelector('.themebtn');
    if(b) b.addEventListener('click',function(){
      var t=root.getAttribute('data-theme')==='dark'?'light':'dark';
      root.setAttribute('data-theme',t); localStorage.setItem(k,t);
    });
    var m=document.querySelector('.menubtn');
    if(m) m.addEventListener('click',function(){
      var open=document.body.classList.toggle('nav-open');
      m.setAttribute('aria-expanded', open?'true':'false');
    });
  })();
</script>
</body>
</html>
`;
}

// A generated docs landing (two doors + section index)
function docsHomePage() {
  const cards = nav.map((s) => {
    const links = s.items.map((it) => `<li><a href="${it.slug}/index.html">${it.title}</a></li>`).join('');
    return `<section class="home-sec"><h2>${s.section}</h2><ul>${links}</ul></section>`;
  }).join('');
  const fragment = `<article class="wit-doc"><h1>Documentation</h1>
<p>${site.tagline} — everything to write Wit, and to build on it.</p>
${cards}</article>`;
  return layout({ slug: '', title: 'Documentation', fragment });
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function writePage(slug, html) {
  const dir = path.join(DOCS_OUT, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  rmSync(DOCS_OUT, { recursive: true, force: true });
  mkdirSync(path.join(DOCS_OUT, 'assets'), { recursive: true });
  writeFileSync(path.join(DOCS_OUT, 'assets', 'docs.css'), DOCS_CSS, 'utf8');

  let n = 0, failed = 0;
  for (const it of allItems) {
    const abs = path.join(CONTENT, it.file);
    if (!existsSync(abs)) { console.warn('  skip (missing):', it.file); continue; }
    let fragment;
    try { fragment = rewriteDocLinks(highlightPre(renderWit(abs)), it.slug); }
    catch (e) { console.error(`  ERROR ${it.file}: ${e.message}`); failed++; continue; }
    const title = it.title || titleFromFragment(fragment, it.slug);
    writePage(it.slug, layout({ slug: it.slug, title, fragment }));
    n++;
  }
  writeFileSync(path.join(DOCS_OUT, 'index.html'), docsHomePage(), 'utf8');

  // Site-root assets (survive the separate landing build, which only writes
  // index.html). OG card (committed PNG) + a friendly 404.
  mkdirSync(OUT, { recursive: true });
  copyFileSync(path.join(HERE, 'assets', 'og.png'), path.join(OUT, 'og.png'));
  writeFileSync(path.join(OUT, '404.html'), notFoundPage(), 'utf8');

  console.log(`built ${n} docs pages${failed ? `, ${failed} FAILED` : ''} → website/build/docs/`);
  if (failed) process.exitCode = 1;
}

// A self-contained 404 (absolute links work on any static host).
function notFoundPage() {
  const meta = headTags({
    title: `Page not found · ${site.title}`,
    description: `That page doesn't exist. Head back to ${site.title}.`,
    path: '/404.html',
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · ${site.title}</title>
${meta}
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-content:center;text-align:center;
    gap:.4rem;background:#f6f1e7;color:#221f1a;
    font-family:"Iowan Old Style",Palatino,Georgia,serif;padding:2rem}
  @media(prefers-color-scheme:dark){body{background:#16130d;color:#ece4d4}}
  h1{font-size:3rem;margin:0}
  p{color:#6d6454;margin:.2rem 0 1rem}
  a{color:#8a2b39;font-weight:600}
  @media(prefers-color-scheme:dark){a{color:#df909b}}
</style>
</head>
<body>
  <h1>404</h1>
  <p>That page wandered off.</p>
  <p><a href="/">${site.title} home</a> · <a href="/docs/">Documentation</a></p>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Stylesheet — chrome + content, editorial tokens shared with the landing
// ---------------------------------------------------------------------------

const DOCS_CSS = `
:root{
  --bg:#f6f1e7; --surface:#fffcf5; --surface-2:#efe7d6; --ink:#221f1a;
  --muted:#6d6454; --accent:#8a2b39; --border:#e4dbc8;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,Cambria,serif;
  --sans:"Inter",ui-sans-serif,system-ui,"Segoe UI",Roboto,sans-serif;
  --mono:"JetBrains Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace;
}
:root[data-theme=dark]{
  --bg:#16130d; --surface:#201b13; --surface-2:#2a241a; --ink:#ece4d4;
  --muted:#9a9080; --accent:#df909b; --border:#322b1f;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--serif);line-height:1.6}
a{color:var(--accent)}
.topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;
  height:58px;padding:0 1.3rem;background:color-mix(in srgb,var(--bg) 85%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.brand{font-weight:700;font-size:1.3rem;text-decoration:none;color:var(--ink);letter-spacing:-.02em}
.topnav{display:flex;gap:1.2rem;align-items:center;font-family:var(--sans);font-size:.92rem}
.topnav a{color:var(--muted);text-decoration:none}
.topnav a:hover{color:var(--ink)}
.themebtn{background:var(--surface);border:1px solid var(--border);color:var(--ink);
  border-radius:8px;padding:.3rem .6rem;cursor:pointer;font-size:.9rem}
.menubtn{display:none;background:none;border:0;color:var(--ink);cursor:pointer;
  font-size:1.3rem;line-height:1;padding:.2rem .5rem;margin-left:-.3rem}
.shell{display:grid;grid-template-columns:240px minmax(0,1fr);gap:0;max-width:1180px;margin:0 auto}
.sidebar{position:sticky;top:58px;align-self:start;height:calc(100vh - 58px);overflow-y:auto;
  padding:1.6rem 1rem 3rem;border-right:1px solid var(--border);font-family:var(--sans)}
.navgroup{margin-bottom:1.4rem}
.navhead{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);
  font-weight:700;margin:0 .6rem .5rem}
.sidebar ul{list-style:none;margin:0;padding:0}
.sidebar li a{display:block;padding:.32rem .6rem;border-radius:7px;text-decoration:none;
  color:var(--ink);font-size:.93rem}
.sidebar li a:hover{background:var(--surface-2)}
.sidebar li a.cur{background:var(--accent);color:#fff8ef;font-weight:600}
.content{padding:2.4rem 3rem 5rem;min-width:0}
.home-sec{margin:1.5rem 0}
.home-sec ul{padding-left:1.2rem}

/* content — the compiled Wit fragment */
.wit-doc{max-width:44rem}
.wit-doc>:first-child{margin-top:0}
.wit-doc h1{font-size:2.3rem;letter-spacing:-.02em;margin:0 0 .6rem}
.wit-doc h2{font-size:1.5rem;margin:2rem 0 .6rem;padding-top:.3rem;border-top:1px solid var(--border)}
.wit-doc h3{font-size:1.18rem;margin:1.5rem 0 .4rem}
.wit-doc p{margin:0 0 1rem}
.wit-doc strong{font-weight:700}
.wit-doc em{font-style:italic}
.wit-doc a{text-underline-offset:3px}
.wit-doc ul,.wit-doc ol{margin:0 0 1rem;padding-left:1.5em}
.wit-doc li{margin:.25em 0}
.wit-doc blockquote{margin:1.2em 0;padding:.4em 0 .4em 1em;border-left:3px solid var(--accent);color:var(--muted)}
.wit-doc code{font-family:var(--mono);font-size:.9em;background:var(--surface-2);padding:.12em .4em;border-radius:5px}
.wit-doc pre{background:#1b1811;color:#d8cfbf;border:1px solid #2e2820;border-radius:11px;
  padding:1.1rem 1.3rem;overflow-x:auto;font-family:var(--mono);font-size:.85rem;line-height:1.6}
.wit-doc pre code{background:none;padding:0;color:inherit}
/* Side-by-side example: Wit source next to its rendered result */
.wit-doc .example{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:1rem;align-items:start;margin:1.4em 0}
.wit-doc .example .ex-pane{min-width:0}
.wit-doc .example pre{margin:0}
.wit-doc .ex-label{display:block;font-family:var(--sans);font-size:.68rem;
  text-transform:uppercase;letter-spacing:.08em;color:var(--muted);
  font-weight:700;margin:0 0 .35rem .1rem}
.wit-doc .ex-out .ex-render{background:var(--surface);border:1px solid var(--border);
  border-radius:11px;padding:1rem 1.15rem;font-size:.92rem}
.wit-doc .ex-render>:first-child{margin-top:0}
.wit-doc .ex-render>:last-child{margin-bottom:0}
/* Rendered previews are small — scale headings down so they read in-pane */
.wit-doc .ex-render h1{font-size:1.5rem;margin:.2rem 0 .5rem}
.wit-doc .ex-render h2{font-size:1.2rem;border-top:none;margin:1rem 0 .4rem;padding-top:0}
.wit-doc .ex-render h3{font-size:1.02rem}
/* Wide examples (flex rows, tables) stack so the result gets full width */
.wit-doc .example.wide{grid-template-columns:1fr}
.wit-doc .example.wide .ex-out .ex-render{font-size:.95rem}
@media(max-width:720px){.wit-doc .example{grid-template-columns:1fr}}
/* Wit syntax tokens (build-time highlighter) */
.wit-doc pre .tok-com{color:#8a8069;font-style:italic}
.wit-doc pre .tok-node{color:#e0a24f}
.wit-doc pre .tok-def{color:#e394a4}
.wit-doc pre .tok-fence{color:#6fbfa6}
.wit-doc pre .tok-ctrl{color:#c79ae0}
.wit-doc pre .tok-interp{color:#74c6b4}
.wit-doc pre .tok-cap{color:#a0c97e}
.wit-doc pre .tok-kw{color:#c79ae0;font-weight:600}
.wit-doc pre .tok-str{color:#a0c97e}
.wit-doc table{border-collapse:collapse;width:100%;margin:1.2em auto;font-family:var(--sans);font-size:.93rem}
.wit-doc th,.wit-doc td{border:1px solid var(--border);padding:.45rem .7rem;text-align:left;vertical-align:top}
.wit-doc thead th{background:var(--surface-2)}
.wit-doc figure{margin:1.5em 0;text-align:center}
.wit-doc figcaption{margin-top:.5em;font-size:.9em;color:var(--muted)}
.wit-doc .note,.wit-doc aside{background:var(--surface-2);border-left:3px solid var(--accent);
  padding:.7rem 1rem;border-radius:8px;margin:1.2em 0}
img,svg{max-width:100%;height:auto}
/* Wide content never forces the page to scroll sideways — it scrolls itself */
.wit-doc pre,.wit-doc table{max-width:100%}
.wit-doc table{display:block;overflow-x:auto}

@media(max-width:820px){
  body{overflow-x:hidden}
  .menubtn{display:inline-flex}
  .shell{grid-template-columns:1fr;max-width:100%}
  .content{padding:1.6rem 1.2rem 4rem}
  /* Sidebar becomes a full-screen drawer toggled by the ☰ button */
  .sidebar{position:fixed;top:58px;left:0;right:0;bottom:0;z-index:30;
    height:auto;border-right:none;background:var(--bg);
    padding:1.2rem 1.3rem 3rem;display:none}
  body.nav-open .sidebar{display:block}
  body.nav-open{overflow:hidden}
  .wit-doc{max-width:none}
  .wit-doc h1{font-size:1.9rem}
  .wit-doc h2{font-size:1.3rem}
  .wit-doc pre{font-size:.8rem}
}
@media(max-width:720px){
  .wit-doc .example{grid-template-columns:1fr}
}
@media(max-width:480px){
  /* Topbar declutters — the ☰ menu covers navigation, ◑ stays */
  .topnav a{display:none}
}
@media(max-width:400px){
  .content{padding:1.2rem 1rem 3rem}
}
`;

main();
