# Wit website

The Wit site — a landing page plus a full documentation site, both written
entirely in Wit. It doubles as a stress test of the language's ergonomics. The
landing page lives here as `site.wit` + `parts/`; the docs are authored in
[content/](content/) and compiled to static HTML by [generate.mjs](generate.mjs).

## Build & preview

The quickest path is the [Makefile](Makefile) in this folder:

```sh
make build    # compile the landing page + all docs into build/
make serve    # build, then serve build/ at http://localhost:8000
make open     # open the served site in a browser
make clean    # remove generated output
```

`make serve` produces one static tree — `build/index.html` is the landing page
and `build/docs/` is the documentation — and serves it, so the landing's `◑`
dark/light toggle and every docs cross-link work as they would in production.
Override the port with `make serve PORT=9000`. The build imports the compiled
`@witlang` packages; if `dist/` is missing it runs `pnpm build` for you, and
`make dist` forces a refresh after you edit the parser or a renderer.

To build just the landing page on its own (the committed `site.html`):

```sh
# from the repo root
node packages/cli/dist/bin.js build website/site.wit -o website/site.html --raw
```

The `--raw` render pathway is used so the page owns all of its own CSS (in
[theme.wit](theme.wit)) and JS (in [script.wit](script.wit)).

## Structure

| File | Role |
|------|------|
| [site.wit](site.wit) | Root — references every part and emits them in order |
| [theme.wit](theme.wit) | Design system (`#stylesheet` → an `@@style` block) |
| [script.wit](script.wit) | Behaviour: theme toggle, fold-out panels, Wit syntax highlighter |
| [parts/nav.wit](parts/nav.wit) | Sticky top bar |
| [parts/hero.wit](parts/hero.wit) | Headline + code card |
| [parts/features.wit](parts/features.wit) | Manuscript feature cards (click to spawn a detail card) |
| [parts/examples.wit](parts/examples.wit) | Thesis / creative-writing / RPG fold-out examples |
| [parts/stats.wit](parts/stats.wit) | "It's just a parser and an AST" — locally-styled table |
| [parts/footer.wit](parts/footer.wit) | Footer |

`site.html` is generated output — regenerate it with the build command above.
