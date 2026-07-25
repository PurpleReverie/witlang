# Content design — the Developer track (`/docs/build`)

Planning doc for the **Build** door of the Wit docs site: the pages a
programmer reads to *embed* `@witlang/*` or *build tooling* on top of it.
This is the **comprehensive** developer plan — every page is designed to the
[AUTHORING-STANDARD](AUTHORING-STANDARD.md) depth bar (Concept · Why ·
progressive examples · every option/edge · common mistakes · see-also ·
Sources), and every code snippet below was **round-tripped through the built
`packages/*/dist` on 2026-07-05** before being written down. Where a snippet
shows a rendered result, that is the *actual* observed output, not a guess.

Audience for the whole section: **developers**, not authors. Author-facing
syntax (prose, emphasis, records, `each`/`if`) belongs to the Learn track; the
Build track treats a `.wit` file as *input* and the packages as the *machine*.

> This is a PLAN. Section bodies describe what each page must contain, the
> exact snippets to show, and the code/test/fixture sources that keep it
> honest — not the final published prose.

---

## 0. Verified ground truth (read before authoring any page)

Everything here was confirmed against `packages/*/src/index.ts` **and** by
executing the built `dist`. Use these exact names/signatures. Do **not**
transcribe the old spec or `packages/skill/` verbatim — both carry stale
claims (see "Corrections" at the end).

### The pipeline (exact call shapes — verified)

```ts
import { parse } from '@witlang/parser';                    // → Document
import { loadExternalData, resolve, expand } from '@witlang/runtime';
import { renderHtml } from '@witlang/render-html';          // → string
import { renderMarkdown } from '@witlang/render-markdown';  // → string

const doc      = parse(source, 'file.wit');       // parse(source, file?='<inline>')
const loaded   = loadExternalData(doc, dataSrc);  // optional: rewrites @load → DataDef
const resolved = resolve(loaded, { rootPath });   // → ResolvedDocument
const expanded = expand(resolved);                // → ExpandedDocument (runs scripts too)
const html     = renderHtml(expanded, { mode: 'document' });
const md       = renderMarkdown(expanded);
```

Order is **parse → loadExternalData → resolve → expand → render**, exactly as
the CLI does it (`packages/cli/src/cmd-build.ts:158-181`). `loadExternalData`
is optional — skip it and a doc with no `@load` behaves identically.

### Exact public exports (confirmed against each `index.ts`)

- **`@witlang/parser`**: `parse`; `WitError`; `parseInlineFromText`;
  `tryParseRecordFromText`, `tryParseCollectionFromText`; `format`,
  `FormatOptions`; type exports for every AST kind (`Document`, `Block`,
  `Inline`, `AstNode`, `Paragraph`, `Comment`, `NodeUse`, `NodeDef`, `DataDef`,
  `Record`, `Collection`, `IfStatement`, `EachStatement`, `ScriptBlock`,
  `ScriptCall`, `ReferenceDirective`, `Text`, `Italic`, `Bold`,
  `Interpolation`, `BodySlot`, `DataValue`, `StringValue`, `NumberValue`,
  `BooleanValue`, `NullValue`, `Condition`, `ExistenceCondition`,
  `ComparisonCondition`, `Param`, `AccessPath`, `Loc`, `HasLoc`).
- **`@witlang/runtime`**: `resolve`, `expand`; `loadExternalData`,
  `toDataValue`; types `DataLoader`, `DataLoadRequest`, `DataSource`,
  `ResolvedDocument`, `ExpandedDocument`, `ResolveOptions`, `FileReader`;
  errors `RuntimeError`, `ResolverError`, `ExpanderError`, `RuntimeErrorCode`,
  type `RuntimeErrorCodeName`; core vocab `CORE_VOCAB_NAMES`,
  `RESERVED_OPAQUE`, `isCoreVocabName`, `isReservedNodeName`.
- **`@witlang/render-html`**: `renderHtml`, `RenderHtmlOptions`; `escapeHtml`;
  `defaultThemeCss`, `rawThemeCss`.
- **`@witlang/render-markdown`**: `renderMarkdown` (the single export).
- **`@witlang/cli`**: the `wit` bin; commands `parse`, `check`, `fmt`, `build`,
  `tour`. `wit --version` prints **`0.1.0`** (the `VERSION` constant in
  `bin.ts`) even though every package `package.json` is at **`0.2.0`** — a
  known drift to call out, not paper over.

### Numbers that are easy to get wrong (executed, not guessed)

- `CORE_VOCAB_NAMES.length === 52`; **+ the opaque `node` = 53 reserved
  names.** The `runtime/src/index.ts` comment says "47" — **stale.**
- Runtime error codes: **14** (`RuntimeErrorCode`). Parser error codes: **12**
  (`ErrorCode`).
- The CLI data loader recognises **7** output formats
  (`json | csv | tsv | lines | text | svg | html`) plus a built-in `env`.

---

## Architecture overview — `/docs/build/architecture`

**Purpose.** Give the developer the mental model of the pipeline and which
package owns each stage, so every later page has a place to hang.

**Why.** Wit is not a monolith; it is four (optionally five) pure-ish functions
in a line, each with a *named, inspectable* output type. Once you see the
shape you know where to intervene: swap the loader, re-theme the renderer,
write your own renderer, catch errors at the right boundary.

**Concept, one paragraph.** `parse` turns source text into a `Document` AST.
`loadExternalData` (optional) rewrites `@load` nodes into data. `resolve`
*binds* every `@use` to the def or data it names and merges partials/cross-file
references. `expand` *evaluates* — inlines def bodies, substitutes
interpolations/body-slots, runs `if`/`each`, and runs `<% %>` scripts.
`renderHtml`/`renderMarkdown` walk the fully-substituted tree to a string.

**The diagram to draw** (single figure, left-to-right):

```
 source ──parse──▶ Document ──loadExternalData──▶ Document ──resolve──▶ ResolvedDocument
   str            (@witlang/parser)   (optional, @witlang/runtime)      (@witlang/runtime)
                                                                              │
                                                                            expand
                                                                       (@witlang/runtime,
                                                                        runs <% %> scripts)
                                                                              ▼
   str ◀──renderHtml / renderMarkdown── ExpandedDocument
        (@witlang/render-html / -markdown)
```

Annotate: the dashed `loadExternalData` box sits *between* parse and resolve;
scripts run at the **tail of `expand`**, not as their own stage; rendering is a
pure tree walk (no I/O, no config beyond `mode`/`css`).

**The stage table** (show verbatim):

| Stage | Input | Output | Package | May throw |
|---|---|---|---|---|
| parse | `string` | `Document` | `@witlang/parser` | `WitError` (12 codes) |
| loadExternalData | `Document` + `DataSource` | `Document` | `@witlang/runtime` | `RuntimeError` (`E_LOAD_FAILED`) |
| resolve | `Document` + `ResolveOptions` | `ResolvedDocument` | `@witlang/runtime` | `ResolverError` |
| expand | `ResolvedDocument` | `ExpandedDocument` | `@witlang/runtime` | `ExpanderError` |
| render | `ExpandedDocument` + options | `string` | `@witlang/render-*` | — (renders even malformed input safely) |

**Progressive examples.**
- *Basic* — the 6-line pipeline above.
- *Realistic* — one-liner composition `expand(resolve(parse(src)))` (verified:
  a `#greeting … greeting#` def + `@greeting` use renders
  `<article class="wit-doc"><p>Hello from a def.</p></article>`).
- *Edge* — a "pipeline inspector": log `doc.children.map(c => c.kind)`,
  `[...resolved.definitions.keys()]`, `resolved.bindings.size`,
  `expanded.children.map(c => c.kind)` for the same source to *see* defs
  disappear (verified: resolved has `definitions:['greeting']`,
  `bindings.size:1`; expanded is just `['paragraph']`).

**Every option / edge to cover.**
- Each stage's output type is a plain object you can `JSON.stringify` and
  inspect (`ResolvedDocument` carries `Map`s, so log `.keys()`).
