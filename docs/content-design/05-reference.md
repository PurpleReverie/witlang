# Content design — Reference (comprehensive spec)

Planning doc for the **Reference** section of the Wit docs site
(`/docs/reference/*`). This section **is the deprecation target for
`docs/spec.md`**: per `docs/plan/README.md` §9 (option a), the Reference
pages *become* the authoritative specification, kept honest by live
examples seeded from the fixtures.

This doc designs **what each reference page covers, its exact enumeration,
and the per-entry depth** — it is a page plan, not final prose, but every
enumeration is exhaustive and lifted from **code + fixtures**, never from
the stale `docs/spec.md`. Every claim was verified against the working tree
(built CLI at `packages/cli/dist/bin.js`) on the current checkout, and the
"reflects real behaviour" notes below were reproduced with
`node packages/cli/dist/bin.js build /tmp/x.wit --fragment`.

## Conventions used here
- Slugs follow the site map in `docs/plan/README.md` §5.
- "Live example seed" = the fixture (or built snippet) the page's embedded
  editor opens with. Fixtures are machine-verified input→output, so a
  reference example lifted from one cannot drift.
- Sources are absolute-from-repo-root paths.
- Reference pages are lookup-oriented: lead with a scannable table/index,
  then one entry per row. Every entry is anchored (`#slug`) for deep links.

## The Reference entry template (the "extra bar")
Every node / flag / error / API / config entry on a Reference page renders
against this fixed template — no field optional, "none" stated explicitly:

> **`<signature / syntax>`**
> 1. **Syntax** — the canonical surface form (and every accepted variant).
> 2. **Every parameter** — name · meaning · default · accepted values.
> 3. **Emits / returns** — exact HTML shape (or return type / exit code).
> 4. **Context** — block vs inline-context vs void (core vocab); pass/stage
>    (CLI/API).
> 5. **≥2 examples** — input → *rendered output*, basic then edge.
> 6. **Notes & caveats** — the surprises, quirks, and boundaries.
> 7. **Related errors** — the codes this entry can raise (or "none").
> 8. **Fixture** — the `tests/fixtures/*` file that verifies it (or the
>    built snippet + its checked snapshot).

The **Cheatsheet** and **Glossary** pages are the two exceptions: they are
scan-first (a syntax card and a term dictionary), not per-entry templated.

## Corrections found while verifying (fold into the pages)
Code-vs-comment/tag drifts caught during this pass — the Reference states
the **code** truth; the Project/Changelog pages track the drift:
1. **Core vocab is 52 names, not 47.** `CORE_VOCAB_NAMES`
   (`packages/runtime/src/core-vocab.ts`) has 52 entries; the doc-comment
   in `packages/runtime/src/index.ts` (line ~37) still says "the 47
   reserved node names". Count: 6 headings + 10 inline marks + 6 lists +
   6 links/media + 8 tables + 4 blocks + 7 sectioning + 2 generic +
   2 layout + 1 cite = **52**.
2. **Error total is 26** = 12 parser (`ErrorCode`) + 14 runtime
   (`RuntimeErrorCode`), plus the non-coded CLI message
   `E_UNKNOWN_OUTPUT_FORMAT`.
3. **`VERSION = '0.1.0'`** in `packages/cli/src/bin.ts`, but a `v0.2.0`
   git tag/commit exists. The CLI page quotes the code constant and flags
   the drift.
4. **Colon-scatter is internally classified `paramsSource: pipes`**
   (verified via `wit tour`). Runtime `paramsSource` enum has six values —
   `parens`, `pipes` (covers pipes **and** colon-scatter), `record`,
   `form-fill`, `none`, `mixed` (the last produced only for combined forms;
   illegal mixes throw `E_MIXED_PARAM_SOURCE`).

## Shared facts (state once on the Reference landing, reuse everywhere)
- **Pipeline:** `lex → parse → resolve → expand → render`. The `@load`
  external-data pass runs **between parse and resolve**
  (`packages/runtime/src/data-loader.ts`; wired in `cmd-build.ts` as
  `loadExternalData(parse(...))` → `resolve` → `expand`).
- **Packages:** `@witlang/parser`, `@witlang/runtime`,
  `@witlang/render-html`, `@witlang/render-markdown`, `@witlang/cli`
  (+ `@witlang/skill`, `wit-vscode`). `@witlang/cli` ships **no library
  index** — binary only (`dist/bin.js`).
- **Diagnostic format everywhere:** `file:line:col: E_CODE: message`.
  **Exit codes:** `0` ok · `1` stage/IO error · `2` usage error.
- **HTML has three pathways** (`cmd-build.ts htmlOptions`):
  **default** = self-contained styled document (`defaultThemeCss`, a
  Word-like house style); **`--raw`** = full document with a reset-only
  base (`rawThemeCss`) for author-supplied styling; **`--fragment`** = bare
  `<article class="wit-doc">…</article>`.

Suggested landing page: **Reference overview — `/docs/reference`** — the
shared facts above, the entry template, and a card grid linking the twelve
pages below.

---

# Page index

| # | Page | Slug | What it enumerates |
|---|------|------|--------------------|
| 1 | Syntax | `/docs/reference/syntax` | Every surface form (call/def/data/control/inline) |
| 2 | Core vocabulary | `/docs/reference/core-vocabulary` | All **52** reserved nodes + `@node` + specials |
| 3 | Tables | `/docs/reference/tables` | `@table` forms, `@ref`, header/caption controls |
| 4 | CLI | `/docs/reference/cli` | 5 commands, every flag, exit codes, env vars |
| 5 | Config | `/docs/reference/config` | `wit.sources.json`, `env` source, formats, security |
| 6 | Data model | `/docs/reference/data-model` | The 6 `DataValue` kinds, access, coercion |
| 7 | Errors | `/docs/reference/errors` | All **26** codes + `E_UNKNOWN_OUTPUT_FORMAT` |
| 8 | API | `/docs/reference/api` | Public exports + signatures per package |
| 9 | Gotchas & anti-patterns | `/docs/reference/gotchas` | Reproducible traps + do/avoid table |
| 10 | Known limitations | `/docs/reference/limitations` | What Wit doesn't do (yet) |
| 11 | Glossary | `/docs/reference/glossary` | Every Wit term defined |
| 12 | Cheatsheet | `/docs/reference/cheatsheet` | One-screen syntax card |

---

## 1. Syntax reference — `/docs/reference/syntax`

- **Purpose:** One page showing *every* surface form Wit accepts — node
  calls, definitions, data, control flow, scripts, inline marks, escapes —
  with the canonical shape, the AST it produces, and the close rule. The
  "how do I write X" index. **Structure:** three tables (Call forms,
  Definition forms, Other constructs); each row: *form → shape → AST kind /
  `paramsSource`|`shape` → close rule → seed fixture*, linking to the guide
  for depth.

