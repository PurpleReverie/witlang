# Wit docs — the complete page map

Every page the site will have, with concise coverage bullets. This is the
distilled index of the six deepened section plans (the *what each page covers*
detail lives in `01`–`06`; the *teaching order* in
[onboarding-sequence.md](onboarding-sequence.md); the *depth bar* in
[AUTHORING-STANDARD.md](AUTHORING-STANDARD.md)).

**~95 pages** across 8 groups. `⭐` = headline. `(new)` = added in the
comprehensiveness pass.

---

## Home
- **Landing** `/` — the existing Wit landing page, kept as-is.

## Get Started · `/docs/start`
- **What is Wit?** — prose-first thesis; comparison table (Markdown/HTML/LaTeX/Wit); what ships; who it's for.
- **Install** — Node ≥20; `npm i -g @witlang/cli`; the packages; `wit --version` (note: prints `0.1.0`).
- **Your first document** — write plain prose; `wit build -o x.html` then `-o x.pdf`; the edit→build loop.
- **Nodes & core vocabulary** — the `@name … name@` mechanic; a tour of the built-ins; params carry metadata.
- **The mental model** — the five layers (prose → nodes → defs → data → logic); content in body, metadata in params.
- **Choose your path** — the two doors (Write / Build) + "just looking up".

## Onboarding (cross-cutting) · `/docs/start` (new)
- **Tutorial: build a report end-to-end** ⭐ (new) — 8 verified stages: prose → heading → emphasis → list → table → figure → git → PDF ("The Lamp Keeper").
- **Migration from Markdown** (new) — 12-row construct mapping; what Wit adds (captions, data tables, components, conditionals, self-organising bibliography).
- **Migration from LaTeX** (new) — pain→relief (no preamble/packages); core mappings; honest gaps (no math engine, not typesetting).
- **Troubleshooting / errors & fixes** (new) — symptom→cause→fix for the 9 errors newcomers actually hit; links to the error reference.
- **Concept explainer: the layers** (new) — the mental-model diagram.
- **Concept explainer: the pipeline** (new) — parse → resolve → expand → render, with a diagram.

## Write (writer track) · `/docs/write`
- **Paragraphs, prose & whitespace** — blank line = paragraph; soft wraps; no leader hijacking; tabs/newlines; **mid-word `@`/`#`/`|` cautions**.
- **Emphasis** — `*bold*` / `_italic_`; marks wrap a token (arithmetic/identifiers safe); `*_…_*` for both; the reverse asymmetry.
- **Inline marks reference** (new) — `@code`/`@u`/`@s`/`@sub`/`@sup`/`@mark`/`@small`/`@br`/`@cite`; the `@sup`/`@sub` word-boundary rule.
- **Comments** — `~` line + `~~ … ~~/` inline; invisible everywhere; the comment-in-body caution; the between-prose-lines glue.
- **Headings & structure** — `@h1`–`@h6`; sectioning (`section/article/aside/header/footer/nav/main`); `@div`/`@span`.
- **Lists** — `@ul`/`@ol`/`@li`; definition lists `@dl`/`@dt`/`@dd`; rich content in an `@li`.
- **Quotes, code blocks & rules** — `@blockquote`; `@@@pre` code; `@hr`; literal `@`-syntax via frozen inline code.
- **Tables** — inline CSV; `|schema [..]|` / `|schema {..}|`; `|rows @ref|` (columns from keys); `|caption|`/`|header|`; centered; the `@@table` limit.
- **Images & figures** — `@img |size small/medium/large/full/N%| |align …|`; `@figure`/`@figcaption`; PDF `<base href>`; caps vs fills.
- **Layout** — `@row`/`@col |size N|`; image-beside-text; size the column, not the content; Markdown degrades to stacked.
- **Links & media** — `@a |href|`; `@audio`/`@video` (`|controls true|`, not bare `|controls|`).
- **Using nodes** — call forms in plain terms; nesting; indentation is cosmetic (deeper revisit of the spine page).
- **Reusable pieces (components)** — `#name … name#` and `#name: …`; captures `||…||` + `...` body slot; define once, reuse.
- **Citations & references** — cite by idea; the self-assembling bibliography.
- **The draft workflow** ⭐ — manuscript.wit in git → `wit build -o draft.pdf` → send; diff-able drafts; honest "re-run" (no `--watch`).
- **Multi-file manuscripts** — `reference ./ch.wit`; assembly/emit order.
- **Rendering: HTML / Markdown / PDF** — targets by `-o` extension; `--fragment`; default vs `--raw`; PDF via Chrome.
- **Styling** — the default Word/Docs theme; `--raw` + `@@style` for full control.
- **Document genres** — thesis, report, letter, article (grounded in the working examples).
- **Writer cheatsheet** (new) — one screen: marks, headings, lists, tables, images, build commands.