- Immutability: the resolver keeps the parser AST immutable — bindings live in
  a side-table (`ResolvedDocument.bindings: Map<NodeUse, Binding>`), not on the
  nodes (`resolved-ast.ts`).
- Re-resolution: `expand` re-resolves uses by *name* rather than reading the
  side-table, because inlined bodies produce fresh `NodeUse` clones the table
  never saw (`expander.ts` header comment).
- Scripts run *inside* `expand` via a fresh `lh` bridge (`expander.ts:76-86`).

**Common mistakes.**
- Handing a renderer a `ResolvedDocument` (defs/`each`/`if` still present) —
  renderers expect an `ExpandedDocument`. The type system catches it; say so.
- Expecting `loadExternalData` to be required. It is a no-op for docs without
  `@load`; call it always or never, your choice.

**See also.** AST reference; Resolve & expand; Rendering; Errors reference.

**Sources.** `packages/cli/src/cmd-build.ts` (canonical ordering, 158-181);
`packages/runtime/src/{resolver,expander}.ts` (pass headers);
`packages/runtime/src/{resolved-ast,expanded-ast}.ts` (output shapes);
`packages/skill/skill/reference/06-custom-renderers.md` (reuse the diagram —
but fix its `resolve` options and the "47", per Corrections).

---

## Install the packages — `/docs/build/install`

**Purpose.** Get the packages into a project and confirm they import.

**Why.** Five small ESM packages with a strict dependency direction; installing
the wrong subset (or expecting CommonJS) is the first failure.

**Concept.** Renderers and the CLI depend on the runtime; the runtime depends
on the parser. Import **only from each package's entry point** — everything
else is package-private (stated in every `src/index.ts` header).

**Outline.**
1. Prerequisites: Node ≥ 20 (verified on v22); **ESM only** — every package is
   `"type": "module"`. No CommonJS `require`.
2. The package map + dependency arrows (parser ← runtime ← render-*/cli).
3. Minimal install for the common case: parser + runtime + one renderer.
4. The CLI: install `@witlang/cli` for the `wit` bin (global vs per-project);
   the CLI bundles its own copies, so it is usable standalone.
5. Smoke test (verified): parse-and-render four lines, `console.log(html)`.
6. TypeScript: types ship with each package; import type-only symbols from the
   entry points, never internal paths.

**Examples to show.**
- Install line: `npm i @witlang/parser @witlang/runtime @witlang/render-html`
  (add `@witlang/render-markdown` for MD).
- The smoke test:
  ```ts
  import { parse } from '@witlang/parser';
  import { resolve, expand } from '@witlang/runtime';
  import { renderHtml } from '@witlang/render-html';
  console.log(renderHtml(expand(resolve(parse('Hello *there*.')))));
  // → <article class="wit-doc"><p>Hello <strong>there</strong>.</p></article>
  ```
- `wit build hello.wit` → styled HTML document on stdout.

**Every edge.** ESM-only (a `require` throws); Node ≥ 20; the `wit --version`
drift (0.1.0 vs 0.2.0) noted so a reader isn't confused; the CLI is the only
package with a `bin`.

**Common mistakes.** Deep-importing `@witlang/runtime/dist/expander.js`
(package-private, may move); mixing a CommonJS build tool without ESM interop.

**See also.** Architecture; Embed Wit; CLI reference.

**Sources.** each `packages/*/package.json` (`name`, `type`, `bin`, `version`);
`packages/cli/src/bin.ts` (`VERSION = '0.1.0'`, command table);
`docs/publishing-to-npm.md`.

---

## Parsing → the AST — `/docs/build/parsing`

**Purpose.** Call `parse()`, understand the tree it returns, and know the
side-door parsers and the formatter.

**Why.** `parse` is the only way in. Any tool — a linter, an LSP, a codemod, a
custom renderer — starts by branching on the tree's `kind` discriminators.

**Concept.** `parse(source, file?) → Document`. `file` defaults to
`'<inline>'` and only feeds `loc.file`. Every node is a tagged union member
with a `kind` string and a `loc` (`{ file, line, col, offset, length }`).

**Outline.**
1. Signature + `file` default; it throws `WitError` (12 codes) with `.code`
   and `.loc` — show the try/catch.
2. The universal node shape (`kind` + `loc`); `Loc` fields.
3. The `Block` union vs the `Inline` union vs `DataValue` (forward to the AST
   reference page for the field-by-field detail; here, just the map).
4. `NodeUse` is the node you branch on most — walk its fields at a high level
   (`name`, `access`, `params`, `paramsSource`, `body`, `inline`, `closeStyle`,
   `raw`, `frozen`) and forward to the reference for the full table.
5. `wit parse file.wit` prints the AST as JSON from the terminal.
6. The side-door parsers: `parseInlineFromText(source, file?='<interpolation>')
   → Inline[]`, `tryParseRecordFromText(src, base: Loc) → { record, endPos } |
   null`, `tryParseCollectionFromText(src, base: Loc) → { collection, endPos }
   | null`. These exist for **re-parsing captured text** (the expander uses
   `parseInlineFromText` to turn a captured string back into emphasis nodes at
   `::name::` substitution). A tool author calls them to parse a fragment
   without a whole document.
7. The formatter: `format(source, opts?: FormatOptions) → string`,
   `FormatOptions = { indent: string }` (default `'  '`). It is a *structural
   re-indenter* — it rewrites only leading whitespace and never reflows prose;
   raw `@@` bodies, `<% %>` scripts, and record/form-fill values are left
   verbatim. Backs `wit fmt` and the VS Code formatter.

**Progressive examples (verified).**
- *Basic* — `parse('The keeper trimmed the wick _slowly_.')` → a `Paragraph`
  whose `children` are `[Text "The keeper trimmed the wick ", Italic{children:
  [Text "slowly"]}, Text "."]`. Show the real JSON (each child has a `loc`).
- *Realistic* — `parse('@aside good aside@')` → a single `NodeUse`:
  ```jsonc
  { "kind": "nodeUse", "name": "aside", "params": [], "paramsSource": "none",
    "body": [{ "kind": "paragraph", "children": [{ "kind": "text", "value": " good " }] }],
    "inline": false, "closeStyle": "named" }
  ```
  **Note the correction:** a named node on its own line is `inline: false`
  (the old plan claimed `inline: true`). `closeStyle` is `'named'` because it
  closed with `aside@`.
- *Edge* — a bad parse: `parse('@aside oops')` throws
  `WitError { code: 'E_UNCLOSED_NODE', loc }`. Show catching it.

**Every option / edge to cover** (each grounded in a fixture folder):
- `paramsSource` records *how* params were written: `'parens'` /`'pipes'`
  /`'mixed'` /`'record'` /`'form-fill'` /`'none'` — enumerate against
  `05-nodes-parens`, `06-parameters-pipes`, `22-record-args`, `23-form-fill`,
  `26-all-param-forms`.
- `closeStyle`: `'named'` (`x@`), `'parens'` (`@x(...)`), `'bare'`.
- `raw`/`frozen`: `@@name … name@@` sets `raw:true` (single verbatim Text
  body); `@@@name` also sets `frozen:true` (no `{{}}` interpolation). Cite
  `20-opaque-node`, the raw-node parser tests.
- `ScriptBlock` carries its JS in a field named **`content`** (not `body`) plus
  `inline` (cite `15-scripting`); `ScriptCall` carries `fnName` + `args:
  string[]` where args are **raw source tokens** (a quoted arg keeps its
  quotes — see Scripting).
- `access?: string[]` populated for `@x.y.z`; `params` empty when none.

**Common mistakes.** Reading `node.content` for a node body (the field is
`body`; only `ScriptBlock` uses `content`); assuming `@x` on its own line is
inline; treating `parse` as total — it throws, so wrap it.

**See also.** AST reference (the field tables); Resolve & expand; Errors
reference; Scripting (for `ScriptBlock`/`ScriptCall`).