- **Enumeration — Node call forms** (AST `nodeUse`; `paramsSource` /
  `closeStyle` verified via `wit tour`):
  - **Bare reference** — `@name` — `paramsSource: none`, `closeStyle:
    bare`. Resolves to a same-named `NodeDef` (or a DataDef via dotted
    access). *[04 bare-reference, bare-reference-adjacent-prose]*
  - **Named body (block)** — `@name … name@` on its own lines — block use;
    body is `Block[]`. *[04 block-name-body, empty-body]*
  - **Named body (inline)** — `@name … name@` mid-paragraph — `inline:
    true`; body is `Inline[]`. *[04 inline-name-body]*
  - **Dotted data access** — `@name.field.sub` — `access: [...]`; binds a
    DataDef, not a NodeDef. Unresolved → `<span class="wit-unresolved">`.
    *[04 dotted-access; 11 field-access, deep-chain, index-access]*
  - **Parens** — `@name(k v, k2 v2)` or `@name(k: v)` — `paramsSource:
    parens`, `closeStyle: parens`, self-closing. Multi-word colon values
    must be quoted (`(k: "a b")`). *[05 single-named-param, multiple-params,
    colon-separator, self-closing, multi-line-call, trailing-comma,
    empty-parens, named-and-flag, mixed-params, inner-whitespace,
    hyphen-multi-word-key, parens-then-body]*
  - **Pipes** — `@name |k v| |k2 v2| … name@` — `paramsSource: pipes`.
    Last-one-wins on duplicate keys. Greedy-bind hazard when no `name@` on
    the same line (see Gotchas). *[06 basic-named, multiple-pipes-per-line,
    multi-word-value, multi-line-value, last-one-wins, bare-positional,
    empty-pipe, mid-body-scatter, pipe-in-body-text]*
  - **Record-arg** — `@name { k - v, k2 - v2 }` (inline or multi-line;
    hyphen **or** colon delimiter accepted at call sites) — `paramsSource:
    record`, self-closing. *[22 inline-single-field, inline-multi-field,
    multi-line-record, template-expansion, template-implicit-captures]*
  - **Form-fill body** — `@name` then `key: value` lines — `paramsSource:
    form-fill`. Needs **≥2** content lines or it is prose (see Gotchas).
    *[23 template-invocation, block-record-def, value-multi-line,
    value-multi-paragraph, with-comments, with-emphasis-in-value,
    with-quoted-string, value-block-*]*
  - **Colon-scatter** — `@name k:v k2:v2 name@` single-line body — surfaces
    as `paramsSource: pipes`; `k: v` (space after colon) is prose.
    *[24 body-scatter-single, -multi, -override, -quoted, -escape,
    -space-after-colon-is-prose, false-positive-prose, and the -node-value
    family]*
  - **Flag param** — trailing `!` in a pipe (`|urgent!|`) or a bare flag —
    valueless flag param. *[06 flag-with-bang; 05 named-and-flag;
    26 showcase form 12]*
  - **Opaque pass-through** — `@node(type X …)` — universal container;
    dispatches to core vocab if `type` is one, else `<div data-*>` carrying
    every named param. *[20 bare-node-passthrough, node-with-body,
    user-defined-wrapper]*
  - **Raw literal** — `@@name … name@@` — `raw: true`; body is one verbatim
    Text node, still gets `{{path}}` interpolation. `@@style`/`@@script`
    emit body unescaped. *[literal-nodes commit; render.ts
    RAW_TEXT_ELEMENTS]*
  - **Frozen literal** — `@@@name … name@@@` — `raw + frozen: true`;
    `{{…}}` is **not** applied — everything passes through. *[ast.ts
    `frozen`]*

- **Enumeration — Definition forms** (AST `nodeDef.shape` / `dataDef`):
  - **Single-line def** — `#name: value` — `shape: single-line`. *[07
    single-line-def]*
  - **Value-block def** — `#name: … !!` — `shape: value-block`; multi-line
    named content, closed by `!!`. *[07 multi-line-value; 23 value-block-*]*
  - **Block def** — `#name … name#` — `shape: block`; uses `...` (body
    slot) to place the invocation body. *[07 block-definition,
    body-slot, body-slot-only]*
  - **Capture list** — `#name ||a, b||` (block) declares captured params
    `::a:: ::b::`. Single-line def + captures is a **known trap** (renders
    the literal capture list — use block form). *[07 multi-capture-list,
    captures-and-interpolation, captures-body-slot-interpolation,
    single-line-def-with-captures; 21 optional-captures inference]*
  - **Additive partial** — `+#name:` / `+#name … name#` — contributes to a
    merged def across the file/project. *[08 simple-additive-prefix,
    block-additive, single-line-additive, multiple-additive-same-file,
    additive-with-captures, order-preservation, mix-normal-and-additive,
    mixed-body-shape]*
  - **Data def (record)** — `#name: { k - v, … }` — hyphen delimiter
    **required** in data-defs (colon is call-site-only). *[09 all]*
  - **Data def (collection)** — `#name: [ a, b, … ]`. *[10 all]*
  - **Data def (scalar)** — `#name: 42` / `true` / `null` / prose —
    shape-classified scalar. *[09 scalar-types; 10 mixed-types]*

