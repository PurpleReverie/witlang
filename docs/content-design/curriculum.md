# Wit Curriculum — the concept catalog

Every part of Wit, planned along four teaching dimensions:

1. **Convey** — the one idea the reader must walk away with.
2. **How** — the best way to land it (analogy, contrast, progressive reveal).
3. **Examples** — what to show, to demonstrate *how* and *why it matters*.
4. **Technical** — the precise facts/reference the page must include.

Plus **Prereqs** — concepts that must be taught first (this feeds the ordering
analysis in [onboarding-sequence.md](onboarding-sequence.md)).

Grounded in verified behaviour (see [sourcing](../plan/sourcing.md)); the old
`spec.md` is not a source.

---

## Group 1 — The prose foundation

### 1.1 Prose is the default
- **Convey:** you just write; plain text *is* a valid Wit document. Structure is opt-in.
- **How:** show a paragraph of ordinary text that renders unchanged. Contrast with "in HTML you'd already be typing tags." This is the emotional hook — Wit gets out of the way.
- **Examples:** a two-paragraph note, no markup, → clean HTML/PDF. Blank line = new paragraph.
- **Technical:** blank line separates paragraphs; single newline = soft wrap within a paragraph; whitespace/indentation is not significant to prose.
- **Prereqs:** none (the entry point).

### 1.2 Emphasis
- **Convey:** italic and bold, the only two inline marks, with a light touch.
- **How:** show the two marks inline in a sentence; note there are *only* two (restraint is the point).
- **Examples:** `*bold*`, `_italic_`, and combined `*_both_*`.
- **Technical:** `*` = bold, `_` = italic; nesting is asymmetric — `*_x_*` works, `_*x*_` leaves the inner `*` literal (recommend `*_…_*`); trailing-punctuation handling.
- **Prereqs:** 1.1.

### 1.3 Comments
- **Convey:** notes to yourself the reader never sees.
- **How:** one line; show it vanishing from output.
- **Examples:** `~ a reviewer note` on its own line.
- **Technical:** `~` starts a comment; **gotcha:** a comment as the *first line inside a container body* (no blank line after) collapses following blocks into one `<p>` — put a blank line after it.
- **Prereqs:** 1.1.