**Sources.** `packages/parser/src/parser.ts:40` (signature);
`packages/parser/src/ast.ts` (authoritative kinds);
`packages/parser/src/errors.ts` (12 codes + `WitError`);
`packages/parser/src/{parser-inline,parser-data,format}.ts` (side doors +
formatter); `packages/cli/src/cmd-parse.ts` (`wit parse`);
`tests/fixtures/*.json` (real input→AST pairs, e.g. `15-scripting/*.json`).

---

## AST reference — `/docs/build/ast`

**Purpose.** One authoritative page listing **every** AST kind and **every**
field, so a tool author never has to open `ast.ts`. This is the spine of the
Build track.

**Why.** "Build your own renderer", "Parsing", and every codemod need the
exact shape. The reference bar (AUTHORING-STANDARD §"Reference pages") applies:
each kind gets a signature, its fields, ≥1 example, notes, and the fixture that
verifies its shape.

**Concept.** Discriminated unions keyed on `kind`; every node extends `HasLoc`
(`{ loc: Loc }`). Three top unions: `Block`, `Inline`, `DataValue`; plus
helpers `Param`, `AccessPath`, `Condition`.

**The complete kind catalogue to document** (all fields — verbatim from
`packages/parser/src/ast.ts`, which is the source of truth):

*Top level*
- `Document` — `children: Block[]`.

*Block union* (`Paragraph | Comment | NodeUse | NodeDef | DataDef |
ReferenceDirective | IfStatement | EachStatement | ScriptBlock`):
- `Paragraph` — `children: Inline[]`.
- `Comment` — `text: string`, `inline: boolean`.
- `NodeUse` — `name: string`; `access?: string[]`; `params: Param[]`;
  `paramsSource: 'parens'|'pipes'|'mixed'|'record'|'form-fill'|'none'`;
  `body: (Block|Inline)[] | null`; `inline: boolean`; `closeStyle:
  'named'|'parens'|'bare'`; `raw?: boolean`; `frozen?: boolean`. *The central
  node.* Give it the richest entry.
- `NodeDef` — `name: string`; `captures: string[]`; `shape:
  'block'|'single-line'|'value-block'`; `body: (Block|Inline|Record|
  Collection)[]`; `additive: boolean`. (A single-line def whose whole value is
  a literal collapses to `[Record]` or `[Collection]`.)
- `DataDef` — `name: string`; `value: DataValue`.
- `ReferenceDirective` — `path: string`.
- `IfStatement` — `cond: Condition`; `then: Block[]`; `else?: Block[]`.
- `EachStatement` — `collection: AccessPath`; `itemName: string`; `body:
  Block[]`.
- `ScriptBlock` — `content: string` (the JS text); `inline: boolean`. *Note the
  field is `content`, unique among nodes.*

*Inline union* (`Text | Italic | Bold | Interpolation | BodySlot | NodeUse |
ScriptCall | ScriptBlock | Comment`):
- `Text` — `value: string`.
- `Italic` — `children: Inline[]` → `<em>`.
- `Bold` — `children: Inline[]` → `<strong>`.
- `Interpolation` — `name: string`. The `::name::` capture hole.
- `BodySlot` — (no fields). The `...` slot in a def body.
- `ScriptCall` — `fnName: string`; `args: string[]`.

*DataValue union* (`StringValue | NumberValue | BooleanValue | NullValue |
Record | Collection`):
- `StringValue` — `value: string`; `NumberValue` — `value: number`;
  `BooleanValue` — `value: boolean`; `NullValue` — (none).
- `Record` — `fields: { key: string; value: DataValue }[]` (ordered!).
- `Collection` — `items: DataValue[]`.

*Helpers*
- `Param` — `name: string | null` (null = positional); `value: string`;
  `typedValue?: DataValue` (shape-probed: populated when the captured text
  looks like `[...]`, `{...}`, or a scalar literal — this is what lets
  `@table |rows @sales|` consume a collection).
- `AccessPath` — `segments: string[]`.
- `Condition` = `ExistenceCondition { path: AccessPath }` |
  `ComparisonCondition { left: AccessPath; op: 'is'|'equals'; right: DataValue }`.
- `Loc` — `{ file, line, col, offset, length }`; `HasLoc` — `{ loc: Loc }`;
  `AstNode` — the umbrella union of all of the above.

**Examples to show.** For each of the "big" kinds (`NodeUse`, `NodeDef`,
`DataDef`, `Record`, `IfStatement`, `EachStatement`), show a one-line source →
trimmed JSON, lifted from the matching fixture folder so the shape is
guaranteed:
- `DataDef` + `Record`: `#author: { name - Mara Finch }` → `dataDef{ name,
  value: record{ fields:[{key:'name', value: stringValue}] } }` (cite `09-records`).
- `Collection`: `#tags: [ a, b ]` → `collection{ items:[…] }` (`10-collections`).
- `EachStatement`/`IfStatement` from `13-iteration`/`12-conditionals`.

**Every edge.** `NodeUse.body === null` (self-closing) vs `[]` (empty body);
`Param.name === null` marks positional; `Record.fields` order is preserved
(renderers and `lh.data` rely on it); `typedValue` is additive (`param.value`
always exists). A `NodeDef.body` may hold a `Record`/`Collection` even though
those are not in the `Block`/`Inline` unions (the collapse case).

**Common mistakes.** Assuming `Record` is a JS object — it is an *ordered array
of `{key, value}`*, so two same-named keys can coexist and order matters;
treating `body: null` and `body: []` as the same; forgetting `Comment` and
`NodeUse` appear in **both** `Block` and `Inline` unions.

**See also.** Parsing; Build your own renderer; Resolve & expand (what's gone
post-expand).

**Sources.** `packages/parser/src/ast.ts` (**authoritative** — every field);
`packages/parser/src/loc.ts` (`Loc`/`HasLoc`); the fixture folder per kind.

---

## Resolve & expand — `/docs/build/resolve-expand`

**Purpose.** The two runtime passes that turn a parsed `Document` into a
fully-substituted `ExpandedDocument`.

**Why.** Everything between "I parsed a file" and "I can render it" happens
here: binding uses to defs/data, merging partials and cross-file references,
inlining bodies, evaluating `if`/`each`, running scripts. A renderer author
must know exactly what survives.

**Concept.** `resolve` is *binding* — it answers "what does `@x` mean". `expand`
is *evaluation* — it produces the final tree. Data never renders directly; it
flows through `each`/`if`/interpolation/params.

### resolve

Signature: `resolve(doc: Document, options?: ResolveOptions) →
ResolvedDocument`.

`ResolveOptions` (verified — note **no `readFile`**):
- `rootPath?: string` — the absolute path of the document; required if the doc
  has any `reference` directive (else `E_MISSING_REFERENCE_FILE` is thrown up
  front).
- `fileReader?: (absPath: string) => string` — **synchronous**; how referenced
  files are read. Defaults to a real-FS reader. Supply your own for a virtual
  FS / in-memory docs.
- `onMissingReference?: (path: string) => null | void` — called instead of
  throwing when a referenced file is missing; return `null` to skip it, or
  throw to restore strict behaviour (W-10; for in-progress docs).

Three walks (`resolver.ts` header): (1) collect every `NodeDef`/`DataDef` into
name-keyed maps — duplicate non-additive names throw `E_DUPLICATE_DEFINITION`,
additive `+#x` accumulate in `partials`; (2) merge referenced files' defs/data
in; (3) walk every `NodeUse` and record a binding.

`ResolvedDocument` carries: `children` (the immutable parser AST),
`definitions: Map<string, NodeDef>`, `dataDefs: Map<string, DataDef>`,
`references: Set<string>`, `bindings: Map<NodeUse, Binding>`, `partials:
Map<string, NodeDef[]>`, `resolvedFiles: Map<string, ResolvedDocument>`,
`unresolvedAt: Loc[]` (reserved, always empty today).

Binding rules (`resolver.ts:289-322`):
- `@@name` raw node → no binding (opaque carrier, body is verbatim).
- an iteration item name in scope (`each … as X`) → resolves at expand time, no
  binding recorded; a def's own `captures` are pushed into scope the same way
  (M-W16), so `@cap`/`@cap.field` inside a def body don't fail resolution.
