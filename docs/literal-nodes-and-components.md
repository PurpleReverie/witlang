# Literal nodes, interpolation & components — design + next steps

**Status:** in progress. The literal-node layer and `{{…}}` interpolation
have shipped (working tree); the component layer is designed but not yet
built. **Date:** 2026-07-01. Companion to
[`universal-render-target.md`](./universal-render-target.md).

This note records the model we converged on and the remaining build
order, so the work can be resumed without re-deriving the design.

---

## The model (final)

One rule governs substitution:

> **`{{path}}` is the only active substitution.** It is live in strings,
> normal content, and `@@` raw bodies. It is **inert** inside a frozen
> `@@@` body and inside `<% %>` scripts (scripts reach scope via `lh`).
> Single braces (`{ }`) are always literal — which is why CSS works.

The number of `@` is a **freeze level**:

| Form | Wit syntax (`@ # _ * ::`) | `{{…}}` |
|---|---|---|
| `@x … x@` | live | live |
| `@@x … x@@` | **frozen** | live |
| `@@@x … x@@@` | **frozen** | **frozen** |

Two interpolation *outputs*, same name lookup:

- **`{{name}}`** → the value as a **scalar string** (class names, colours,
  attributes, CSS values, raw-body holes).
- **`::name::` / `...`** → the value as **rich content** (block/inline
  nodes — the children, a captured paragraph).

The **body** is just a parameter — the content slot — fillable two ways:

- `@@thing … thing@@` → fills `body` **literally** (`@@@` for fully frozen).
- `@thing body:"… {{x}} …"` → fills `body` with an **interpolatable string**.

A literal node is **defined** with `##name … name##` and reads its content
via `{{body}}` (string) or `::body::` (content). Scope for `{{path}}`
resolves **local params → document globals**, never the caller's locals.

A component, then, is: **params + a body slot + `{{}}` + `##`/`@@`.**

---

## Shipped (working tree)

- **`@@name … name@@`** literal nodes — verbatim body; `@`, `#`, `_`, `*`,
  `::` all inert. Lexer (`packages/parser/src/lexer-raw.ts`), AST
  (`NodeUse.raw`), both parser dispatch sites, parser tests.
- **`@@@name … name@@@`** — frozen (`NodeUse.frozen`); `{{…}}` passes
  through verbatim for downstream template engines.
- **`{{path}}` interpolation** in `@@` bodies — resolves against records
  (`{{theme.accent}}`, dotted), single-line defs (`#accent: green`), and
  iteration vars; single braces literal; unresolved → `E_UNRESOLVED_REFERENCE`.
  (`packages/runtime/src/expander.ts`.)
- **Renderers** — `style` / `script` raw nodes emit unescaped raw-text
  elements (with break-out guard); other raw nodes escape their body.
- **Custom CSS in the default render path** — `@@style … style@@` ships a
  `<style>` that cascades over the head theme.
- **VS Code 0.4.0** — grammar for `@@`/`@@@`, CSS/JS injection inside
  `@@style`/`@@script`, `{{…}}` hole highlighting.

---

## Next steps (build order)

The first two unlock components; the rest broaden reach.

1. **The `body` parameter** + the **`@@` ≡ `body:` (literal)** equivalence
   — make `@@thing X thing@@` and `@thing body:"X"` produce the same
   expansion (the `@@` form just guarantees no interpolation).
2. **`##name … name##` raw def** — a literal-node definition whose template
   consumes the content via `{{body}}` / `::body::`. Lexer (`##` open/close),
   parser-defs (`NodeDef` raw flag), expand-time binding of the call's body
   into the slot. (Also: VS Code grammar for `##…##`; today the plugin only
   knows `@@…@@`.)
3. **`{{}}` in strings** — quoted string param values interpolate (`body:"card-{{title}}"`).
4. **`{{}}` in normal content** — needs disambiguation from record-arg
   (`@x {…}` vs `@x {{…}}`); single `{` stays record-arg, `{{` becomes a hole.
5. **Capture / param scope** — `{{path}}` resolving against the enclosing
   def's captures (the component-parameter case), layered onto today's
   document-global resolution.
6. **Param defaults** — `||accent = "#6d4aff"||` so components are usable
   without passing every prop.
7. **Component CSS dedup / hoist** — emit a `##` component's `@@style`
   **once per component type** (keyed by `##name`), hoisted into `<head>`
   after the theme; per-instance variation flows through CSS custom
   properties (`style:"--accent: {{accent}}"`), not regenerated selectors.
8. **Escape nicety (optional)** — `@@@` already covers bulk verbatim; a
   per-string `\{{` (Handlebars-style) only if surgical in-string escapes
   are wanted.

---

## Open bugs / limitations to ticket

- **`{{}}` not in normal content yet** — only `@@` bodies (and, after
  step 3, strings). In prose, `{` still means record-arg, so `@code {{x}} @`
  errors; use `@@@code {{x}} code@@@` to show a literal hole. (Step 4.)
- **Record parser: `#` hex in a multi-field record fails** —
  `{ a - #111, b - #222 }` does not resolve (quoted or not); single-field is
  fine. Unrelated to interpolation; workaround is named colours or top-level
  defs.
- **`wit check` misses unresolved `{{}}`** — interpolation runs at *expand*,
  not resolve, so `check` passes on an unresolvable hole. Consider a
  resolve-time validation pass.
- **`@@table |rows @ref|` doesn't resolve references** — the table renderer
  reads `rows`/`schema` as literal text; a `@ref` is not inlined (carried
  over from the render-target work — see `packages/render-html/src/render-table.ts`).