- **Enumeration — Other constructs:**
  - **Emphasis** — `*bold*` → `<strong>`, `_italic_` → `<em>` (AST `bold` /
    `italic`; marks wrap a token). *[02 emphasis]*
  - **Interpolation `::name::`** — AST `interpolation`; substitutes a
    captured param. Unresolved → `<span class="wit-unresolved">::name::
    </span>`. *[07 captures-and-interpolation; 25 all]*
  - **Raw-body interpolation `{{path}}`** — expand-time hole, only inside
    `@@` raw bodies; supports dotted access (`{{theme.accent}}`); disabled
    by frozen `@@@`. *[expander; literal-nodes commit]*
  - **Body slot `...`** — AST `bodySlot`; where an invocation's body lands
    inside a block def. *[07 body-slot]*
  - **Comment** — line `~ …` and inline form (`inline` flag). Omitted from
    output unless `WIT_DEBUG_COMMENTS=1`. *[03 comments]*
  - **Reference directive** — `reference "path"` — pulls defs from another
    file (top of file). *[14 composition; 15 references]*
  - **Conditional** — `(if @path)` existence, `(if @path is X)` /
    `(… equals …)` comparison, `(else)`, `(end)`. *[12 all]*
  - **Iteration** — `(each @collection as item) … (end)`. *[13 all]*
  - **Scripts** — `<% … %>` block, `<% fn(a, b) %>` call, `lh` bridge
    (`lh.data`, `lh.set`). Omitted from render; effects run at expand.
    *[15 scripting]*
  - **Escapes** — `\` before a special char emits it literally. *[00
    lexical]*
  - **External data** — `@load <alias> load@` (+ `|as name|`, `|from …|`,
    other pipes → captures/args). *[data-loader; examples/load-demo]*

- **Example strategy:** Seed the playground from
  `tests/integration/feature-tour.wit` (widest span of kinds; coverage in
  `feature-tour.tour.txt`). The canonical "same template, every call form"
  proof is `tests/fixtures/26-all-param-forms/showcase.wit` — **13 forms**,
  documented in `26-all-param-forms/_notes.md`. Note form #13 (self-closing
  pipes) is placed **last on purpose**: pipes with no same-line close
  greedily bind to the next `name@`, so this is an intentional ordering
  constraint, not a parser tightening.
- **Sources:** `packages/parser/src/ast.ts`
  (`NodeUse.paramsSource`/`closeStyle`, `NodeDef.shape`),
  `packages/parser/src/{parser,lexer}*.ts`,
  `packages/cli/src/cmd-tour.ts` (`ALL_AST_KINDS`), fixtures
  `00,02,03,04,05,06,07,08,09,10,11,12,13,14,15,20,21,22,23,24,25,26`.

---

## 2. Core vocabulary — `/docs/reference/core-vocabulary`

- **Purpose:** The exhaustive catalogue of the **52** reserved node names
  (need no `#def`) plus the `@node` opaque container and the two
  special-cased renderers (`@table`, `@bibliography`). **Structure:** one
  section per group (matching the source's grouping comments), and **a rich
  entry PER NODE** — not one list — each following the entry template
  (syntax · params · emits · context · ≥2 examples · notes · related errors
  · fixture).

- **Two cross-cutting rules — state in the preamble** (from
  `render-core-vocab.ts`):
  1. **Attribute allowlist.** Generic core elements accept only `id` +
     `class` (`coreAttrs`); other params are ignored. The typed renderers
     (`a`, `img`, `figure`, `audio`, `video`, `row`, `col`, `table`) accept
     their own specific params instead (below).
  2. **Inline-context unwrap** (`flattenIfInline`). These tags strip a
     single leading `<p>…</p>` from their body so `@h1 Title h1@` →
     `<h1>Title</h1>` not `<h1><p>Title</p></h1>`. The set (verified,
     `INLINE_CONTEXT_TAGS`): **`h1 h2 h3 h4 h5 h6 em strong code u s sub sup
     mark small a figcaption caption th td li dt dd cite`**. Everything else
     keeps its block body verbatim.
  Also state the **unresolved fallbacks**: a `@name` binding nothing →
  `<span class="wit-unresolved">@name</span>`; a dotted `@a.b` →
  `<span class="wit-unresolved">@a.b</span>`; a stray `::name::` →
  `<span class="wit-unresolved">::name::</span>`.

### 2a. Headings (6) — `h1 h2 h3 h4 h5 h6`
- **Syntax:** `@h2 Title h2@` (block) or inline. **Params:** `id`, `class`
  only. **Emits:** `<h1>…</h1>` … `<h6>…</h6>`. **Context:** inline-context
  (leading `<p>` unwrapped). **Examples:** `@h1 Title h1@` → `<h1>Title
  </h1>`; `@h2(id sec) A h2@` → `<h2 id="sec">A</h2>`. **Notes:** any
  heading level is legal regardless of nesting; the theme styles h1–h6.
  **Errors:** none (missing close → `E_UNCLOSED_NODE`). **Fixture:**
  `18-core-vocab/headings.wit`.

### 2b. Inline marks (10) — `em strong code u s sub sup mark small br`
- One entry each. All **inline-context**; **`id`/`class`** only; all wrap
  their body in the same-named tag **except `br`** (void, no body →
  `<br>`).
  - `em` → `<em>` · `strong` → `<strong>` · `code` → `<code>` · `u` →
    `<u>` · `s` → `<s>` · `sub` → `<sub>` · `sup` → `<sup>` · `mark` →
    `<mark>` · `small` → `<small>` · `br` → `<br>` (self-closing, ignores
    any body/params).
- **Notes:** `@em`/`@strong` are the *explicit* form of `_…_` / `*…*`
  emphasis — identical HTML, useful when the token-wrap rule of the marks
  gets in the way. `@code` escapes its body (it is **not** a raw node — use
  `@@pre`/`@@code` verbatim only via `@@`). **Examples per node:** input →
  `<tag>…</tag>`; edge = `@code x < y code@` → `<code>x &lt; y</code>`.
  **Fixture:** `18-core-vocab/inline-marks.wit`.

### 2c. Lists (6) — `ul ol li dl dt dd`
- `ul` → `<ul>` (block) · `ol` → `<ol>` (block) · `li` → `<li>`
  (inline-context) · `dl` → `<dl>` (block) · `dt` → `<dt>`
  (inline-context) · `dd` → `<dd>` (inline-context). **Params:** `id`/
  `class`. **Notes:** these are hand-authored lists; for data-driven lists
  prefer a `#collection` + `(each)` (see Data model). A standalone
  `#items: [ … ]` used bare renders as `<ul class="wit-collection">`, which
  is a *different* path from `@ul`. **Examples:** `@ul @li A li@ @li B li@
  ul@`; a `<dl>` term/description pair. **Fixture:**
  `18-core-vocab/lists.wit`.

### 2d. Links + media (6) — `a img figure figcaption audio video`
Typed renderers — each has its own param set (NOT the id/class allowlist):

- **`a`** — `@a |href …| |target …| text a@`.
  **Params:** `href` (default `#`), `target` (optional). **Emits:**
  `<a href="…"[ target="…"]>…</a>`. **Context:** inline-context.
  **Examples:** `@a |href /x| Go a@` → `<a href="/x">Go</a>`; with
  `|target _blank|` → adds `target="_blank"`. **Notes:** only `href` +
  `target` survive; `id`/`class` are **not** emitted for anchors.
  **Fixture:** `18-core-vocab/links-and-media.wit`.
- **`img`** — void. **Params:** `src` (default `''`), `alt` (default `''`),
  `width`, `height` (raw attrs), `size`, `align` (compile to inline
  `style`). **Emits:** `<img src="…" alt="…"[ width][ height][ style]>`.
  **`size`** (`resolveSize`): `full` / percent → **fill** (`width:100%` /
  `width:N%`); presets `small=220px`/`medium=380px`/`large=600px`, bare
  number, or `Npx` → **cap** (`max-width:…`, plus `height:auto`; never
  upscales). **`align`** on an image: `center` → `display:block;
  margin-left:auto;margin-right:auto`; `right` → block + `margin-left:auto`;
  `left` → block + `margin-right:auto`. **Verified example:**
  `@img |src p.jpg| |alt A| |size medium| |align center|` →
  `<img src="p.jpg" alt="A" style="max-width:380px;height:auto;display:block;margin-left:auto;margin-right:auto">`.
  **Notes:** `src`/`alt`/`width`/`height` are escaped; unknown params
  ignored. **Fixture:** `18-core-vocab/links-and-media.wit` (basic) + built
  snippet for size/align.
- **`figure`** — block. **Params:** `size`, `align` (via `layoutStyle`).
  `align` on a figure sets **`text-align`** on its *contents* (image +
  caption together): `center`/`left`/`right`. A capped `size` (preset/px)
  centres the figure **box** (`margin-left/right:auto`). **Emits:**
  `<figure[ style]>…body…</figure>`. **Verified quirk:** a block
  `@figcaption` inside `@figure` is wrapped in a `<p>`:
  `@figure |align center| @img …@ @figcaption Cap figcaption@ figure@` →
  `<figure style="text-align:center"><img …><p><figcaption>Cap</figcaption></p></figure>`.
  Document this `<p>`-wrap as a known cosmetic quirk (cross-link
  Limitations). **Fixture:** `18-core-vocab/links-and-media.wit` +
  built snippet.
- **`figcaption`** — inline-context. **Params:** `id`/`class`. **Emits:**
  `<figcaption>…</figcaption>`.
- **`audio` / `video`** — block. **Params:** `src` (optional), `controls`
  (flag → adds `controls`). **Emits:** `<audio[ src][ controls]>…</audio>`
  / `<video …>`. **Notes:** body renders inside (fallback text / `<source>`
  authoring). **Fixture:** `18-core-vocab/links-and-media.wit`.

### 2e. Tables (8) — `table thead tbody tfoot tr th td caption`
- **`table`** → dispatched to the **complex renderer** (`render-table.ts`);
  see the Tables page for its three forms + `@ref` + header/caption params.
  The `render-core-vocab.ts` branch for `table` is only a fallback.
- **`thead tbody tfoot tr`** → same-named elements (block). **Params:**
  `id`/`class`. **`th td caption`** → same-named (inline-context).
  **Notes:** these hand-authored table parts exist for manual tables; most
  authors use `@table |rows …|` instead. **Examples:** a manual
  `@table @tr @th A th@ tr@ table@` (fallback path) vs the `|rows|` form.
  **Fixture:** `18-core-vocab` (fallback) + `19-tables/*`.

### 2f. Blocks (4) — `p blockquote pre hr`
- `p` → `<p>` · `blockquote` → `<blockquote>` · `pre` → `<pre>` (all block,
  `id`/`class`) · `hr` → `<hr>` (void, no body/params). **Notes:** `@pre`
  escapes its body (verbatim whitespace preserved by the theme); for
  unescaped raw text use `@@pre`. **Examples:** `@blockquote A quote
  blockquote@` → `<blockquote><p>A quote</p></blockquote>`; `@hr` → `<hr>`.
  **Fixture:** `18-core-vocab/blocks.wit`.

### 2g. Sectioning (7) — `section article aside header footer nav main`
- Each → its same-named HTML element (block; `id`/`class`). **Notes:** pure
  semantic containers; the theme applies no special styling beyond block
  flow. Use them to structure long documents and as targets for `@@style`.
  **Examples:** `@section … section@` → `<section>…</section>`; `@nav(class
  toc) … nav@` → `<nav class="toc">…</nav>`. **Gotcha to cross-link:** a
  leading `~comment` as the first child of a container body collapses
  following blocks into one `<p>` (see Gotchas). **Fixture:**
  `18-core-vocab/sectioning.wit`.

### 2h. Generic containers (2) — `div span`
- `div` → `<div>` (block) · `span` → `<span>` (inline). **Params:** `id`/
  `class`. These are the building blocks for author-defined layout
  (`@div(class card) … div@`, inline `@span`). **Examples:** `@div(class
  card) Body div@` → `<div class="card"><p>Body</p></div>`; inline `@span x
  span@` → `<span>x</span>`. **Fixture:** none in 18 (cross-cutting) — seed
  from a built snippet.

### 2i. Layout (2) — `row col`
- **`row`** → invisible flex band. **Emits (fixed style):**
  `<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin:1.2em 0">…</div>`.
  No params honoured beyond the body. **`col`** → a flex child.
  **Param:** `size` — a width. `resolveColumnBasis`: preset
  `small=220px`/`medium=380px`/`large=600px`, bare number → `Npx`, `Npx`,
  or a percent → `flex:0 0 <basis>;min-width:0`; **no `size`** → `flex:1 1
  0;min-width:0` (fills). **Verified example:** `@row @col |size 220| Left
  col@ @col Right col@ row@` →
  `<div style="display:flex;…"><div style="flex:0 0 220px;min-width:0"><p>Left</p></div><div style="flex:1 1 0;min-width:0"><p>Right</p></div></div>`.
  **Notes:** columns wrap (stack) when the row is too narrow; no floats.
  Put an image in one `@col` and prose in another for side-by-side.
  **Fixture:** none in 18 — seed from a built snippet.

### 2j. Other (1) — `cite`
- `cite` → `<cite>` (inline-context; `id`/`class`). **Example:** `@cite The
  Book cite@` → `<cite>The Book</cite>`. **Fixture:** none in 18 — built
  snippet.

### 2k. Cross-cutting entries (document alongside the 52)
- **`@node` opaque dispatch** — `@node(type X …)`: if `X` is core vocab,
  render as that element; else emit `<div data-<param>="…">` carrying
  **every** named param as `data-*` (`attrName` sanitises the key).
  **Examples:** `@node(type h2) T node@` → `<h2>T</h2>`; `@node(type box
  role note) Hi node@` → `<div data-type="box" data-role="note"><p>Hi</p>
  </div>`. **Fixture:** `20-opaque-node/*`.
- **`@bibliography`** — special renderer (**not** core vocab; no HTML
  element). Emits each contributed entry as its own `<p>` inside
  `<div class="wit-bibliography">`, stripping a single wrapping `<p>` per
  entry so APA runs don't collide. **Fixture:** `23-form-fill/bibliography-style.wit`.
- **Standalone record/collection** — a bare `#rec` / `#list` used as a node
  renders as `<table class="wit-record">` / `<ul class="wit-collection">`
  (cross-link Data model). **Raw-text elements** — `@@style … style@@` and
  `@@script … script@@` emit body **verbatim** (unescaped; guarded against a
  nested closing tag). Other `@@` nodes escape their Text body.

- **Example strategy:** One live example per node, seeded from
  `tests/fixtures/18-core-vocab/*.wit` where present (`headings`,
  `inline-marks`, `lists`, `links-and-media`, `blocks`, `sectioning`), each
  with a checked `.json` snapshot. Nodes absent from fixture 18 (`div`,
  `span`, `row`, `col`, `cite`, img `size`/`align`) seed from the verified
  built snippets above.
- **Sources:** `packages/runtime/src/core-vocab.ts`,
  `packages/render-html/src/render-core-vocab.ts`,
  `packages/render-html/src/render-table.ts`,
  `packages/render-html/src/render.ts` (bibliography, unresolved, raw-text,
  standalone record/collection), `packages/render-html/src/theme.ts`,
  fixtures `18-core-vocab/*`, `20-opaque-node/*`.

---

## 3. Tables reference — `/docs/reference/tables`

- **Purpose:** Everything `@table` accepts — the three authoring forms, the
  `@ref` shortcut, the header/caption controls, and the HTML each emits.
  **Structure:** a "which form do I want?" decision list, then one section
  per form (input `.wit` → output `<table>`), then a params sub-table.

- **Authoring forms** (from `render-table.ts`):
  - **Inline CSV** — `|rows [[Header,…],[Row1,…],…]|` — row 0 is the header
    by default. *[19 inline-csv]*
  - **Schema-as-array (positional)** — `|schema [k1, k2]| |rows [ {…}, …]|`
    — schema keys pick record fields in order; every row is data (no header
    consumed). *[19 schema-array]*
  - **Schema-as-record (labelled)** — `|schema { key - Label, … }| |rows
    […]|` — `key` selects the field, `Label` is the column heading. *[19
    schema-record]*
  - **Rows-by-ref (auto columns)** — `|rows @sales|` where `@sales` is a
    collection of records → columns auto-derived from the **first record's
    keys** (`deriveSchemaFromRecords`). **Verified:**
    `#sales: [ { region - West, total - 100 }, { region - East, total - 90 } ]`
    + `@table |rows @sales| table@` →
    `<table><thead><tr><th>region</th><th>total</th></tr></thead><tbody><tr><td>West</td><td>100</td></tr><tr><td>East</td><td>90</td></tr></tbody></table>`.
    The renderer prefers `param.typedValue.kind === 'collection'` (set by
    the expander) over literal text. *[render-table.ts; examples/load-demo]*

- **Header + caption controls** (`pickHeader` / `pickHeaderOverride`):
  - `|caption …|` → `<caption>…</caption>` (first child of `<table>`).
  - `|header false|` → no header row.
  - `|header N|` → use row index `N` as the header (consumes rows `0..N`).
  - `|header [a, b, c]|` → explicit header cells.
  - Default (no schema, no override): row 0 of `rows` is the header.
  *[19 no-header]*

- **Edge cases / value rules:**
  - Empty / missing `rows` → `<table></table>`. *[19 empty]*
  - Multi-line cell content. *[19 multiline-cell]*
  - Value coercion (`asStringValue`): number/boolean → `String(…)`,
    `nullValue` → empty cell.
  - **Raw table can't resolve `@ref`.** A `@@table` (raw) body is a
    verbatim Text node — resolve/expand never run on it — so `|rows @sales|`
    stays literal and there is no typed collection to derive columns from.
    Use the ordinary `@table`. (Cross-link Limitations.)
  - **Delimited-source limitation:** the CSV/TSV `--sources` path has
    **no quoted-field handling** (`data-sources.ts parseDelimited`); inline
    `|rows [...]|` uses the real collection parser and is unaffected.
  - **Centering is theme, not renderer:** `.wit-doc table { border-collapse:
    collapse; margin: 1em auto; }` (`theme.ts`) centres tables in the
    default pathway; `--raw` does not.

- **Example strategy:** Seed each form from its `19-tables/*.wit` sibling
  (`inline-csv`, `schema-array`, `schema-record`, `no-header`, `empty`,
  `multiline-cell`); seed rows-by-ref from `examples/load-demo` (source →
  records → table).
- **Sources:** `packages/render-html/src/render-table.ts`,
  `packages/cli/src/data-sources.ts`, `packages/render-html/src/theme.ts`,
  `tests/fixtures/19-tables/*`.

---

## 4. CLI reference — `/docs/reference/cli`

- **Purpose:** The complete command-line contract — five subcommands, every
  flag, exit codes, diagnostics, env vars. **Structure:** a synopsis block
  (the real `HELP_TEXT`), then one section per command with a flag table
  (*flag → argument → meaning → default*), then shared sections.

- **Global** (`bin.ts`): `wit --help`/`-h` → usage, exit 0 · `wit
  --version`/`-v` → version, exit 0 · **`VERSION = '0.1.0'`** (⚠ drifts from
  the `v0.2.0` tag — quote the constant, note the drift) · unknown command
  → `HELP_TEXT` on stderr, **exit 2**. The `HELP_TEXT` synopsis to paste
  verbatim:
  ```
  wit parse <file>
  wit check <file>
  wit fmt <file> [-w|--write]
  wit build <file> [-o out.html|out.md|out.pdf] [--format html|md|pdf] [--raw | --fragment]
                    [--sources wit.sources.json --allow-exec] [--env .env]
  wit tour <file>
  wit --version | --help
  ```

- **`wit parse <file>`** (`cmd-parse.ts`) — parse → print AST as pretty
  JSON. **No flags.** Parse error → `file:line:col: E_…`, exit 1; missing
  arg → exit 2.

- **`wit check <file>`** (`cmd-check.ts`) — parse **+ resolve**. Clean →
  `ok: <file>`, exit 0; any stage error → exit 1; missing arg → exit 2.
  **No flags.** (Note: does **not** expand or render — resolve-stage errors
  only.)

- **`wit fmt <file> [-w|--write]`** (`cmd-fmt.ts`) — structural re-indent.
  - `-w`/`--write` — write in place, printing `formatted <file>` or
    `unchanged <file>`; default prints to stdout.
  - Preserves prose exactly; leaves raw `@@` bodies, `<% %>` scripts,
    record/data values, and form-fill bodies verbatim. Parse error →
    nothing written, exit 1; missing arg → exit 2.

- **`wit build <file> [flags]`** (`cmd-build.ts`) — parse → load → resolve →
  expand → render.
  | flag | arg | meaning | default |
  |------|-----|---------|---------|
  | `-o` / `--out` | `<path>` | output file; format inferred from ext | stdout |
  | `--format` | `html\|md\|pdf` | explicit format (overrides inference) | html |
  | `--fragment` | — | bare `<article class="wit-doc">` only | off |
  | `--raw` | — | full document, reset-only CSS (`rawThemeCss`) | off |
  | `--sources` | `<file.json>` | external-data source config | none |
  | `--env` | `<.env>` | dotenv merged into `env` source + child env | none |
  | `--allow-exec` | — | permit running configured source programs | off |
  - **Format inference:** `.html`/`.htm`→html, `.md`/`.markdown`→md,
    `.pdf`→pdf; anything else → `E_UNKNOWN_OUTPUT_FORMAT` (a CLI message,
    **not** a `WitError`), exit 1.
  - **`--raw` vs `--fragment`:** mutually meaningful but if both given
    `--fragment` wins (`htmlOptions` returns `undefined` when `fragment` is
    set, before checking `raw`). Document that precedence.
  - **PDF specifics:** requires `-o <file.pdf>` (else "PDF output needs an
    -o <file.pdf> path", exit 1); drives a headless system Chrome/Chromium
    (candidate list in `CHROME_CANDIDATES`, or `WIT_CHROME` override —
    override wins with no fallback); injects `<base href>` (doc directory)
    so relative assets resolve; Chrome flags `--headless=new --disable-gpu
    --no-sandbox --no-pdf-header-footer --print-to-pdf=…`; 60s timeout;
    writes to a temp `.html` then unlinks it. No Chrome → helpful error,
    exit 1. Success → `wrote <path>`.
  - **Arg errors:** `-o`/`--format`/`--sources`/`--env` with no following
    value → usage message, exit 2; unexpected positional after `<file>` →
    exit 2.

- **`wit tour <file> [--report|--no-report]`** (`cmd-tour.ts`) — indented
  AST tree + AST-coverage report.
  - `--report` — force report mode (header + tree + coverage footer) even
    on a non-TTY.
  - `--no-report` — tree only (for piping).
  - Default: report on a TTY; overridable by `WIT_TOUR_REPORT=1` /
    `WIT_TOUR_NO_REPORT=1`. Footer reports `AST kinds seen: X/Y` against
    `ALL_AST_KINDS` (24 kinds), plus `NodeUse paramsSource variants` and
    `NodeDef shapes` seen. Unknown `--flag` → exit 2.

- **Cross-cutting:** **Exit codes** 0/1/2 (as above). **Diagnostics**
  `file:line:col: E_CODE: message`. **Env vars:** `WIT_CHROME` (PDF browser
  override), `WIT_DEBUG_COMMENTS=1` (keep comments in HTML render),
  `WIT_TOUR_REPORT` / `WIT_TOUR_NO_REPORT`.

- **Example strategy:** Static terminal transcripts (CLI is host-side).
  Seed from small `examples/*.wit`: `wit build examples/09-citations.wit
  --fragment`, `wit tour tests/integration/feature-tour.wit` (checked
  output in `feature-tour.tour.txt`), `wit build examples/load-demo/…
  --sources … --allow-exec`.
- **Sources:** `packages/cli/src/{bin,cmd-parse,cmd-check,cmd-fmt,cmd-build,cmd-tour}.ts`,
  `packages/parser/src/format.ts`.

---

## 5. Config reference — `/docs/reference/config`

- **Purpose:** The `wit.sources.json` schema, the built-in `env` source,
  the format catalogue, and the security model (`--allow-exec`).
  **Structure:** an annotated example config, a field-by-field schema
  table, a formats table, an `env` section, a "security & capture-passing"
  section.

- **`wit.sources.json` schema** (`data-sources.ts`):
  ```json
  {
    "sources": {
      "<alias>": {
        "run": ["program", "arg", "{{capture}}"],
        "format": "json",
        "timeoutMs": 30000
      }
    }
  }
  ```
  - `sources` — **required** top-level object (missing/non-object → "expected
    a top-level \"sources\" object"). Invalid JSON / unreadable file → their
    own errors.
  - `sources.<alias>.run` — **required** non-empty argv array (`run[0]` is
    the program; empty/non-array → "source \"run\" must be a non-empty argv
    array"). `{{name}}` tokens in any token are replaced by the matching
    capture value (missing → empty string).
  - `sources.<alias>.format` — one of the seven formats; **default `json`**.
  - `sources.<alias>.timeoutMs` — spawn timeout; **default 30000**. Output
    cap: `maxBuffer` = 16 MB.

- **Formats (7)** (`parseOutput`) — the value that crosses the seam:
  | format | stdout → value |
  |--------|----------------|
  | `json` | `JSON.parse(stdout)` (empty → `null`) |
  | `csv` | array of records (first row = header; **no quoted-field handling**) |
  | `tsv` | same, tab-delimited |
  | `lines` | array of non-empty lines |
  | `text` | raw stdout string |
  | `svg` | raw stdout string |
  | `html` | raw stdout string |

- **Built-in `env` source** — no config needed. `@load env load@` returns
  `process.env` merged with the `--env` dotenv file, as a record; access via
  `@env.HOME` etc. **Verified:** `@load env load@` + `User is @env.USER` →
  `<p>User is …</p>`. Dotenv parser: `KEY=value` lines, `#` comments,
  optional surrounding single/double quotes stripped, blank/`=`-less lines
  skipped.

- **`@load` binding forms** (`data-loader.ts`): alias from body prose
  (`@load results load@`) **or** `|from alias|` pipe; `|as name|` renames
  the resulting DataDef (else the def is named for the alias); every other
  named pipe becomes a capture/arg. `@load` with no resolvable alias →
  `E_LOAD_FAILED` ("@load needs an alias").

- **Security & capture-passing:**
  - Programs run **only** with `--allow-exec`; without it any non-`env`
    `@load` throws ("running programs is disabled; pass --allow-exec to run
    …"). `env` needs no gate.
  - Unknown alias → "no source configured for alias …".
  - The child runs in the **document's directory** (`cwd = dirname of the
    .wit file`), with the merged env; captures reach it **two ways**:
    `{{name}}` substituted into the argv, **and** the full args object as
    **JSON on stdin**.
  - Non-zero exit / spawn error → the message surfaces as **`E_LOAD_FAILED`**
    at the `@load` site.

- **Example strategy:** Seed from `examples/load-demo` (real
  `wit.sources.json` + a program whose stdout feeds a table). Show the `env`
  source with `@load env load@` + `@env.USER`. Pair each format row with a
  stub program's stdout → resulting Wit value.
- **Sources:** `packages/cli/src/data-sources.ts`,
  `packages/runtime/src/data-loader.ts` (`DataLoadRequest`, `toDataValue`,
  binding forms), `examples/load-demo/*`.

---

## 6. Data model / value types — `/docs/reference/data-model`

- **Purpose:** The value system that data-defs, records, collections,
  captures, and `@load` share — the six `DataValue` kinds, JSON mapping, and
  text coercion. **Structure:** a table of the six kinds (*kind → literal
  syntax → JS origin → renders as*), then records, collections, access
  paths, conditions, and the `typedValue` shape-probe.

- **`DataValue` kinds (6)** (`ast.ts`):
  | kind | literal | payload | standalone render |
  |------|---------|---------|-------------------|
  | `stringValue` | prose / `"…"` | `{ value: string }` | escaped text |
  | `numberValue` | `42`, `3.14` | `{ value: number }` | `String(value)` |
  | `booleanValue` | `true`/`false` | `{ value: boolean }` | `String(value)` |
  | `nullValue` | `null` | (none) | empty |
  | `record` | `{ k - v, … }` | `{ fields: {key,value}[] }` | `<table class="wit-record">` |
  | `collection` | `[ a, b, … ]` | `{ items: DataValue[] }` | `<ul class="wit-collection">` |

- **Supporting shapes:**
  - **`Param.typedValue`** — a shape-probed `DataValue` populated when a
    captured param *looks like* a collection (`[…]`), record (`{…}`), or
    scalar literal; pure prose keeps only `value`. This is what lets
    `|rows @ref|` and typed captures work (`render-table.ts` reads it).
  - **`AccessPath`** — dotted `segments: string[]` (`@a.b.c`); index into a
    collection by number (`@list.0`). Access supports **fuzzy key matching**
    (camel/snake/spaces) — *[11 fuzzy-match-camel, -snake, -spaces]*.
  - **Conditions** — `ExistenceCondition { path }`; `ComparisonCondition
    { left, op: 'is' | 'equals', right: DataValue }`.
  - **JSON → Wit mapping** (`toDataValue`): object→record,
    array→collection, string/number/boolean→scalar,
    `null`/`undefined`→`nullValue`. Only shape that crosses the `@load`
    seam.
  - **Text coercion** (`asStringValue`, tables/render): number/boolean →
    `String(…)`, `nullValue` → `''`.

- **Example strategy:** Seed scalars/records/collections from `09-records/*`,
  `10-collections/*`; access from `11-data-access/*`; missing-field from
  `11-data-access/missing-field.wit`. Show JSON→Wit with a
  `@load`-then-access snippet from `examples/load-demo`.
- **Sources:** `packages/parser/src/ast.ts` (`DataValue`, `Param`,
  `AccessPath`, `Condition`), `packages/runtime/src/data-loader.ts`
  (`toDataValue`), `packages/render-html/src/{render,render-table}.ts`
  (`asStringValue`), fixtures `09,10,11,12`.

---

## 7. Error codes — `/docs/reference/errors`

- **Purpose:** The complete diagnostic catalogue — all **26** stable codes
  (12 parser + 14 runtime) + the non-coded `E_UNKNOWN_OUTPUT_FORMAT`, each
  with cause, minimal repro, and fix, so a reader can paste a code and land
  here. **Structure:** two tables (Parser / Runtime), each row *code · thrown
  by · cause · fix · repro fixture*, anchored by code. Preamble: the
  `file:line:col: E_CODE: message` format and the class hierarchy
  (`WitError`; `RuntimeError` → `ResolverError` / `ExpanderError`).

- **Parser — `ErrorCode` / `WitError` (12)** (`packages/parser/src/errors.ts`):
  1. `E_UNCLOSED_NODE` — `@x` opener with no matching close. *Repro:* `@x`
     alone. *Fix:* add `x@` or a self-closing form.
  2. `E_UNCLOSED_COMMENT` — block comment never terminated.
  3. `E_UNCLOSED_DEFINITION` — `#x` def with no `x#` / `!!` close.
  4. `E_UNCLOSED_PAREN` — `@x(` never closed.
  5. `E_MISMATCHED_CLOSE` — close name ≠ open name (`@x … y@`).
  6. `E_MALFORMED_RECORD` — bad `{ … }` record (e.g. colon delimiter in a
     data-def; use `-`).
  7. `E_UNCLOSED_COLLECTION` — `[ …` never closed.
  8. `E_UNCLOSED_SCRIPT` — `<% …` with no `%>`.
  9. `E_UNCLOSED_RAW_NODE` — `@@x …` with no `x@@`.
  10. `E_MIXED_PARAM_SOURCE` — opened one param form, added another. *Fix:*
      the form you open with is the form that closes the call.
  11. `E_MALFORMED_FORM_FIELD` — malformed form-fill `key:` field.
  12. `E_UNTERMINATED_STRING` — quoted string not closed.

- **Runtime — `RuntimeErrorCode` (14)** (`packages/runtime/src/errors.ts`):
  1. `E_UNRESOLVED_REFERENCE` — `@x` binds to no def (resolver, first miss).
  2. `E_CIRCULAR_REFERENCE` — reference/def cycle.
  3. `E_MISSING_REFERENCE_FILE` — a `reference` path doesn't exist (unless
     `onMissingReference` intercepts).
  4. `E_MISSING_FIELD` — dotted access to an absent field.
  5. `E_PARTIAL_SHAPE_MISMATCH` — additive partial's shape conflicts with
     the base.
  6. `E_TYPE_MISMATCH` — value-type mismatch (comparison / use).
  7. `E_DUPLICATE_DEFINITION` — two non-additive defs share a name.
  8. `E_EXPANSION_DEPTH_LIMIT` — expansion recursion cap hit.
  9. `E_NOT_ITERABLE` — `(each …)` over a non-collection.
  10. `E_AMBIGUOUS_RECORD_KEY` — a record key resolves ambiguously (fuzzy
      match tie).
  11. `E_SCRIPT_ERROR` — a `<% %>` script threw.
  12. `E_MISSING_RECORD_FIELD` — record-arg omits a required capture.
  13. `E_EXTRA_RECORD_FIELD` — record-arg supplies an unexpected field.
  14. `E_LOAD_FAILED` — `@load` failed: no source configured, exec disabled,
      empty alias, or the program errored (`data-loader.ts`).

- **Non-coded:** `E_UNKNOWN_OUTPUT_FORMAT` — a `wit build` message (not a
  `WitError`) when the `-o` extension is unrecognised and no `--format` is
  given.

- **Example strategy:** Each row links a minimal reproducing `.wit`
  (buildable in the playground) + the exact diagnostic line. Mine the
  `*.test.ts` files (assert on `.code`) for guaranteed-triggering snippets.
  The greedy-bind `E_UNCLOSED_NODE` repro (a pipes form before a later block
  use of the same node) is verified.
- **Sources:** `packages/parser/src/errors.ts`,
  `packages/runtime/src/errors.ts`, throw sites in
  `packages/runtime/src/{resolver,resolver-files,resolver-partials,expander,
  expander-inline,expander-iteration,canonical-key,data-loader}.ts`,
  `packages/cli/src/cmd-build.ts` (`E_UNKNOWN_OUTPUT_FORMAT`).

---

## 8. API reference — `/docs/reference/api`

- **Purpose:** The exact public surface of each package for embedders —
  every exported symbol with its signature. **Structure:** one section per
  package (functions table *signature → returns → notes* + a types list).
  State that only `index.ts` re-exports are public; everything else is
  package-private.

- **`@witlang/parser`** (`packages/parser/src/index.ts`):
  - `parse(source: string, file?: string): Document`
  - `parseInlineFromText(...)` — inline sub-parser (expander re-parses
    captured raw values with it).
  - `tryParseRecordFromText(...)`, `tryParseCollectionFromText(...)` — late
    data scanners.
  - `format(source: string, opts?: FormatOptions): string`; `FormatOptions
    { indent: string }` (default `'  '`).
  - `WitError` (class: `code`, `loc`, `message`).
  - Types: `Document, Block, Inline, AstNode, Paragraph, Comment, NodeUse,
    NodeDef, DataDef, Record, Collection, IfStatement, EachStatement,
    ScriptBlock, ScriptCall, ReferenceDirective, Text, Italic, Bold,
    Interpolation, BodySlot, DataValue, StringValue, NumberValue,
    BooleanValue, NullValue, Condition, ExistenceCondition,
    ComparisonCondition, Param, AccessPath, Loc, HasLoc`.

- **`@witlang/runtime`** (`packages/runtime/src/index.ts`):
  - `resolve(doc: Document, options?: ResolveOptions): ResolvedDocument`;
    `ResolveOptions { rootPath?, fileReader?, onMissingReference? }`.
  - `expand(resolved: ResolvedDocument): ExpandedDocument`.
  - `loadExternalData(doc: Document, source: DataSource): Document` — the
    `@load` pass. `DataSource = DataLoader | Record<string, unknown>` (a
    plain dict is the simplest embedded source).
  - `toDataValue(value: unknown, loc: Loc): DataValue`.
  - `RuntimeError`, `ResolverError`, `ExpanderError`, `RuntimeErrorCode`.
  - `CORE_VOCAB_NAMES`, `RESERVED_OPAQUE`, `isCoreVocabName(name)`,
    `isReservedNodeName(name)`.
  - Types: `DataLoader, DataLoadRequest, DataSource, ResolvedDocument,
    ExpandedDocument, ResolveOptions, FileReader, RuntimeErrorCodeName`.
  - **Doc-drift to flag:** the header comment says "the 47 reserved node
    names" — the actual list is 52.

- **`@witlang/render-html`** (`packages/render-html/src/index.ts`):
  - `renderHtml(doc: ExpandedDocument, options?: RenderHtmlOptions): string`;
    `RenderHtmlOptions { mode?: 'fragment'|'document' (default 'fragment'),
    title? (default 'Wit document'), lang? (default 'en'), css? (default
    defaultThemeCss; '' = unstyled) }`.
  - `escapeHtml(s: string): string`.
  - `defaultThemeCss`, `rawThemeCss` — string constants.

- **`@witlang/render-markdown`** (`packages/render-markdown/src/index.ts`):
  - `renderMarkdown(doc: ExpandedDocument): string` — the **only** export.

- **`@witlang/cli`** — **no public library API** (no `src/index.ts`; ships
  `dist/bin.js`). `runCli(argv, io)` / `HELP_TEXT` / `VERSION` in `bin.ts`
  are internal; point embedders at parser/runtime/render packages.

- **Example strategy:** One end-to-end embed snippet — `parse →
  loadExternalData → resolve → expand → renderHtml` — mirroring
  `examples/load-demo`'s README and `packages/skill/skill/reference/06`;
  show the dictionary `DataSource` form (`{ alias: value }`) as the simplest
  case.
- **Sources:** the four `src/index.ts` files above; signatures in
  `packages/{parser/src/parser,parser/src/format,runtime/src/resolver,
  runtime/src/expander,render-html/src/render,render-markdown/src/render}.ts`.

---

## 9. Gotchas & anti-patterns — `/docs/reference/gotchas`

- **Purpose:** The traps that produce confusing errors or silently
  mis-parse, plus the do/avoid checklist — each re-verified against current
  code. **Structure:** "Parser gotchas" (repro + fix) and "Anti-patterns"
  (do/avoid by topic). Flag CLI-vs-LSP divergences.

- **Parser gotchas:**
  - **Greedy pipes-bind** — `@x |…|` with no `x@` on the same line binds to
    the NEXT `x@` below. *Verified* — the ordering constraint fixture 26
    documents. *Fix:* self-closing form, same-line `x@`, or order
    self-closing pipes last.
  - **Comment-as-first-child-in-container-body** — a `~comment` as the
    **first** line of a container body (`@section`/`@div`) with content
    right after collapses following block nodes into one paragraph:
    `@section / ~note / @h2 T h2@ / Body / section@` →
    `<section><p><h2>T</h2>Body</p></section>` (h2 wrongly nested in `<p>`).
    *Fix:* blank line after a leading comment, or don't lead a container
    body with one.
  - **Single-line def + `||captures||`** renders the literal capture list.
    *Fix:* block form for any def with captures. *[07
    single-line-def-with-captures]*
  - **Form-fill needs ≥2 content lines** — a single `key: value` line is
    prose. *Fix:* add a field or use record-arg.
  - **Form-fill multi-line value indent** — a `key:` with an empty same-line
    value consumes the block beneath; continuation must be *strictly*
    deeper-indented. *[23 value-indented-key-shape-is-content,
    value-empty-then-next-field]*
  - **`E_MIXED_PARAM_SOURCE`** — don't mix param forms in one call.
  - **Colon-delim records are call-site-only** — data-def records need
    hyphen `-`; the colon form is accepted by the CLI at call sites but
    rejected by the LSP (`E_MALFORMED_RECORD`).
  - **`@dotted.path` inside parens / record values** confuses close
    detection; use pipes or form-fill for `@path` values.
  - **Multi-word colon values in parens** (`@x(k: A B)`) break — quote or
    use space-style.
  - **`@` inside record values** (emails) breaks parsing — keep
    `@`-strings out of record values.

- **Anti-patterns (do/avoid):** content in node bodies not params; lift
  duplicated lists into data + `(each)`; wrap `@node(type X)` in named defs;
  name ideas not numbers for citations; hyphen delim in data-defs; prefer
  `(if)`/`(each)` over `<% %>`; place pipes-form calls last; schema-array
  tables over inline CSV.

- **Example strategy:** Each trap gets a *broken* seed and a *fixed* seed
  side by side (both buildable). Cross-link `16-ambiguity`,
  `24-colon-scatter`, `26-all-param-forms`.
- **Sources:** `packages/skill/skill/reference/07-gotchas.md`,
  `.../17-patterns-and-anti-patterns.md` (verify each before use),
  `packages/render-html/src/render.ts` (paragraph heuristic behind the
  comment bug), `tests/fixtures/{16-ambiguity,24-colon-scatter,26-all-param-forms}/*`.

---

## 10. Known limitations — `/docs/reference/limitations`

- **Purpose:** The honest list of what Wit doesn't do yet, or does with a
  documented rough edge. **Structure:** a table (*limitation → impact →
  workaround → tracking source*), grouped by area.

- **Enumeration:**
  - **Greedy pipes-bind ordering constraint** — self-closing pipes forms
    must come after body-form uses of the same node. *[26-all-param-forms/_notes.md]*
  - **Comment-as-first-child-in-container-body** collapses following blocks
    into a paragraph. *Workaround:* blank line after the comment.
  - **`@figure` wraps a block `@figcaption` in a `<p>`** — verified:
    `<figure …><img …><p><figcaption>…</figcaption></p></figure>`. Cosmetic;
    note it.
  - **Raw `@@table` can't resolve `@ref`** — a raw body is verbatim, so
    `|rows @sales|` never resolves to a typed collection. Use plain
    `@table`.
  - **Single-line def with captures** renders the literal capture list —
    use block form.
  - **Data-def records with colon delimiter** parse inconsistently (CLI
    accepts at call sites, LSP rejects); hyphen is the portable form.
  - **CSV/TSV sources have no quoted-field handling** (`parseDelimited`);
    commas/tabs inside a field break rows. Inline `|rows [...]|` is fine.
  - **Config is JSON-only** — `wit.sources.json`; TOML is a future swap
    (`data-sources.ts` header note).
  - **HTML renderer is configuration-free (v1)** — one fixed HTML shape per
    AST kind; `@table`/`@bibliography` are hard-coded special cases, not
    extensible hooks (`render.ts` header).
  - **PDF requires a system Chrome/Chromium** (or `WIT_CHROME`); no bundled
    engine.
  - **Version drift** — code `VERSION = '0.1.0'` vs a `v0.2.0` tag; the
    `@witlang/runtime` header says "47" core-vocab names when there are 52.
    Metadata drift, not runtime bugs — track on Changelog/Project pages.
  - **LSP is stricter than the CLI** in spots — a file can `wit check` clean
    yet show IDE squiggles.

- **Example strategy:** Link the intentional fixture (26) where one exists;
  otherwise minimal repro + workaround. Keep examples as short as possible.
- **Sources:** `tests/fixtures/26-all-param-forms/_notes.md`,
  `packages/cli/src/data-sources.ts`,
  `packages/render-html/src/{render,render-core-vocab}.ts`,
  `packages/cli/src/cmd-build.ts` (PDF), `packages/cli/src/bin.ts`
  (`VERSION`), `packages/runtime/src/index.ts` (stale "47").

---

## 11. Glossary — `/docs/reference/glossary`

- **Purpose:** A one-stop dictionary of every Wit term, so guide/reference
  prose can link a word to its precise definition. **Structure:** an
  alphabetical (or grouped) term list; each entry: *term — one-sentence
  definition — the syntax it maps to — see-also*. Ground each in its AST
  kind / source symbol.

- **Terms to define (each an entry):**
  - **Node** — a reusable content unit invoked with `@name`; either a *core
    vocab* built-in or an author `#def`.
  - **Node use** — an invocation of a node (AST `nodeUse`); has a
    `paramsSource`, `closeStyle`, optional `body`, and an `inline` flag.
  - **Def / definition** — a named template declared with `#name` (AST
    `nodeDef`); three `shape`s: `single-line`, `value-block`, `block`.
  - **Data def** — a named value declared with `#name: <value>` (AST
    `dataDef`); its `value` is a `DataValue`.
  - **Core vocabulary** — the 52 reserved node names that need no def
    (`CORE_VOCAB_NAMES`) and ship built-in renderers.
  - **Reserved name** — a core-vocab name **or** the opaque `node`
    (`isReservedNodeName`); the resolver skips binding lookup for these.
  - **Opaque node** — `@node(type X …)`, a universal pass-through container:
    dispatches to core vocab if `type` is one, else `<div data-*>`.
  - **Param** — a named or positional argument to a node use (AST `Param`;
    `name: string | null`, `value`, optional `typedValue`).
  - **paramsSource** — how a use's params were written: `parens`, `pipes`,
    `record`, `form-fill`, `none`, or `mixed`.
  - **closeStyle** — how a use terminates: `named` (`name@`), `parens`
    (self-closing `()`), or `bare` (`@name`).
  - **Capture** — a named hole a def declares (`#name ||a, b||`), filled by
    the caller's params, and referenced inside the body with `::a::`.
  - **Interpolation** — `::name::` (AST `interpolation`), the substitution
    point for a capture. Distinct from raw `{{path}}`.
  - **Raw-body interpolation** — `{{path}}`, an expand-time hole valid only
    inside `@@` raw bodies; supports dotted access; frozen `@@@` disables
    it.
  - **Body slot** — `...` (AST `bodySlot`), the placeholder in a *block* def
    where the invocation's body is inserted.
  - **Record** — an ordered key/value map, `{ k - v, … }` (AST `record`);
    hyphen delimiter in data-defs, hyphen-or-colon at call sites.
  - **Collection** — an ordered list, `[ a, b, … ]` (AST `collection`).
  - **DataValue** — the six-kind value union (string/number/boolean/null/
    record/collection) shared by defs, captures, and `@load`.
  - **Reference (directive)** — `reference "path"`, which pulls defs from
    another file into the current one.
  - **Partial / additive partial** — a `+#name` def that *contributes to* a
    merged def across the file/project instead of redefining it.
  - **Raw node** — `@@name … name@@` (`raw: true`): body is one verbatim
    Text node; not re-parsed or interpolated except for `{{…}}`.
  - **Frozen node** — `@@@name … name@@@` (`raw + frozen: true`): even
    `{{…}}` passes through untouched.
  - **Form-fill** — the `@name` + `key: value` lines call form
    (`paramsSource: form-fill`); needs ≥2 content lines.
  - **Colon-scatter** — a single-line `@name k:v k2:v2 name@` body form;
    internally classified `paramsSource: pipes`.
  - **Flag param** — a valueless param, trailing `!` in a pipe (`|urgent!|`)
    or a bare flag.
  - **Inline-context element** — a core element that unwraps a single
    leading `<p>` from its body (`flattenIfInline`).
  - **Void element** — a core element with no body/close (`br`, `hr`,
    `img`).
  - **Access path** — a dotted lookup `@a.b.c` (AST `AccessPath`), including
    numeric collection indexing and fuzzy key matching.
  - **Condition** — the test in `(if …)`: existence (`@path`) or comparison
    (`@path is/equals value`).
  - **Iteration** — `(each @collection as item) … (end)` (AST
    `eachStatement`).
  - **Script** — a `<% … %>` block / `<% fn(a,b) %>` call; effects run at
    expand, output omitted; `lh` is the data bridge.
  - **`@load`** — the external-data directive; rewritten into a DataDef by
    the load pass before resolve.
  - **DataLoader / DataSource** — the host-supplied seam `@load` calls; a
    function or a plain `{ alias: value }` dictionary.
  - **Pipeline stages** — **lex → parse → resolve → expand → render** (the
    `@load` pass sits between parse and resolve).
  - **Fragment / raw / document pathways** — the three HTML output shapes
    (`--fragment` bare article; `--raw` reset-only page; default styled
    document).
  - **Unresolved fallback** — the `<span class="wit-unresolved">` a renderer
    emits for a `@name` / `::name::` that bound to nothing.

- **Sources:** `packages/parser/src/ast.ts`,
  `packages/runtime/src/core-vocab.ts`,
  `packages/render-html/src/render*.ts`, cross-referenced with the Syntax
  and Core-vocabulary pages.

---

## 12. Cheatsheet — `/docs/reference/cheatsheet`

- **Purpose:** A single printable screen an author keeps open — every
  everyday form at a glance, no prose. **Structure:** a compact multi-column
  card (copy-paste snippets), grouped; each snippet is a *verified* one-liner
  lifted from a fixture. Not templated per-entry — density is the point.

- **Card sections + contents:**
  - **Call forms:** `@name` · `@name … name@` · `@name(k v, k2 v2)` ·
    `@name(k: "a b")` · `@name |k v| … name@` · `@name { k - v }` ·
    form-fill (`@name` + `key: value` ×2) · colon-scatter (`@name k:v
    name@`) · `@node(type X …)` · `@@raw … raw@@` · `@@@frozen … frozen@@@`.
  - **Definitions:** `#name: value` · `#name: … !!` · `#name … name#` ·
    `#name ||a, b||` (captures) · `+#name:` (additive) · `#rec: { k - v }` ·
    `#list: [ a, b ]`.
  - **Inside a def:** `::capture::` · `...` (body slot) · `{{path}}` (raw
    only).
  - **Data & access:** `@rec.field` · `@list.0` · scalars `42` / `true` /
    `null`.
  - **Control flow:** `(if @path) … (else) … (end)` · `(if @x is Y)` /
    `(equals)` · `(each @list as item) … (end)`.
  - **Inline:** `*bold*` → `<strong>` · `_italic_` → `<em>` · `@code x
    code@` · `@a |href …| … a@` · escape `\*`.
  - **Media/layout:** `@img |src …| |alt …| |size medium| |align center|` ·
    `@figure … figure@` · `@row @col |size 220| … col@ @col … col@ row@`.
  - **Tables:** `@table |rows [[H,…],[…]]| table@` · `|schema [k1,k2]|` ·
    `|schema { k - Label }|` · `|rows @ref|` · `|caption …|` · `|header
    false|N|[…]|`.
  - **External data:** `@load env load@` → `@env.HOME` · `@load alias |as
    name| |key v| load@`.
  - **Comments:** `~ line comment`.
  - **CLI:** `wit parse` · `wit check` · `wit fmt -w` · `wit build -o
    out.{html,md,pdf}` · `--fragment` · `--raw` · `--sources x.json
    --allow-exec` · `--env .env` · `wit tour`.
  - **Core-vocab quick list:** the 52 names grouped (headings / marks /
    lists / links+media / tables / blocks / sectioning / generic / layout /
    cite) as a scannable strip.

- **Sources:** distilled from the Syntax, Core-vocabulary, Tables, CLI, and
  Config pages; each snippet cross-checked against its fixture.

---

## Coverage checklist (for the Reference author)
- [ ] **Every page** carries the entry template (syntax · every param ·
      ≥2 examples w/ rendered output · notes · related errors · fixture).
- [ ] **Core vocabulary** has a rich entry **per node** for all **52**
      names (6 headings · 10 marks · 6 lists · 6 links/media · 8 tables ·
      4 blocks · 7 sectioning · 2 generic · 2 layout · 1 cite), with emitted
      HTML, honoured params, inline-context/void flag, and a seed each.
- [ ] Cross-cutting core entries present: `@node` dispatch,
      `@bibliography`, standalone record/collection, raw-text
      `@@style`/`@@script`, unresolved fallbacks, the two cross-cutting
      rules (`coreAttrs`, `flattenIfInline`).
- [ ] **Recent features** each documented: `@row`/`@col`; `@img
      |size|`/`|align|` + `@figure` centering **and the `<p>`-wrap quirk**;
      `@table |rows @ref|` auto-columns + the raw-`@@table` limitation;
      `@load` + `wit.sources.json` + `env`; `--raw`/`--fragment` (+
      precedence); `-o pdf`; `wit fmt`/`check`/`parse`/`tour`; `{{path}}`
      raw interpolation; `@@`/`@@@` literal/frozen nodes.
- [ ] **Errors** lists all **26** codes (12 parser + 14 runtime) with cause,
      repro, fix, plus the non-coded `E_UNKNOWN_OUTPUT_FORMAT`.
- [ ] **CLI** covers all 5 commands and every flag (`-o/--out`, `--format`,
      `--fragment`, `--raw`, `--sources`, `--env`, `--allow-exec`, `-w`,
      `--report/--no-report`) + exit codes (0/1/2) + env vars.
- [ ] **Config** has the full `wit.sources.json` schema, all **7** formats,
      the `env` source, the `@load` binding forms, and the `--allow-exec`
      security model (incl. stdin JSON + `{{capture}}` argv).
- [ ] **Data model** covers all **6** `DataValue` kinds, `typedValue`,
      access paths (indexing + fuzzy match), conditions, JSON→Wit mapping,
      text coercion.
- [ ] **API** enumerates every `index.ts` export per package (and states
      `@witlang/cli` has no library API).
- [ ] **Syntax** lists all call forms (12), definition forms (8), and other
      constructs, each cited to its fixture; the 13-form showcase (26) is
      the equivalence proof.
- [ ] **Glossary** defines every term (node, use, def, data def, capture,
      interpolation `::…::` vs `{{…}}`, body slot, record, collection,
      partial/additive, raw/frozen node, opaque node, form-fill,
      colon-scatter, flag param, inline-context, void, access path,
      condition, iteration, script, `@load`, DataLoader, pipeline stages,
      the three pathways, unresolved fallback).
- [ ] **Cheatsheet** fits one screen and cross-checks every snippet to a
      fixture; includes the 52-name quick strip and the full CLI line.
- [ ] Every live example seeds from a fixture where one exists (18, 19, 20,
      22, 23, 24, 26 especially); nodes/features absent from fixtures seed
      from a verified built snippet.
- [ ] Drift flagged (not silently corrected): `VERSION 0.1.0` vs `v0.2.0`;
      the "47" comment vs 52 core-vocab names.