- reserved core vocab + `@node` *without an access path* → pass through, no
  binding.
- bare `@x` → `NodeDef x` (falls back to `DataDef x`); dotted `@x.y` → `DataDef
  x` first (falls back to `NodeDef`).
- first unresolved use throws `E_UNRESOLVED_REFERENCE` at its `loc`.

### expand

Signature: `expand(resolved: ResolvedDocument) → ExpandedDocument`. Walks the
resolved tree and: inlines each bound `NodeUse`'s def body; substitutes
`Interpolation` (`::name::`) and `BodySlot` (`...`); evaluates `IfStatement` to
one branch; unrolls `EachStatement`; resolves ref-valued params onto
`param.typedValue`; then creates the `lh` bridge and **runs `<% %>` scripts**
(`expander.ts:64-87`).

`ExpandedDocument = { kind: 'expanded-document', children: Block[], loc }`. What
is **gone** after expand: `nodeDef`, `dataDef`, `reference`, `interpolation`,
`bodySlot`, and evaluated `if`/`each` (their chosen blocks are spliced in). A
survivor of any of those signals an expansion failure — renderers may treat it
as an error/warn.

Depth guard: recursive defs throw `E_EXPANSION_DEPTH_LIMIT` at 256
(`DEPTH_LIMIT`).

**Progressive examples (all verified against dist).**
- *Basic* — def + use:
  ```
  #greeting
  Hello from a def.
  greeting#

  @greeting
  ```
  `resolve` → `definitions:['greeting']`, `bindings.size:1`; `expand` →
  children `['paragraph']`; render → `<p>Hello from a def.</p>`.
- *Realistic — additive partials* (verified):
  ```
  #tags
  @li alpha li@
  tags#

  +#tags
  @li beta li@
  tags#

  @ul @tags ul@
  ```
  → `<ul><li>alpha</li><li>beta</li></ul>`. The base `#tags` + one `+#tags`
  fold into a single merged `NodeDef`. Cite `08-additive-partials`.
- *Realistic — iteration* (verified):
  ```
  #team: [
    { name - Ada, role - lead }
    { name - Béla, role - ic }
  ]

  @ul
  (each @team as p)
  @li @p.name — @p.role li@
  (end)
  ul@
  ```
  → `<ul><li>Ada — lead</li><li>Béla — ic</li></ul>`. Cite `13-iteration`.
- *Realistic — conditional* (verified):
  ```
  #book: { status - draft }
  (if @book.status is draft)
  @p Draft — do not distribute. p@
  (else)
  @p Final. p@
  (end)
  ```
  → the draft branch renders, the else is dropped. Cite `12-conditionals`.
- *Edge — cross-file* (verified with an in-memory `fileReader`): `reference
  ./shared.wit` + `@brand`, resolved with `{ rootPath: '/proj/main.wit',
  fileReader: abs => files[abs] }`, renders the value defined in the other
  file. Cite `examples/15-references`.

**Every option / edge to cover.**
- The `fileReader` hook is **sync** — an async reader will not work; pre-read
  into a map if your source is async.
- `onMissingReference` returning `null` silently skips; throwing re-strictens.
- `rootPath` absent + a `reference` present → `E_MISSING_REFERENCE_FILE`.
- Circular `reference` → `E_CIRCULAR_REFERENCE`; `resolvedFiles` caches each
  file once so a shared file parses once.
- Duplicate non-additive `#name` → `E_DUPLICATE_DEFINITION`; a partial whose
  shape disagrees with the base → `E_PARTIAL_SHAPE_MISMATCH`.
- Typed-param frame (M-W16): captured params carrying a `typedValue`
  (collection/record/scalar) are pushed as an iteration frame so `@cap.field`
  and `(each @cap)` resolve inside a def body.
- `E_NOT_ITERABLE` when `each` targets a non-collection; `E_MISSING_FIELD` /
  `E_MISSING_RECORD_FIELD` / `E_EXTRA_RECORD_FIELD` for record access
  mismatches; `E_AMBIGUOUS_RECORD_KEY`, `E_TYPE_MISMATCH` — enumerate against
  `11-data-access`, `16-ambiguity`.
- Unknown `@name` (no def, no data, not core) → `E_UNRESOLVED_REFERENCE` at
  **resolve** (verified: `@data.gone` throws before render). Contrast a
  *surviving* unresolved access path, which the renderer shows as a visible
  span (see Rendering).

**Common mistakes.** Passing an async `fileReader` (silently wrong); handing a
`ResolvedDocument` to a renderer; expecting `dataDefs` to still be in the
expanded tree (they are consumed); expecting `bindings` to cover inlined clones
(expand re-resolves by name, by design).

**See also.** AST reference; External data (runs before resolve); Rendering
(what a renderer sees); Errors reference; Scripting (the tail of expand).

**Sources.** `packages/runtime/src/resolver.ts` (+ `resolver-files.ts`,
`resolver-partials.ts`); `packages/runtime/src/expander.ts` (+
`expander-inline.ts`, `expander-conditions.ts`, `expander-iteration.ts`);
`packages/runtime/src/{resolved-ast,expanded-ast,errors}.ts`;
`packages/runtime/src/*.test.ts` (`resolver.test.ts`, `expander.test.ts`,
`additive-partial-*.test.ts`, `capture-iteration.test.ts`,
`optional-reference.test.ts`).

---

## Rendering — `/docs/build/rendering`

**Purpose.** Turn an `ExpandedDocument` into HTML or Markdown; drive modes and
themes.

**Why.** Rendering is the last mile and the most configuration-light stage —
knowing the two knobs (mode, css) and the fixed AST→HTML mapping is the whole
job.

### HTML

`renderHtml(doc: ExpandedDocument, options?: RenderHtmlOptions) → string`.

`RenderHtmlOptions` (verified):
- `mode?: 'fragment' | 'document'` — **default `'fragment'`**. `fragment`
  emits just `<article class="wit-doc">…</article>`. `document` wraps it in a
  full `<!doctype html>` page with the stylesheet inlined into `<head>`.
- `title?: string` — document-mode `<title>` (default `'Wit document'`).
- `lang?: string` — document-mode `<html lang>` (default `'en'`).
- `css?: string` — document-mode stylesheet inlined into `<head>`. Defaults to
  `defaultThemeCss`. Pass `''` for an unstyled page, or your own string.

Theming: `defaultThemeCss` is the Word-like house style (CSS custom
properties, `prefers-color-scheme` dark mode, print/`@page` rules) — a doc with
no CSS of its own renders like a word-processor document. `rawThemeCss` is a
mechanical reset only (box model, no body margin, responsive media) — you style
everything via `@@style` + wrapping nodes. Both are exported strings.

The fixed AST→HTML mapping (verified samples):
- `Paragraph` → `<p>`; empty paragraphs are dropped (no stray `<p></p>`).
- `Italic` → `<em>`, `Bold` → `<strong>`; `Text` → escaped via `escapeHtml`.
- Core vocab `@name` → its fixed element (`@h1`→`<h1>`, `@a |href …|`→`<a
  href=…>`, `@img`→`<img>`, `@row`/`@col`→flex `<div>`s, `@br`/`@hr`→void).
- `@table` → its dedicated renderer (schema + rows + caption; three call forms)
  in `render-table.ts`.
- `@bibliography` → `<div class="wit-bibliography">` with one `<p>` per entry.
- Opaque `@node` → dispatch on the `type` param (see Custom nodes).
- A def body that collapsed to a literal `Record` → `<table
  class="wit-record">`; a `Collection` → `<ul class="wit-collection">`.
- An unknown user `@name` that survived (rare) → `<div|span class="wit-node"
  data-wit-name="…" data-param-…>`.
- Unresolved `::x::` interpolation → `<span
  class="wit-unresolved">::x::</span>`; a surviving unresolved access `@x.y` →
  `<span class="wit-unresolved">@x.y</span>` (visible, never silent).