## Build (developer track) · `/docs/build`
- **Architecture overview** — the pipeline (parse → loadExternalData → resolve → expand → render); stage table + diagram.
- **Install the packages** — parser / runtime / render-html / render-markdown (cli has no library API).
- **Parsing → the AST** — `parse(source, file?)`; the side-door parsers; `format`/`wit fmt`.
- **AST reference** (new) — every kind and field from `ast.ts` (blocks, inlines, data values, params, conditions; `ScriptBlock.content`).
- **Resolve & expand** — `resolve(doc,{rootPath,fileReader (sync),onMissingReference})`; `expand`; bindings, additive partials, depth guard.
- **Rendering** — `renderHtml(expanded,{mode,title,lang,css})` (defaults fragment); `rawThemeCss`/`defaultThemeCss`; `renderMarkdown`.
- **External data — the DataLoader seam** — `loadExternalData(doc, dict|fn)`; `toDataValue`; must contain matching `@load` lines; runs before resolve.
- **Build your own renderer** — walk the AST kinds; a runnable minimal renderer; core-vocab dispatch.
- **Embed Wit in an app** — end-to-end `compileWit` helper (parse → load → resolve → expand → render).
- **Custom nodes / extending vocabulary** — defs vs core vocab; the opaque `@node` (`data-<param>` attrs).
- **Scripting & the `lh` bridge** — `<% %>`, `@scriptCall(fn, args)` (raw tokens); every `lh` op (query-by-kind, set overlay, sort, inject).
- **Errors reference** — the 12 parser + 14 runtime codes (dev-oriented; cause/repro/fix).
- **CLI reference** — commands + flags + `wit.sources.json` (dev-oriented).

## Guides (concepts) · `/docs/guides`
- **Node use & the bare reference** — `@x`, `@x.field`, block vs inline, nested-same-name, empty body.
- **Parameters — overview** — the forms + the mixing rule (**parens+pipes merge**; record-arg is the only exclusive form).
- **Pipes `|…|`** — named/positional/flag; multi-word values; last-one-wins; **the greedy-bind hazard**.
- **Parens `(…)`** — `(k v)`/`(k: v)`; self-closing; hyphen multi-word keys; trailing comma.
- **Record-arg `{ … }`** — `@x { k: v }` self-closing template call; `E_MISSING_RECORD_FIELD` if pipes follow.
- **Form-fill body** — `key: value` body fields; multi-line/empty values; value-block records; dedent close.
- **Colon-scatter & body-scatter** — `@x k:v x@` mid-body param switch; node/quoted/emphasis values; the false positives.
- **Defining nodes (templates)** — block/single-line/value-block defs; explicit `||…||` vs inferred captures; forward refs.
- **Interpolation & captures** — `::name::` (def bodies only); content-in-captures; `{{path}}` (only in `@@` bodies).
- **Data: records, collections, scalars** — `{ k - v }`, `[ … ]`; nested; quoted; multi-word keys; **comma-in-value limit**.
- **Data access** — `@x.field`, indexing, deep chains; fuzzy key match (snake/camel/spaces); missing field is lenient.
- **Type-classified scalars** — number/boolean/null recognition; strict number regex; quotes force string.
- **Conditionals** — `(if … is/equals …)`, truthy, `(else)`, nesting; **only `is`/`equals`, no `contains`**.
- **Iteration** — `(each @coll as x) … (end)`; over records/values; nesting; shadowing; order preserved.
- **Additive partials** — `+#name`; merge across files; order preservation; shape stability.
- **Multi-file documents & references** — `reference`; scope merge; assembly; circular guard.
- **Composing constructs** — def-of-def, nodes+params+data, access-in-condition/param, record-iteration-conditional.
- **Gotchas & ambiguity** — email/@ in prose, `~/path`, em-dash vs hyphen, blockquote leader, glued statements, comment-in-body.
- **Backslash escapes & special characters** — what's escapable (`*`, `_`) and what isn't (`@`, bare `|`).
- **Literal & raw nodes; custom CSS** — `@@name` (interpolates `{{}}`), `@@@name` (frozen); `##` defs; `@@style`.
- **Self-organising documents** — TOC / bibliography that assemble themselves.
- **Faceted content** — draft vs final, variant output via data + conditionals.
- **Glossary & cross-references** — define-once terms, referenced anywhere.
- **Derived-content recipes** — computing content from data/partials.

