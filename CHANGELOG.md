# Changelog

All notable changes to Wit will be documented in this file.

## 0.2.0

### Language features

- Literal and frozen raw nodes (`@@name … @@`, `@@@name … @@@`) with
  `{{path}}` interpolation inside raw-node bodies.
- Styled render target and a Word/Docs-style default theme.
- External data seam: the `@load` node pulls a JSON/CSV/TSV/lines/text
  result from a configured program (`wit.sources.json`) into a def.
- `@table |rows @data|` — build a table from a referenced data collection.
- Image sizing and placement (`|size|`, `|align|`) plus invisible
  `@row`/`@col` layout containers.
- Core vocabulary grows to 52 names (adds `div`, `span`, `cite`,
  `row`, `col`).
- Typed parameters and iterable captures; emphasis and escape fixes.

### Tooling

- `wit fmt` — re-indents a document to match its nesting without changing
  structure.
- HTML-like indentation (whitespace is for the author; scope comes only
  from open/close pairs).
- PDF output from the CLI, with a `<base href>` so relative assets resolve.

## 0.1.0 — 2026-06-14

Initial public release.

### Packages

- `@witlang/parser` — lexer + parser → typed AST.
- `@witlang/runtime` — resolver + expander.
- `@witlang/render-html` — HTML renderer.
- `@witlang/render-markdown` — Markdown renderer.
- `@witlang/cli` — `wit` command-line tool (parse, check, build, tour).

### Language features

- Nodes, definitions, additive partials, records, collections.
- Data access, conditionals, iteration, scripting.
- 47-name core vocabulary (h1-h6, dl/dt/dd, ul/li, table, etc.).
- Tables (inline-CSV, schema-array, schema-record forms).
- Opaque `@node` pass-through.
- Form-fill body shape (`key: value` lines).
- Record-args (`@x { a - 1, b - 2 }`).
- Colon parameters, quoted strings, multi-line values.
- Block-aware capture substitution.
- VS Code language extension (separate from npm publish; install via `pnpm vscode:install`).

### Known limitations

See `packages/parser/README.md` for current edge cases.