Safety: all text/attributes pass through `escapeHtml` (`'` → `&#39;`, `"` →
`&quot;`, verified). Raw-text elements `@@style`/`@@script` emit their body
**verbatim** (CSS/JS must not be escaped) but guard the closing tag
(`</style` → `<\/style`). Verified: `@@style .x{color:red} style@@` →
`<style>.x { color: red; }</style>`.

Debug: `WIT_DEBUG_COMMENTS=1` keeps `Comment` nodes as HTML comment markers
(default: dropped). `ScriptBlock`/`ScriptCall` are always dropped (their
effects already ran in expand).

### Markdown

`renderMarkdown(doc: ExpandedDocument) → string` — the single export, **no
options**. CommonMark-ish, hand-rolled per node name. Verified: `@h1 Title h1@`
+ prose + `@ul/@li` →
```
# Title

Some **bold** and *italic* prose.

- One
- Two
```
Sectioning wrappers (`section`, `article`, `header`, `footer`, `nav`, `main`)
are transparent; comments and scripts are dropped; unknown nodes emit their
content unwrapped; there is no Markdown analog for the opaque container so it
emits just the body.

**Progressive examples.** (1) `renderHtml(expanded)` fragment vs
`renderHtml(expanded, { mode:'document', title:'Essay' })`; (2) re-theme with
`css: rawThemeCss` and with a custom string; (3) the same source rendered to
HTML and Markdown side by side.

**Every edge.** `mode` default is fragment (easy to get wrong); `css:''` yields
an unstyled document (style tag omitted entirely); `escapeHtml` means malformed
prose can't yield malformed HTML; the PDF path (CLI) is just document-mode HTML
paginated by headless Chrome — no renderer difference.

**Common mistakes.** Expecting `document` by default; expecting `renderMarkdown`
to take options; double-escaping (the renderer already escapes); putting a
`</style>` inside `@@style` and worrying — it is auto-guarded.

**See also.** Custom nodes (opaque dispatch); Build your own renderer;
Architecture (render is a pure walk).

**Sources.** `packages/render-html/src/render.ts` (options, wrap, mapping);
`packages/render-html/src/theme.ts` (`defaultThemeCss`, `rawThemeCss`);
`packages/render-html/src/{render-core-vocab,render-table,escape}.ts`;
`packages/render-markdown/src/{index,render,render-block,render-inline}.ts`;
`packages/render-html/src/{render,document,render-core-vocab}.test.ts`;
`docs/universal-render-target.md` (theme rationale).

---

## External data — the `DataLoader` seam — `/docs/build/external-data`

**Purpose.** Feed data from outside the document into Wit at build time.

**Why.** `@load` is the *one* seam between Wit and the outside world. Whether
the data comes from a CLI subprocess or an in-process object, the rest of the
pipeline never knows.

**Concept.** `@load <alias> load@` names data by alias only. A host supplies the
value. `loadExternalData(doc, source)` runs **after parse, before resolve** and
rewrites every `@load` into an ordinary `DataDef`, so loaded data is
indistinguishable from a hand-written `#name:` from that point on.

Signatures (verified):
- `loadExternalData(doc: Document, source: DataSource) → Document`.
- `type DataSource = DataLoader | Record<string, unknown>` — a loader function
  **or** a plain dict `{ alias: value }` (the simplest embedded case).
- `type DataLoader = (req: DataLoadRequest) => unknown`.
- `interface DataLoadRequest = { alias: string; args: Record<string, string>;
  loc: Loc }`. `args` are the named captures (`@load cite |key devlin2019|
  load@` → `{ key: 'devlin2019' }`). `|as name|` rebinds the resulting DataDef
  name; `|from alias|` supplies the alias when there is no body prose.
- `toDataValue(value: unknown, loc: Loc) → DataValue` — normalises plain JSON
  into the Wit value model: object → `Record` (ordered fields), array →
  `Collection`, primitives → scalars, `null`/`undefined` → `NullValue`. This is
  the *only* shape that crosses the seam.

**Progressive examples (verified).**
- *Basic — dict form:*
  ```ts
  const doc = loadExternalData(parse('@load meta load@\n@meta.version', 'report.wit'),
    { meta: { version: '0.4.0' } });
  ```
  The first child becomes `dataDef{ name:'meta', value: record{ version:'0.4.0'
  }}`; `expand(resolve(doc))` then renders `<p>0.4.0</p>`.
- *Realistic — function form:* `loadExternalData(doc, (req) => fetchSync(req.alias,
  req.args))` — one call per `@load`, lazy per alias.
- *Edge — `toDataValue`:* `toDataValue({ a:1, b:[2,3] }, loc)` →
  `record{ fields:[{a: numberValue 1}, {b: collection[numberValue 2,
  numberValue 3]}] }` (verified JSON).

**Every option / edge.**
- Dict source: a missing alias throws `no data provided for alias "x"`, which
  surfaces as `E_LOAD_FAILED` at the load site.
- A throwing loader → `E_LOAD_FAILED` with the message and the load `loc`.
- Downstream, loaded data is ordinary data — it flows through `@meta.version`,
  `(each @team as p)`, `@table |rows @downloads|`, and interpolation with no
  special casing.
- `@load` is skipped when it is a raw `@@load` node (the guard checks `raw !==
  true`).
- The CLI host is *one implementation* of the same seam: `makeDataLoader`
  reads `wit.sources.json`, runs the aliased program (gated by `--allow-exec`),
  and parses stdout by declared `format` (json/csv/tsv/lines/text/svg/html);
  `env` is a built-in source returning the process environment. Forward-ref to
  the CLI reference.

**Common mistakes.** Expecting `loadExternalData` to *fetch* — it only calls
your loader/dict; you own the I/O. Returning a class instance instead of plain
JSON (only object/array/scalar cross via `toDataValue`). Forgetting it must run
*before* resolve.

**See also.** Resolve & expand; Embed Wit; CLI reference (the `wit.sources.json`
schema); AST reference (`DataValue`).

**Sources.** `packages/runtime/src/data-loader.ts` (the whole seam — verified
signatures); `packages/runtime/src/data-loader.test.ts`;
`examples/load-demo/{README.md,report.wit,wit.sources.json}`;
`packages/cli/src/data-sources.ts` (the CLI loader).

---

## Build your own renderer — `/docs/build/custom-renderer`

**Purpose.** Walk an `ExpandedDocument` and emit any target (LaTeX, RTF, JSON,
Slack blocks, plain text…).

**Why.** The ship renderers are just tree walks; anyone can write another. This
page turns "a switch on `kind`" into a working renderer.

**Concept.** A renderer is a pure recursive walk over
`ExpandedDocument.children`. `render-html` (~350 lines) and `render-markdown`
are the reference implementations to mirror.

**The kinds you actually handle post-expand.** After `expand`, the tree is
narrow: `paragraph`, `text`, `italic`, `bold`, `nodeUse`, and stray
`record`/`collection` (from a def body that collapsed to a literal). Everything
else — `nodeDef`, `dataDef`, `reference`, `interpolation`, `bodySlot`,
`if`/`each` — should be **gone**; treat a survivor as an error/warn.
`comment`/`scriptBlock`/`scriptCall` may appear but are normally dropped.

**The worked minimal renderer** (write this as the page's centrepiece — a
"render to plain text" that a reader can run):

```ts
import type { ExpandedDocument } from '@witlang/runtime';
import { isReservedNodeName, RESERVED_OPAQUE } from '@witlang/runtime';

function render(node: any): string {
  switch (node.kind) {
    case 'paragraph': return node.children.map(render).join('') + '\n\n';
    case 'text':      return node.value;
    case 'italic':    return '*' + node.children.map(render).join('') + '*';
    case 'bold':      return '**' + node.children.map(render).join('') + '**';
    case 'nodeUse':   return renderNodeUse(node);
    case 'record':    return node.fields.map((f: any) =>
                          `${f.key}: ${renderValue(f.value)}`).join('\n');
    case 'collection':return node.items.map(renderValue).join('\n');
    default:          return ''; // if/each/defs should be gone by now
  }
}

function renderNodeUse(use: any): string {
  const body = (use.body ?? []).map(render).join('');
  if (use.name === RESERVED_OPAQUE) return dispatchByType(use, body); // @node
  if (isReservedNodeName(use.name)) return body;    // core vocab: your mapping
  return body;                                      // user def: body was inlined
}

function getParam(use: any, name: string): string | undefined {
  return use.params.find((p: any) => p.name === name)?.value;
}
```

