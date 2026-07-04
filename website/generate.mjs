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

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '../packages/parser/dist/index.js';
import { resolve, expand } from '../packages/runtime/dist/index.js';
import { renderHtml } from '../packages/render-html/dist/index.js';

import { site, nav } from './docs.nav.mjs';

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
// Link helpers — relative so the built site works over file:// or any host
// ---------------------------------------------------------------------------

const allItems = nav.flatMap((s) => s.items);

function pageDir(slug) { return path.posix.join('docs', slug); }

// relative href from one page's dir to another page's dir (trailing slash)
function relPage(fromSlug, toSlug) {
  const rel = path.posix.relative(pageDir(fromSlug), pageDir(toSlug));
  return (rel === '' ? '.' : rel) + '/';
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

function layout({ slug, title, fragment }) {
  const css = relRoot(slug, 'docs/assets/docs.css');
  const home = relRoot(slug, 'index.html');
  const docsHome = relPage(slug, '') // -> docs root
    .replace(/^/, ''); // docs/ index
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${site.title} docs</title>
<link rel="stylesheet" href="${css}">
</head>
<body>
<header class="topbar">
  <a class="brand" href="${home}">${site.title}</a>
  <nav class="topnav">
    <a href="${relRoot(slug, 'docs/index.html')}">Docs</a>
    <a href="${site.repo}">GitHub</a>
    <button class="themebtn" type="button" aria-label="Toggle theme">◑</button>
  </nav>
</header>
<div class="shell">
  <aside class="sidebar">${sidebar(slug)}</aside>
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
  })();
</script>
</body>
</html>
`;
}

// A generated docs landing (two doors + section index)
function docsHomePage() {
  const cards = nav.map((s) => {
    const links = s.items.map((it) => `<li><a href="${it.slug}/">${it.title}</a></li>`).join('');
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
    try { fragment = renderWit(abs); }
    catch (e) { console.error(`  ERROR ${it.file}: ${e.message}`); failed++; continue; }
    const title = it.title || titleFromFragment(fragment, it.slug);
    writePage(it.slug, layout({ slug: it.slug, title, fragment }));
    n++;
  }
  writeFileSync(path.join(DOCS_OUT, 'index.html'), docsHomePage(), 'utf8');

  console.log(`built ${n} docs pages${failed ? `, ${failed} FAILED` : ''} → website/build/docs/`);
  if (failed) process.exitCode = 1;
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
.wit-doc table{border-collapse:collapse;width:100%;margin:1.2em auto;font-family:var(--sans);font-size:.93rem}
.wit-doc th,.wit-doc td{border:1px solid var(--border);padding:.45rem .7rem;text-align:left;vertical-align:top}
.wit-doc thead th{background:var(--surface-2)}
.wit-doc figure{margin:1.5em 0;text-align:center}
.wit-doc figcaption{margin-top:.5em;font-size:.9em;color:var(--muted)}
.wit-doc .note,.wit-doc aside{background:var(--surface-2);border-left:3px solid var(--accent);
  padding:.7rem 1rem;border-radius:8px;margin:1.2em 0}
img,svg{max-width:100%;height:auto}
@media(max-width:820px){
  .shell{grid-template-columns:1fr}
  .sidebar{position:static;height:auto;border-right:none;border-bottom:1px solid var(--border)}
  .content{padding:1.6rem 1.3rem 4rem}
}
`;

main();
