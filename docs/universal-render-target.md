# Universal render target for Wit — design note

**Status:** design exploration / brainstorm — not yet scheduled.
**Date:** 2026-06-30.
**Goal:** give Wit a single, portable rendered form — the way Markdown
renders identically on GitHub, in VS Code, and in every editor — so a
writer can render a `.wit` file locally for quick inspection, and so that
same target becomes the foundation for a dedicated Wit editor / VS Code
suite whose experience rivals creative-writing tools.

---

## Where the renderer is today

`renderHtml` (`packages/render-html`) emits a bare **fragment**:

```html
<article class="wit-doc"> …semantic HTML… </article>
```

No `<!doctype>`, no `<head>`, no CSS. `wit build -o out.html` writes that
fragment straight to disk, so opening it in a browser today shows
structurally-correct but unstyled HTML. The renderer is deterministic
("configuration-free v1 — each AST kind maps to one fixed HTML shape").
An orphan `docs/spec.css` already styles the spec, which proves the
house-style instinct exists but isn't yet a shipped asset.

## The key insight: the target already exists — it's missing its *contract*

Markdown didn't win because of `.md`. It won because its render target is
**HTML (the web's universal substrate)**, plus a de-facto stylesheet
(`github-markdown-css`), plus the fact that everyone embeds the same
pipeline. Mapped onto Wit:

| Markdown's universality | Wit today |
|---|---|
| Output = HTML | ✅ `wit-doc` fragment |
| Normalized dialect | ✅ deterministic renderer + spec |
| **A canonical house stylesheet** | ❌ **the big gap** — no `wit.css` |
| Embeds everywhere (GitHub, VS Code, email…) | 🟡 CLI only; no preview, no web embed |

So the "universal render target" is not a new format to invent. It is:

> **the `wit-doc` HTML fragment + a versioned canonical stylesheet + a
> documented class/DOM contract.**

That trio is the whole game.

---

## The three layers to build

### 1. The render contract — `@witlang/render-html` gains a document mode

Add `renderHtml(doc, { mode: 'document' | 'fragment', theme })`:

- **document mode** wraps the fragment with `<!doctype>`, `<head>`, a
  `<title>` derived from the doc, and links or inlines the stylesheet.
- **fragment mode** stays as-is, for embedding.

Crucially, **document every class and DOM shape each node produces** — the
"Wit rendering contract." That documentation is what lets third parties
theme the output or build editors without reading renderer source. The
contract doc *is* the universal guarantee.

### 2. The house style — `@witlang/theme`, shipped as a real package

The single highest-leverage missing piece, and where the "rivals creative
writing tools" ambition actually lives. Markdown tools all look like a
GitHub README. Wit is *prose-first*; its default theme should look
**literary**: a ~66ch measure, a real serif stack, curly quotes, hanging
punctuation, proper small-caps, figure/caption layout, and footnote /
marginalia placement. Ship it as CSS variables so themes are swaps:
`light / dark / sepia / manuscript` (double-spaced Courier for editing)
`/ typewriter`. Every surface imports the *same* CSS — that is what makes a
`.wit` file look identical in the browser, the VS Code preview, and an
exported file.

### 3. A source map for free — `data-wit-line` attributes

The AST already carries `{ file, line, col }` on every node. Emit
`data-wit-line` on each block element in the HTML. This one cheap renderer
change unlocks the entire editor experience: **scroll-sync,
click-in-preview → jump-to-source, and live cursor tracking.** It is the
hinge between "a renderer" and "an editor" — do not skip it.

---

## Delivery surfaces (same target, many hosts)

- **VS Code live preview webview** — side-by-side, scroll-synced via
  `data-wit-line`, live-refresh on change. Reuses the parser already
  running in the LSP. This is the "quick local inspection" use case and
  step one of the editor suite.
- **CLI** — `wit preview <file>` opens a self-contained styled HTML (CSS
  inlined) in the default browser; `wit build --document` produces a
  shareable standalone file.
- **Web embed** — a `<wit-doc>` custom element / small hydration script so
  any blog or site can drop in Wit, plus a hosted playground (the "dingus"
  Markdown has). Good for adoption.
- **GitHub — be honest about this one.** github.com only renders formats
  it whitelists; `.wit` cannot render natively there without GitHub adding
  a renderer. The realistic universal fallback is the existing
  `render-markdown`: a CI Action (or pre-commit) renders `.wit` → committed
  `.md` / `.html` artifacts that GitHub *does* render.

---

## Constraint: scripts run at *expand*, not render

`<% %>` blocks execute during **expansion**, before rendering. Any preview
that expands untrusted Wit therefore *runs code*. Fine for previewing your
own files locally; **not** fine for a hosted playground or for embedding
strangers' Wit. A sandboxed / `expand({ noScripts: true })` mode is a
prerequisite for any public surface. Flag it before the playground stage.

---

## Recommended sequencing

1. **Renderer foundation** — document mode + `data-wit-line` + extract
   `@witlang/theme` with one beautiful default literary stylesheet.
   *Everything below builds on this.*
2. **VS Code live preview** — scroll-synced webview (the quick-inspection
   ask, and the suite's spine).
3. **CLI** — `wit preview` / `wit build --document`.
4. **Themes + faceted preview** — light/dark/sepia/manuscript; wire the
   draft/final/public/internal facets to theme/facet switching.
5. **Editor experience** — focus mode, typewriter scroll, outline nav (the
   `documentSymbol` provider already feeds this), word-count status bar.
6. **Web** — embeddable component + sandboxed hosted playground.

The thing to internalize: **steps 2–6 are all just *hosts* for the step-1
artifact.** Get the fragment + theme + source-map contract right once, and
"renders everywhere" becomes wiring rather than re-implementation.

---

## Relationship to the VS Code roadmap

The "Live HTML preview panel" quick-win in `PLAN.md` §D.1 is step 2 here.
This note is the architecture underneath that line: it explains *what*
the preview renders (the document-mode artifact) and *why* it looks the
same everywhere (the shared `@witlang/theme` + rendering contract).
