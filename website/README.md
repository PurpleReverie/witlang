# Wit website

The Wit landing page — written entirely in Wit and assembled from many files
into one page. It doubles as a stress test of the language's ergonomics.

## Build

```sh
# from the repo root
node packages/cli/dist/bin.js build website/site.wit -o website/site.html --raw
```

Then open `website/site.html` in a browser. The `◑` control toggles dark/light.

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