### 1.4 Escapes & special characters
- **Convey:** how to type a literal `*`, `@`, `#`, `~` when you mean the character.
- **How:** "when the syntax characters appear in your prose, escape them."
- **Examples:** `\*not bold\*`, a literal `@` in an email.
- **Technical:** backslash escapes; which characters are special; quotes force string in data.
- **Prereqs:** 1.1, 1.2 (so the reader knows what's special).

---

## Group 2 — Structure: using nodes

### 2.1 Using a node
- **Convey:** `@name … name@` wraps content in a named structure; the body is what's between.
- **How:** the open/close pair reads like matching brackets you can say aloud ("h1 … h1"). Contrast with prose (which needs nothing).
- **Examples:** `@h1 Title h1@`, a `@blockquote`, nesting a node inside a node.
- **Technical:** open `@name`, close `name@`; body = everything between; nodes nest; also a bare self-closing form.
- **Prereqs:** 1.1.

### 2.2 Core vocabulary
- **Convey:** Wit ships ~52 ready-made nodes mapping to document structure (headings, lists, quotes, tables, figures, sectioning…). You don't define these.
- **How:** a categorized gallery, each with its rendered result. "If you know HTML's shapes, you know these."
- **Examples:** `@h1`–`@h6`, `@ul/@li`, `@blockquote`, `@section`, `@a`, `@code`.
- **Technical:** the full list lives in `core-vocab.ts` (reference by file, never a hardcoded count); each maps to one HTML element; some (`img`, `figure`, `table`, `row`, `col`, `bibliography`) have special renderers.
- **Prereqs:** 2.1.

### 2.3 Parameters
- **Convey:** metadata *about* a node (a link's URL, an image's size) travels as parameters, separate from the body content.
- **How:** lead with the principle "content in the body, metadata in params," then show the forms from simplest up. Warn that pipes are the noisy escape hatch.
- **Examples:** `@a |href …| text a@`; `@div(class card) … div@`; record-arg `@x { k: v }`.
- **Technical:** the forms — parens `(k v)`, pipes `|k v|`, record-arg `{ k: v }` (self-closing), form-fill, colon-scatter, body-scatter; the **mixing rule** (`E_MIXED_PARAM_SOURCE`); greedy-bind hazard on bodyless pipe calls. (Deep-dive is a Guide; here, the two or three common forms.)
- **Prereqs:** 2.1.

### 2.4 Indentation is cosmetic
- **Convey:** indent for readability; scope comes only from `@name … name@` pairs, never from whitespace.
- **How:** show the same document indented and flat, rendering identically. Frees writers from Python/YAML anxiety.
- **Examples:** a nested `@section > @div > @p` indented, then flattened — identical output.
- **Technical:** whitespace is not structural; the formatter (`wit fmt`) re-indents by node depth.
- **Prereqs:** 2.1.

---

## Group 3 — Composition: defining your own

### 3.1 Defining nodes (components)
- **Convey:** name a reusable piece once with `#name … name#`, use it anywhere with `@name`. Change it in one place.
- **How:** the "don't repeat yourself" payoff — define a callout once, reuse it. This is where Wit stops being Markdown.
- **Examples:** `#tip @aside(class note) … aside@ tip#` then `@tip … tip@`.
- **Technical:** `#name … name#` block def; a def's name shadows nothing; defs are collected document-wide (order-independent); render nothing themselves.
- **Prereqs:** 2.1, 2.2.

### 3.2 Single-line & value-block defs
- **Convey:** short definitions without a closing tag: `#name: value`.
- **How:** contrast the block form with the terse colon form for one-liners.
- **Examples:** `#author: Jane Doe`, `#greeting: Hello there`.
- **Technical:** `#name: …` single-line (no body/close); `#name: … !!` value-block; when to use each.
- **Prereqs:** 3.1.

### 3.3 Captures & the body slot
- **Convey:** components take inputs — named captures and a `...` slot for the caller's body.
- **How:** build a parameterized component step by step (a labeled card).
- **Examples:** `#card ||title|| @h3 ::title:: h3@ ... card#` used as `@card |title X| body card@`.
- **Technical:** `||a, b||` capture list; `...` body slot; captures fill from params; **interpolation `::name::` is a capture hole that works inside a def body only** — not in free prose.
- **Prereqs:** 3.1, 2.3.

---

## Group 4 — Data

### 4.1 Records
- **Convey:** a set of named values in `{ }` — structured data inside a document.
- **How:** "a labeled bundle." Show inline and block forms.
- **Examples:** `#site: { name - Dunmore, lit - yes } !!`.
- **Technical:** `{ key - value }`; block records; nested records; quoted strings; multi-word keys; **limitation: a value cannot contain a comma** (commas separate fields — no escaping yet).
- **Prereqs:** 3.2 (defs hold data).

### 4.2 Collections
- **Convey:** an ordered list in `[ ]` — of scalars or of records.
- **How:** "a list of things"; show a list of records as the shape tables/iteration consume.
- **Examples:** `#rows: [ { site - A }, { site - B } ] !!`.
- **Technical:** `[ … ]`; items are scalars or records; nesting.
- **Prereqs:** 4.1.

### 4.3 Data access
- **Convey:** reach into data from prose with `@name.field`.
- **How:** show a value defined once, referenced in a sentence — the single-source-of-truth idea.
- **Examples:** `#meta: { version - 0.4.0 } !!` → `Version @meta.version.`.
- **Technical:** dot access `@name.field.sub`; **a space ends an access segment** (so `@k.years at post` reads only `years`); resolves against data defs and iteration vars. **Note:** `{{path}}` interpolation is live only inside `@@` raw bodies, *not* free prose — data-in-prose is `@name.field`.
- **Prereqs:** 4.1, 4.2.

### 4.4 Type-classified scalars
- **Convey:** numbers, booleans, and null are recognized as types, not just text.
- **How:** show `1e3`/`.5`/`+1` staying strings vs `1000` becoming a number; quotes force string.
- **Examples:** `{ n - 42, ok - true, note - "42" }`.
- **Technical:** eager classification at parse; strict number regex; applies to record fields, collection items, param values.
- **Prereqs:** 4.1.

---

## Group 5 — Logic

### 5.1 Conditionals
- **Convey:** include content only when data says so — asides in parentheses, never instructions.
- **How:** frame as "faceted content": one source, draft vs final.
- **Examples:** `(if @doc.status is draft) @aside Draft. aside@ (end)`.
- **Technical:** `(if … ) … (end)`; operators are **`is`/`equals` only** (synonyms) — no `==`,`<`,`>`,`not`,`and`,`or`,`contains`; existence/truthy; `(else)`.
- **Prereqs:** 4.3.

### 5.2 Iteration
- **Convey:** repeat content for each item in a collection.
- **How:** show a list/table built from a data collection — write the row shape once.
- **Examples:** `(each @rows as r) @li @r.site li@ (end)`.
- **Technical:** `(each @collection as item) … (end)`; the item var is in scope; access `@item.field`.
- **Prereqs:** 4.2, 4.3.

### 5.3 Faceted content
- **Convey:** one document, many variants (draft/final, audience A/B) driven by data + conditionals.
- **How:** a worked draft-vs-final example; the "no second copy to maintain" payoff.
- **Examples:** a `#doc: { status }` flag gating notes.
- **Technical:** composition of 5.1 + 4.x; build-time only (no runtime toggles).
- **Prereqs:** 5.1.

---

## Group 6 — Multi-file & self-organising

### 6.1 References (multi-file)
- **Convey:** split a document across files; assemble them into one.
- **How:** a manuscript-as-chapters mental model.
- **Examples:** `reference ./ch1.wit` then `@ch1 ch1@`.
- **Technical:** `reference ./path.wit`; defs from referenced files merge into scope; assembly/emit order; resolution at build.
- **Prereqs:** 3.1.

### 6.2 Additive partials
- **Convey:** many files contribute to one growing thing (a bibliography, a TOC).
- **How:** show three chapters each adding a bib entry that gathers into one list.
- **Examples:** `+#bibliography …` across files → one `@bibliography`.
- **Technical:** `+#name` additive def; partials merge; shape-stability rules.
- **Prereqs:** 6.1, 3.1.

### 6.3 Citations & self-organising documents
- **Convey:** cite by idea; the reference list assembles itself.
- **How:** the "citations resolve themselves" story — define a source once, cite by key.
- **Examples:** define a source, cite it inline, get a merged bibliography.
- **Technical:** citation pattern via defs + additive partials + `@bibliography` renderer; grounded in `examples/thesis` (verify — skill citation syntax has drifted).
- **Prereqs:** 6.2.

---

## Group 7 — Rich content

### 7.1 Tables
- **Convey:** tables from inline rows *or* from your data — not hand-aligned pipes.
- **How:** three forms, simplest first; then the data-driven form as the payoff.
- **Examples:** `@table |rows [[H,…],[…]]|`; `@table |schema [a,b]| |rows @data|`; `@table |rows @collection|` (auto columns).
- **Technical:** inline CSV rows; `|schema [array]|` / `|schema {record}|`; `|rows @ref|` resolves a collection and auto-derives columns from record keys; `|caption|`, `|header|`; centered by default; `@@table` (frozen) can't resolve `@ref`.
- **Prereqs:** 2.3; data-driven form needs 4.2/4.3.

### 7.2 Images & figures
- **Convey:** drop in an image; size and place it without CSS.
- **How:** show `|size|`/`|align|` presets; `@figure` for a captioned unit.
- **Examples:** `@img |src …| |size medium| |align center|`; `@figure > @img + @figcaption`.
- **Technical:** `size` = small/medium/large/full/N/N% (presets cap via max-width; full/percent fill via width); `align` = left/center/right (block on img, contents on figure); figures center by default; **PDF resolves relative paths via `<base href>`**; needs local Chrome for PDF.
- **Prereqs:** 2.3.

### 7.3 Layout — rows & columns
- **Convey:** place things side by side (image beside text) with invisible columns — no floats.
- **How:** the row/column mental model; "size the column, the content fills it."
- **Examples:** `@row > @col |size 220| (image) + @col (text) row@`.
- **Technical:** `@row` flex band, `@col |size N|` fixed / bare `@col` fills; wraps on narrow; Markdown degrades to stacked.
- **Prereqs:** 2.1, 7.2.

### 7.4 Literal & raw nodes + custom CSS
- **Convey:** ship verbatim content (CSS, code) untouched by Wit; and style the default output.
- **How:** contrast normal nodes (interpolated) with `@@` (verbatim) and `@@@` (frozen).
- **Examples:** `@@style … CSS … style@@`; `@@@pre` for literal code; `##name` literal defs.
- **Technical:** `@@name … name@@` raw body (still does `{{}}` interpolation); `@@@` frozen (no interpolation); `##name … name##` literal def; `@@style` injects CSS; **`{{path}}` interpolates only here**.
- **Prereqs:** 2.1; ties to 4.3.

---

## Group 8 — External data

### 8.1 Loading external data (`@load`)
- **Convey:** pull data from outside the document — a file, a program, the environment — at build time.
- **How:** the "single source of truth, frozen at build" motive; the CSV-into-a-table payoff.
- **Examples:** `@load downloads load@` (from a CSV via config) → `@table |rows @downloads|`; `@load env load@` → `@env.VAR`.
- **Technical:** `@load <alias> load@` binds a data def; `wit.sources.json` maps alias → `{ run: argv, format }`; formats json/csv/tsv/lines/text/svg/html; `--sources` + `--allow-exec` (security: the doc can only invoke configured aliases) + `--env`; built-in `env`; embedding via `DataLoader` (dict or fn).
- **Prereqs:** 4.2, 4.3, 7.1 (to consume it); output basics (8 lives after "producing output" for writers, but conceptually needs data).

---

## Group 9 — Producing output (the payoff loop)

### 9.1 The CLI
- **Convey:** turn a `.wit` file into a document with one command.
- **How:** the edit→build loop; the commands as a small toolbox.
- **Examples:** `wit build doc.wit -o doc.pdf`; `wit fmt -w`; `wit check`.
- **Technical:** `build` / `fmt` / `check` / `parse` / `tour`; flags `-o`, `--format`, `--fragment`, `--raw`, `--sources`, `--allow-exec`, `--env`, `-w`; **no `--watch`** (loop = re-run).
- **Prereqs:** 1.1 (need a document).

### 9.2 Render targets
- **Convey:** one source → HTML, Markdown, or print-ready PDF.
- **How:** show the same file to three targets side by side.
- **Examples:** `-o x.html` / `-o x.md` / `-o x.pdf`.
- **Technical:** extension picks the target; default = full styled HTML doc; `--fragment` = bare `<article>`; PDF via headless Chrome.
- **Prereqs:** 9.1.

### 9.3 Styling — default vs `--raw`
- **Convey:** get a Word/Docs-quality document for free, or take full CSS control.
- **How:** contrast the batteries-included default with `--raw` + `@@style`.
- **Examples:** default build; then `--raw` with a custom `@@style`.
- **Technical:** default theme; `--raw` (reset only, author brings CSS); `@@style` for custom CSS; the website is `--raw`.
- **Prereqs:** 9.2, 7.4.

### 9.4 The draft-in-git workflow ⭐
- **Convey:** keep your manuscript in git as text; compile a reader-ready PDF in seconds; every draft is diff-able.
- **How:** the headline writer narrative — version, branch, re-build, share.
- **Examples:** `git commit` a chapter → `wit build -o draft.pdf` → send; `git diff` between drafts.
- **Technical:** text source + git; fast rebuild (framed honestly — no watcher yet); PDF for readers.
- **Prereqs:** 9.1, 6.1 (chapters).

---

## Group 10 — For developers (the engine)

### 10.1 The pipeline / architecture
- **Convey:** Wit is a small pipeline you can plug into: `parse → loadExternalData → resolve → expand → render`.
- **How:** a diagram; what each stage owns.
- **Examples:** the five calls end to end.
- **Technical:** stage responsibilities; scripts run inside `expand`.
- **Prereqs:** conceptual familiarity with the language (Groups 1–9).

### 10.2 The AST
- **Convey:** `parse()` gives you a typed tree you can walk.
- **How:** show a tiny doc → its AST kinds.
- **Examples:** `parse("@h1 x h1@")` → the node shape; `wit tour` to view a tree.
- **Technical:** `parse(source, file?)`; block/inline/value/helper/condition kinds; field is `body` (not `content`).
- **Prereqs:** 10.1.

### 10.3 Embedding / the API
- **Convey:** run the whole pipeline from your own program; pass in data.
- **How:** the end-to-end embed snippet; the `DataLoader` seam (dict or fn).
- **Examples:** `parse → loadExternalData(dict) → resolve → expand → renderHtml`.
- **Technical:** exact signatures; `resolve(doc, { rootPath, fileReader })` (**`fileReader` is synchronous**); `loadExternalData(doc, source)`; `renderHtml(expanded, { mode, title, css })`; `renderMarkdown`.
- **Prereqs:** 10.1, 8.1.

### 10.4 Custom renderers
- **Convey:** the AST is renderer-agnostic — write a function to any output you like.
- **How:** walk the tree, emit your format; reference the built-in renderers as models.
- **Examples:** a minimal renderer over a few node kinds.
- **Technical:** the AST kinds; core-vocab handling; how the HTML/MD renderers are structured.
- **Prereqs:** 10.2.

### 10.5 Scripting & the `lh` bridge
- **Convey:** the escape hatch for what the declarative model can't express.
- **How:** show a small computed value; note it's advanced/last-resort.
- **Examples:** `<% … %>` inline script, a script call.
- **Technical:** `<% %>`, script calls, run order (inside `expand`), the `lh` bridge; CLI caveats (some scripts render empty via CLI path).
- **Prereqs:** 10.1.

### 10.6 Reading errors
- **Convey:** errors are located and typed — read them to fix fast.
- **How:** a common error (`E_UNCLOSED_NODE`) with its message and the fix.
- **Examples:** an unclosed node → the message → the one-line fix.
- **Technical:** all 26 codes (12 parser + 14 runtime) with cause; `file:line:col` locations; the reference lists every code.
- **Prereqs:** 2.1 (need to have written nodes to break).

---

See [onboarding-sequence.md](onboarding-sequence.md) for how these order into a
path that actually onboards someone.