**Outline / every edge to cover.**
1. The recursive-walk skeleton (above).
2. Dispatching `NodeUse`: use `isReservedNodeName` (52 core names + `node`) and
   `isCoreVocabName` (core minus `node`) to classify; `use.name ===
   RESERVED_OPAQUE` (`'node'`) is the opaque container — dispatch on its `type`
   param; a bound user def's body is *already inlined*, so just emit `use.body`.
3. Reading params: `getParam(use, 'x')`; a param that referenced data carries
   `param.typedValue` (a `DataValue`) — read that, don't re-parse the string.
4. `use.raw` / `use.frozen`: the body is a single verbatim `Text` child. Emit
   it unescaped only for raw-text elements you trust (`style`/`script`); escape
   otherwise.
5. Inline vs block: `use.inline` tells you which; mirror the HTML renderer's
   `BLOCK_KINDS` set for the rest.
6. `access` on a `NodeUse` that survived expansion is an unresolved data path —
   surface it visibly rather than dropping it (the HTML renderer emits a
   `wit-unresolved` span).
7. Testing: mirror the ship renderers' `*.test.ts` — parse→resolve→expand a
   fixture, assert on your output string.

**Common mistakes.** Handling `if`/`each`/`nodeDef` in your walk (they are gone
— if you see one, expansion failed); re-parsing `param.value` when
`param.typedValue` already holds the structured value; escaping a raw
`@@style`/`@@script` body; forgetting `body` can be `null`.

**See also.** AST reference; Rendering; Custom nodes; Resolve & expand.

**Sources.** `packages/render-html/src/render.ts` (canonical walk + block/inline
discrimination); `packages/render-markdown/src/{render,render-block,
render-inline}.ts`; `packages/runtime/src/core-vocab.ts` (`isCoreVocabName`,
`isReservedNodeName`, `CORE_VOCAB_NAMES`, `RESERVED_OPAQUE`);
`packages/skill/skill/reference/06-custom-renderers.md` (reuse structure — but
fix its `resolve` options, the "47", and the `content`/`body` slips).

---

## Embed Wit in an app — `/docs/build/embed`

**Purpose.** Run the full pipeline inside a server, build step, or SSG.

**Why.** Embedding is the five-stage pipeline plus your own `DataSource` — no
CLI, config file, or subprocess. This page is the copy-paste starting point.

**Concept.** Wrap the five stages in one function with try/catch on the two
error families, and choose fragment vs document output.

**The worked helper** (verified end-to-end):

```ts
import { parse, WitError } from '@witlang/parser';
import { loadExternalData, resolve, expand, RuntimeError } from '@witlang/runtime';
import { renderHtml } from '@witlang/render-html';

export function compileWit(src: string, file: string, data: Record<string, unknown> = {}): string {
  try {
    const parsed   = parse(src, file);
    const loaded   = loadExternalData(parsed, data);          // dict DataSource
    const resolved = resolve(loaded, { rootPath: file });     // rootPath for `reference`
    const expanded = expand(resolved);
    return renderHtml(expanded, { mode: 'fragment' });
  } catch (err) {
    if (err instanceof WitError || err instanceof RuntimeError) {
      const { line, col } = err.loc;
      throw new Error(`${file}:${line}:${col}: ${err.code}: ${err.message}`);
    }
    throw err;
  }
}
```

**Outline / every edge.**
1. The end-to-end recipe (above), returning a fragment to inject into a page.
2. The embedded data path: a dict (static) or function (dynamic) `DataSource` —
   no config file, no subprocess (verified from `load-demo/README.md`:
   `loadExternalData(parse(src,'report.wit'), { meta:{version:'0.4.0'},
   sales:[{site:'Dunmore', lit:'yes'}] })` then `expand(resolve(doc))`).
