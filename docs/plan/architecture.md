# Architecture

How the documentation site is built. See [README](README.md) for the index.

## Locked decisions

- **SvelteKit app**, **fully prerendered (SSG)** → static deploy, cheap hosting.
- **All content authored in Wit** (`.wit`), compiled to HTML **once at build
  time** via a `vite-plugin-wit` (import a `.wit` file → get its rendered HTML
  fragment from `@witlang`). No per-request Wit compute. **No Markdown.**
- **Svelte owns only the chrome** — nav, sidebar, table-of-contents, search,
  playground. The body of every page is Wit.
- **The existing Wit landing page stays as the home (`/`)**, untouched. The
  docs are the expansion.
- **Lives in `website/`** — the landing `.wit` files remain the home content;
  `content/docs/**/*.wit` holds the reference.
- **Playground** runs the same engine **in the browser** (client bundle of
  parser + runtime + render-html) → live editable examples. This is the only
  place Wit runs at request time, and it runs on the client, on demand.
- **Search:** client-side (Pagefind over the built HTML) — no backend.
- **The docs are a dogfood + test:** if a `.wit` feature regresses, the docs
  build breaks. The content is part of the test surface.

## The build-time Wit pipeline

Wit renders all content **once, at build time**, not per request:

- A small **`vite-plugin-wit`**: importing a `.wit` file returns its compiled
  HTML fragment, produced by `@witlang`'s `parse → resolve → expand →
  renderHtml` at build. Runs once per file per build, cached.
- A Svelte doc page does `import body from '$content/reference/nodes.wit'` and
  drops it into the layout. The layout (Svelte) provides sidebar, TOC, search,
  theme; the **body is Wit**.
- `export const prerender = true` → SvelteKit outputs a fully static site.
  Zero runtime Wit compute.

So the split is clean: **Svelte = the chrome**, **Wit = 100% of the content**,
compiled at build. The only place Wit runs *live* is the playground — client
-side, on demand — which costs nothing on the server.

## Reusable Svelte components (the chrome)

- `DocLayout` — sidebar + content + right-rail TOC.
- `WitContent` — renders a compiled `.wit` fragment (`{@html}`) with the theme.
- `Playground` / `LiveExample` — in-browser editor + rendered preview
  (sandboxed iframe).
- `Search` — Pagefind UI.
- `PathCards` — the two-door home.
- `ThemeToggle`, `Nav`, `Footer` — shared with the landing's design tokens.

## Deploy

Static output (prerendered) → any static host (GitHub Pages / Vercel / Netlify).
CI runs the build; a `.wit` feature regression fails the build.