## Reference (exhaustive) · `/docs/reference`
- **Syntax reference** — every call form + def form in one table.
- **Core vocabulary** — a rich entry per node for **all 52** (headings ·6, marks ·10, lists ·6, links/media ·6, tables ·8, blocks ·4, sectioning ·7, generic ·2, layout ·2, cite ·1): emitted HTML · params · ≥2 examples · notes · fixture.
- **Tables reference** — all input forms, `schema`/`header`/`caption`, `|rows @ref|`, the `@@table` limit.
- **CLI reference** — `parse`/`check`/`fmt`/`build`/`tour` + every flag; exit codes; PDF/Chrome.
- **Config reference** — `wit.sources.json` schema; 7 formats; `env` source; `--allow-exec`; `{{capture}}` templating.
- **Data model / value types** — the 6 `DataValue` kinds; access; JSON→Wit mapping.
- **Error codes** — all 26 (12 parser + 14 runtime) + `E_UNKNOWN_OUTPUT_FORMAT`: cause · repro · fix · related.
- **API reference** — exact exports/signatures per package.
- **Gotchas & anti-patterns** — the recurring traps (verify against code before lifting skill prose).
- **Known limitations** — comment-in-body, record-comma, `@figure`→`<p>`, `@@table` refs, fixture 26, no `--watch`.
- **Glossary** (new) — ~35 terms, each mapped to its AST kind / source symbol.
- **Cheatsheet** (new) — one-screen syntax card + 52-name quick strip.

## Recipes · `/docs/recipes`
- **A thesis / essay → PDF** — headings, emphasis, table, figure, works cited → `-o essay.pdf`.
- **A report with live data** — `@load` from config; numbers + table from a program.
- **Load a CSV into a table** — `cat data.csv` source → `@table |rows @x|`.
- **A manuscript in chapters** — multi-file `reference`; one PDF.
- **Creative writing (no indentation)** — flat prose, scene breaks, emphasis, dialogue.
- **An interactive / RPG script** — data + `(if …)` + `(each …)` + custom scene/choice defs.
- **A website built entirely in Wit** — `--raw`, `@@style`, parts via `reference` (the landing page).
- **A bibliography across files** — additive `+#bibliography` merged into one list.
- **Embed the Wit parser in an app** — parse → loadExternalData(dict) → resolve → expand → renderHtml.
- **Write a custom renderer** — AST walk → your own format.
- **Annotated full document** (new) — a line-by-line walk of the entire `essay.wit`.

## Playground · `/playground`
- **Live editor** — in-browser Wit (parser+runtime+render-html bundle); editor | preview; examples gallery seeded from fixtures; deep-linkable.

## Project / Contributing · `/docs/project`
- **Design principles** — content in bodies; params are metadata; prose-first; the escape hatch.
- **Architecture** — the pipeline; the packages; resolution timing.
- **Roadmap** — milestones from PLAN.md.
- **How to add a node / renderer** — extend core vocab; write a renderer.
- **The spec** — deprecation note (Reference supersedes `spec.md`).
- **Changelog** — releases (note the version-drift reconciliation).

---

## Rough scale

| Group | Pages |
|---|---|
| Get Started + Onboarding | ~12 |
| Write | 20 |
| Build | 13 |
| Guides | 24 |
| Reference | 12 (Core vocab = 52 entries) |
| Recipes | 11 |
| Playground + Project | 7 |
| **Total** | **~95 pages** |