3. Build-time vs request-time: prefer compiling `.wit` once at build (the docs
   site's own `vite-plugin-wit` pattern) and shipping static HTML; request-time
   is fine but cache it.
4. Cross-file docs: pass `rootPath` + a `fileReader` (sync) so `reference`
   resolves against your real or virtual FS (verified in-memory in Resolve &
   expand).
5. Error handling: catch `WitError` (parse) and `RuntimeError`/`ResolverError`/
   `ExpanderError` (resolve/expand); each has `.code` + `.loc`.
6. Output choice: `mode:'fragment'` to inject into a page, `mode:'document'`
   for a standalone file, `renderMarkdown` for a text pipeline.

**Common mistakes.** Forgetting `rootPath` (cross-file docs throw); using an
async `fileReader`; not catching both error families; rendering per-request
without caching.

**See also.** External data; Resolve & expand; Rendering; CLI reference (the
host wiring to contrast).

**Sources.** `examples/load-demo/README.md` (verified "Embedding" snippet);
`packages/cli/src/cmd-build.ts` (the reference host wiring, 158-181);
`docs/plan/README.md` §2 (`vite-plugin-wit`); `examples/15-references`.

---

## Custom nodes / extending vocabulary — `/docs/build/custom-nodes`

**Purpose.** Add formatting beyond core HTML/Markdown, on both the author and
renderer sides.

**Why.** Core vocab is closed (52 names, reserved). Everything else you extend
either by *composition* (a `#def`, no code) or by the *opaque `@node`* +
renderer dispatch.

**Concept — three ways to extend:**
1. A `#name … name#` def — pure composition; the expander inlines it, no
   renderer change.
2. The opaque `@node |type X|` pass-through — survives expand as an ordinary
   `NodeUse` (`name:'node'`) and your renderer dispatches on the `type` param.
3. Reserved core vocab — fixed, *not* extensible (shown for context;
   `isReservedNodeName` rejects redefinition).

**The opaque-node contract (verified).** `@node` needs a `type` param; all
other params + the body survive into the expanded AST. Renderer dispatch
(`render-core-vocab.ts`):
- if `type` is itself a core-vocab name → re-emit that element. Verified: `@node
  |type img| |src ./lamp.png| |alt …|` → `<img src="./lamp.png" alt="The
  keeper&#39;s lamp">`.
- otherwise → a generic `<div>` carrying **every named param as
  `data-<name>`**. Verified: `@node |type chart| |layout horizontal| A body
  node@` → `<div data-type="chart" data-layout="horizontal"><p> A body
  </p></div>`. **Correction:** it is `data-type`, not `data-wit-type` (the
  source comment is loose); *all* params including `type` become `data-*`.
- Markdown has no opaque container, so it emits just the body.

**The preferred authoring pattern (verified).** Wrap `@node` in a def so authors
get a natural name:
```
#highlight ||content||
@node |type highlight| ::content:: node@
highlight#

@highlight Some emphasised text highlight@
```
The author writes `@highlight …`; the AST carries `type highlight` for the
renderer to dispatch on (fixture `20-opaque-node/user-defined-wrapper.wit`).

**Every edge.** `@node` with a body block form (`node@`) vs self-closing
(`bare-node-passthrough.wit`); unknown `type` stays round-trippable via `data-*`
so documents remain portable across renderers; a duplicate non-additive `#name`
throws `E_DUPLICATE_DEFINITION`; core names cannot be redefined.

**Common mistakes.** Trying to redefine `@table` or `@h1` (reserved); expecting
Markdown to render an opaque container (it emits body only); reading
`data-wit-type` (it's `data-type`).

**See also.** Build your own renderer; Rendering; AST reference (`NodeUse`,
`raw`/`frozen`); the opaque-node fixture-coverage note below.

**Sources.** `packages/render-html/src/render-core-vocab.ts` (`renderOpaque`,
`passThroughAttrs`, the `data-*` fallback); `packages/runtime/src/core-vocab.ts`
(reserved-name rules); `packages/parser/src/ast.ts` (`NodeUse`);
`tests/fixtures/20-opaque-node/*` (+ `_notes.md`);
`packages/skill/skill/reference/08-custom-nodes.md` (verify against code).

---

## Scripting & the `lh` bridge — `/docs/build/scripting`

**Purpose.** The `<% %>` escape hatch — plain JS run against the expanded tree
via the `lh` bridge.

**Why.** For "everything the declarative model can't express": derived values,
sorting, injecting generated content.

**Concept & where it runs.** Scripts execute **inside `expand()`**, after
inline/if/each expansion, in document order (last-script-wins on shared state).
Not a separate stage; renderers never see script nodes (`ScriptBlock`/
`ScriptCall` are dropped from output — their effects already ran).

**Two forms.**
- Block `<% … %>` — run for side effects; top-level `function NAME(){}` decls
  are captured across blocks (the runner appends `__env.NAME = NAME`).
- Inline `<% expr %>` — evaluated for its **return value**, spliced into prose
  as a `Text` node. `@scriptCall(fn, …)` invokes a captured function and
  splices its return the same way.

**The `lh` bridge surface (verified from `lh-bridge.ts`).**
- `lh.data.<name>` — read-only proxy over resolved `DataDef`s. Scalars come back
  as JS primitives; records as a proxy with **canonical-key** access
  (`lh.data.paper.word_target` reaches a field keyed `word target`);
  collections as arrays. Unknown name → `undefined`. Writes are ignored.
- `lh.query(kindName)` — every node in the tree whose **AST `kind`** equals
  `kindName` (e.g. `lh.query('nodeUse')`), returned as raw nodes. *It queries
  by AST kind, not by node name* — to find `@finding` nodes, query `'nodeUse'`
  and filter on `params`.
- `lh.node(id)` — the first `nodeUse` whose `params` has an `id` matching, or
  `undefined`.
- `lh.sort(kindName, cmp)` — reorder all instances of a `kind` in place within
  each parent (siblings preserved). `cmp` receives the raw nodes, so compare on
  `a.params.find(p => p.name === 'weight')?.value`.
- `lh.inject(id, witSource)` — parse+expand `witSource` and replace the body of
  the node whose `id` param matches. Best-effort v1.
- `lh.set(path, value)` — write into an **overlay map** (no AST mutation); later
  `lh.data` reads see it.
- `lh.prose()` → `{ text, wordCount() }` — concatenated text content with a word
  counter.

**Progressive examples (verified, self-contained).**
- *Basic — inline expr + scriptCall:*
  ```
  #paper: { word count - 1200 }

  The paper has <% lh.data.paper['word count'] %> words.

  <% function greet(name){ return 'hello, ' + name; } %>

  The system says: @scriptCall(greet, "world")
  ```
  → `<p>The paper has 1200 words.</p><p>The system says: hello, &quot;world&quot;</p>`.
  **Gotcha to teach:** `@scriptCall(greet, "world")` passes the arg as the raw
  source token `"world"` — **quotes included** — so the output is `hello,
  "world"`. `args: string[]` are literal tokens, not JS-parsed values.
- *Realistic — query + inject a count:*
  ```
  @node |id fc|  |type finding| A holds node@
  @node |id fc2| |type finding| B holds node@
  @node |id count| node@

  <%
  const findings = lh.query('nodeUse')
    .filter(n => n.params.some(p => p.name === 'type' && p.value === 'finding'));
  lh.inject('count', '@p ' + findings.length + ' findings. p@');
  %>
  ```
  → the `@node |id count|` div's body becomes `2 findings.`.
- *Edge — sort + overlay + prose:* a block that does `lh.sort('nodeUse', cmp)`,
  `lh.set('wordcount', lh.prose().wordCount())`, and `lh.inject('stats', …)` in
  one pass (verified to run).

**The `examples/17-scripting.wit` caveat (important).** That file is
**illustrative, not runnable standalone** — it references undefined nodes
(`@paper-stats`, `@finding`, `@statrow`, `@scene`) so `resolve` throws
`E_UNRESOLVED_REFERENCE`. Walk it for *shape* (the shape of a real scripting
doc), but the page's *runnable* snippets must be self-contained like those
above. Do **not** claim it renders as-is.

**Execution model & security.** Compiled with `new Function('lh', '__env',
…args, src)` — **no real sandbox**. Scripts see `lh`, the captured `__env`
functions, and the host's global scope. Authoring input is trusted by design in
v1. State this plainly for anyone embedding untrusted input: do not.

**Errors.** A throwing script → `E_SCRIPT_ERROR` with the block/call `loc`
(verified: a script that `throw`s aborts expansion). An unknown
`@scriptCall(name)` → `E_SCRIPT_ERROR` (`references unknown function`).

**Common mistakes.** Expecting `lh.query('finding')` to find `@finding` nodes
(it queries AST `kind`, so use `'nodeUse'` + filter); expecting `@scriptCall`
args to be JS values (they are raw tokens — a quoted string keeps its quotes);
expecting `lh.set` to mutate the AST (overlay only); expecting scripts to run at
render time (they run in expand); embedding untrusted input (no sandbox).

**See also.** Resolve & expand (scripts are the tail of expand); AST reference
(`ScriptBlock.content`, `ScriptCall.args`); Rendering (script nodes dropped);
Errors reference (`E_SCRIPT_ERROR`).

**Sources.** `packages/runtime/src/script-runner.ts` (two-phase execution,
`new Function`, decl capture); `packages/runtime/src/lh-bridge.ts` (the full
`lh` surface — verified); `packages/runtime/src/expander.ts:64-87` (bridge +
`runScripts` inside `expand`); `packages/runtime/src/{script-runner,
lh-bridge}.test.ts`; `examples/17-scripting.wit` (illustrative);
`packages/skill/skill/reference/05-scripts-lh-bridge.md` (verify against code).

---

## Errors reference — `/docs/build/errors`

**Purpose.** One page listing every error code, which stage throws it, and the
fix — a reference the pipeline pages forward to.

**Why.** Errors are the developer's contract with the pipeline; `.code` is
stable and switchable.

**Concept.** Two typed error families, both carrying `code` + `loc`:
- Parse: `WitError` (`.code: ErrorCodeName`), **12 codes**.
- Runtime: `RuntimeError` base, with subclasses `ResolverError` (resolve) and
  `ExpanderError` (expand); `.code: RuntimeErrorCodeName`, **14 codes**.

**The two code tables to publish (verbatim from source).**

*Parser — `ErrorCode` (`packages/parser/src/errors.ts`):* `E_UNCLOSED_NODE`,
`E_UNCLOSED_COMMENT`, `E_UNCLOSED_DEFINITION`, `E_UNCLOSED_PAREN`,
`E_MISMATCHED_CLOSE`, `E_MALFORMED_RECORD`, `E_UNCLOSED_COLLECTION`,
`E_UNCLOSED_SCRIPT`, `E_UNCLOSED_RAW_NODE`, `E_MIXED_PARAM_SOURCE`,
`E_MALFORMED_FORM_FIELD`, `E_UNTERMINATED_STRING`.

*Runtime — `RuntimeErrorCode` (`packages/runtime/src/errors.ts`):*
`E_UNRESOLVED_REFERENCE`, `E_CIRCULAR_REFERENCE`, `E_MISSING_REFERENCE_FILE`,
`E_MISSING_FIELD`, `E_PARTIAL_SHAPE_MISMATCH`, `E_TYPE_MISMATCH`,
`E_DUPLICATE_DEFINITION`, `E_EXPANSION_DEPTH_LIMIT`, `E_NOT_ITERABLE`,
`E_AMBIGUOUS_RECORD_KEY`, `E_SCRIPT_ERROR`, `E_MISSING_RECORD_FIELD`,
`E_EXTRA_RECORD_FIELD`, `E_LOAD_FAILED`.

**Per-entry detail (the reference bar).** For each code: which stage, one-line
cause, a minimal source that triggers it, and the fix. E.g.
`E_MISSING_REFERENCE_FILE` = resolve, "a `reference` directive but no
`rootPath`" → pass `rootPath` (verified). `E_EXPANSION_DEPTH_LIMIT` = expand,
recursive def past 256. `E_LOAD_FAILED` = load, a throwing/absent alias.

**How the CLI surfaces them** (verified in `cmd-build.ts:formatStageError`):
`file:line:col: CODE: message`.

**See also.** every pipeline page; Troubleshooting (Learn track).

**Sources.** `packages/parser/src/errors.ts`; `packages/runtime/src/errors.ts`;
`packages/cli/src/cmd-build.ts` (`formatStageError`); the `.err.json` fixtures.

---

## CLI reference — `/docs/build/cli`

**Purpose.** The `wit` binary as a reference host — the commands, flags, and the
`wit.sources.json` schema — so a developer can use it *and* read it as the model
host implementation.

**Why.** The External data and Embed pages both forward here; the CLI is the
one concrete `DataLoader` implementation shipped.

**Commands (verified `wit --help`).**
- `wit parse <file>` — print the AST as JSON.
- `wit check <file>` — parse/resolve/expand and report errors only.
- `wit fmt <file> [-w|--write]` — structural re-indent (via `format()`).
- `wit build <file> [-o out.html|out.md|out.pdf] [--format html|md|pdf]
  [--raw | --fragment] [--sources wit.sources.json --allow-exec] [--env .env]`.
- `wit tour <file>` — narrated walkthrough.
- `wit --version` (→ `0.1.0`) / `wit --help`.

**`build` output paths (verified `cmd-build.ts`).** Format inferred from `-o`
extension (`.html/.htm` → html, `.md/.markdown` → md, `.pdf` → pdf) or
`--format`; default is styled HTML **document** on stdout. `--fragment` emits
the bare `<article>`; `--raw` uses `rawThemeCss`; PDF renders document-mode HTML
then paginates with a discovered headless Chrome (`WIT_CHROME` overrides;
`--no-pdf-header-footer`).

**The external-data host (`data-sources.ts`).** `env` is built in (process env +
optional `--env` dotenv, as a record). Other aliases come from
`wit.sources.json`: `{ "sources": { "<alias>": { "run": ["cmd","arg"], "format":
"json|csv|tsv|lines|text|svg|html", "timeoutMs": 30000 } } }`. Running a program
requires `--allow-exec` (a document can name only an alias, never a command —
the security boundary). Captures reach the program two ways: `{{name}}`
substituted into argv, and the full capture object as JSON on stdin. CSV/TSV get
a minimal header-keyed parse (no quoted fields).

**Common mistakes.** Expecting `@load <alias>` to run without `--allow-exec`
(only `env` works); expecting quoted CSV fields to parse; relying on
`wit --version` for the package version (it's the drifted `0.1.0`).

**See also.** External data; Embed Wit; Errors reference.

**Sources.** `packages/cli/src/bin.ts` (commands, `VERSION`);
`packages/cli/src/cmd-build.ts`; `packages/cli/src/data-sources.ts`;
`examples/load-demo/{wit.sources.json,README.md}`.

---

## Page list & fixture-coverage note

**The Build track (13 pages):**

1. Architecture overview — `/docs/build/architecture`
2. Install the packages — `/docs/build/install`
3. Parsing → the AST — `/docs/build/parsing`
4. AST reference — `/docs/build/ast`
5. Resolve & expand — `/docs/build/resolve-expand`
6. Rendering — `/docs/build/rendering`
7. External data — the `DataLoader` seam — `/docs/build/external-data`
8. Build your own renderer — `/docs/build/custom-renderer`
9. Embed Wit in an app — `/docs/build/embed`
10. Custom nodes / extending vocabulary — `/docs/build/custom-nodes`
11. Scripting & the `lh` bridge — `/docs/build/scripting`
12. Errors reference — `/docs/build/errors`
13. CLI reference — `/docs/build/cli`

**Fixture coverage — `15-scripting` (10 fixtures).** These are **parse-only AST
snapshots** (`{ "ast": …, "ok": true }`) that lock the parser's shape for the
scripting surface; the *runtime* `lh` behaviour is verified separately in
`lh-bridge.test.ts` / `script-runner.test.ts`. The Scripting page must account
for each:
- `block-script-basic` — a `<% %>` block calling `lh.inject`.
- `inline-script` — `<% expr %>` inside prose (`ScriptBlock inline:true`).
- `script-call-node` — `@scriptCall(greet, "world")` (bareword fn + quoted
  positional arg → `ScriptCall{ fnName, args }`).
- `lh-query-nodes` — `lh.query('finding')` (queries a kind name).
- `lh-set-value` — `lh.set('paper.word count', 1200)` then read back (overlay,
  not AST mutation).
- `lh-data-read` — `lh.data.themes` (collection → array).
- `lh-sort-instances` — `lh.sort('finding', cmp)`.
- `lh-inject-into-node` — `lh.inject('paper-stats', src)`.
- `multiple-script-blocks` — two blocks, second reads first's `lh.set`
  (document order, last-write-wins).
- `script-with-no-effect` — a block that `throw`s on a missing precondition
  (→ `E_SCRIPT_ERROR`, expansion aborts).

**Fixture coverage — `20-opaque-node` (3 fixtures).** Parse-only snapshots for
the opaque container; the Custom-nodes page must account for each:
- `bare-node-passthrough` — `@node |type img| …` self-closing → core-vocab
  dispatch (`<img>`).
- `node-with-body` — `@node |type figure| … node@` block form.
- `user-defined-wrapper` — `#highlight` wrapping `@node |type highlight|` so the
  author gets a natural name while the AST carries `type` for the renderer.

---

## Corrections to carry into authoring (stale sources — do not copy blindly)

These are wrong in `packages/skill/skill/reference/*` and/or the `index.ts`
comments; the docs must state the corrected version. **All confirmed by
executing `dist`.**

1. **Core vocab count is 52, not 47** (`CORE_VOCAB_NAMES.length === 52`; +`node`
   = 53 reserved). Wrong in `runtime/src/index.ts` comment and skill 06.
2. **`ResolveOptions` has no `readFile`.** The real options are `rootPath?`,
   `fileReader?: (absPath) => string` (**synchronous**), and
   `onMissingReference?`. Skill 06 shows an async `readFile` — wrong.
3. **`NodeUse` has `raw` and `frozen`; `Param` has `typedValue`.** Include them;
   they drive literal `@@` bodies and data-ref params.
4. **The node body field is `body`, not `content`** — except `ScriptBlock`,
   whose JS text field *is* `content`. Don't conflate them.
5. **Scripts run inside `expand`, not at render time.** Renderers never see
   script nodes.
6. **`@node` unknown-type fallback emits `data-<param>` attributes** (e.g.
   `data-type`, `data-layout`), not `data-wit-type`. Every named param,
   including `type`, becomes a `data-*` attribute.
7. **A named node on its own line is `inline: false`.** The old plan's Parsing
   example claimed `@aside good aside@` yields `inline: true` — verified false.
8. **`@scriptCall` args are raw source tokens.** `@scriptCall(greet, "world")`
   passes `"world"` (quotes included), yielding `hello, "world"`.
9. **`renderHtml` defaults to `mode: 'fragment'`**, not document.
10. **`examples/17-scripting.wit` is illustrative, not runnable** — it
    references undefined nodes and throws `E_UNRESOLVED_REFERENCE`. Use
    self-contained snippets for anything the reader is meant to run.
11. **`wit --version` prints `0.1.0`** (the `bin.ts` `VERSION` constant) while
    packages are at `0.2.0`. Note the drift; don't cite `wit --version` as the
    package version.
12. Ground every code example by round-tripping it through
    `parse → resolve → expand → render` (or a fixture) before publishing.
