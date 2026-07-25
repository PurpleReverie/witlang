# Content design — Get Started · Playground · Project · Cross-cutting onboarding

Planning doc for the **onboarding spine** of the Wit docs site. It designs
*what each page covers and how it is structured* — not final prose. It holds
the Get-Started sequence, the Playground, the Project pages, and the
**cross-cutting page types a comprehensive onboarding needs** (a hand-held
tutorial, two migration guides, a narrative troubleshooting resource, and the
concept explainers with diagrams).

Every page spec meets the depth bar in
[AUTHORING-STANDARD.md](AUTHORING-STANDARD.md): **concept · why/when ·
progressive examples (basic → realistic → edge, each verified) · every
option/edge cited to a fixture · common mistakes · see-also**. Teaching order
follows [onboarding-sequence.md](onboarding-sequence.md) §4 (the single source
of sequence); this file never re-derives order, it defers to §4.

Every claim below was **verified by building** against the working tree, e.g.:

```
node packages/cli/dist/bin.js build /tmp/x.wit --fragment      # HTML fragment
node packages/cli/dist/bin.js build /tmp/x.wit -o /tmp/x.pdf   # PDF
node packages/cli/dist/bin.js check /tmp/x.wit                 # errors only
```

Snippets tagged **✓ verified** were run this way and their rendered output is
shown. Source-of-truth ranking is **code → fixtures → examples → README /
PLAN / CHANGELOG**; `docs/spec.md` is stale and is *not* a source (see the Spec
page and [FINDINGS.md](FINDINGS.md) E).

Conventions:
- Slugs follow `docs/plan/README.md` §5.
- "Live playground seeds" = snippets the page's embedded editor opens with,
  each guaranteed-buildable today.
- Sources are absolute-from-repo-root paths.

---

## Cross-section shared facts (state once, reuse everywhere)

- **Version.** `wit --version` prints `0.1.0` (`packages/cli/src/bin.ts`
  `VERSION`); `CHANGELOG.md` agrees. A `v0.2.0` git tag and later
  feature commits exist, so the installed CLI and the git history disagree —
  reconcile before launch (FINDINGS A; the Changelog page owns the note).
- **CLI subcommands** (`packages/cli/src/bin.ts` `HELP_TEXT`, verified):
  `parse`, `check`, `fmt`, `build`, `tour`.
- **`wit build` flags:** `-o/--out`, `--format html|md|pdf`, `--fragment`,
  `--raw`, `--sources`, `--allow-exec`, `--env`. **`wit fmt`:** `-w/--write`.
  There is **no `--watch`** on any subcommand (verified — no `watch` token in
  `packages/cli/src`; FINDINGS D). Frame the writer loop honestly as *re-run
  the fast build* / a shell loop.
- **Three HTML pathways** (`packages/cli/src/cmd-build.ts`,
  `packages/render-html/src/render.ts`): **default** = self-contained styled
  document (Word/Docs-like theme, `packages/render-html/src/theme.ts`
  `defaultThemeCss`); **`--raw`** = reset-only page you style yourself
  (`rawThemeCss`); **`--fragment`** = bare `<article class="wit-doc">` for
  embedding.
- **Format inference:** from the `-o` extension — `.html`/`.htm`, `.md`/
  `.markdown`, `.pdf`; override with `--format`. PDF paginates the default
  HTML through a headless system Chrome (`WIT_CHROME` to point at a binary).
- **Pipeline:** `lex → parse → resolve → expand → render` (README
  §Architecture, PLAN §C). Packages: `parser`, `runtime`, `render-html`,
  `render-markdown`, `cli`, `skill`, `vscode`.
- **Core vocabulary is 52 names + `node`** (verified in
  `packages/runtime/src/core-vocab.ts`): 6 headings, 10 inline marks,
  6 list, 6 link/media, 8 table, 4 block, 7 sectioning, `div`/`span`,
  `row`/`col`, `cite`. **Never cite a count in prose** — the old "47" is
  stale in README/CHANGELOG; reference the list. `@node` is the opaque
  pass-through.
- **`check` vs `build` strictness (verified, a load-bearing teaching fact):**
  an **unknown bare name** `@glossary` is a hard error in *both* `check` and
  `build` (`E_UNRESOLVED_REFERENCE`). A **missing field on a *resolved* base**
  `@keeper.tenure` is *lenient* — it renders `<span class="wit-unresolved">`
  and exits 0. The distinction drives half the troubleshooting page.

---

## Get Started — `/docs/start`

Six sequential onboarding pages ending at the two-door split. Shared by both
audiences; no track-specific depth. Order is fixed by
onboarding-sequence.md §4.0: *what is Wit → prose/first-doc → emphasis &
comments → nodes & core vocab → mental model → two doors*. (The mental-model
page sits after nodes so its Layer-1 examples are concrete, per §4.0's
"concrete before abstract".)

### What is Wit? — `/docs/start/what-is-wit`

- **Purpose:** Positioning — the prose-first thesis and where Wit sits vs
  Markdown / HTML / LaTeX. **Audience:** both.
- **Why / when:** the reader's first ten seconds; answers "why not just
  Markdown?" before any syntax. Motivation-before-mechanics (rubric §1).
- **Concept:** Wit is a prose-first markup language — documents read like
  normal text, and structure (nodes, data, conditionals, iteration,
  scripting) appears *only where the author needs it*.
- **Outline:**
  1. One-sentence pitch (prose-first markup for people who write and the
     systems that consume what they write).
  2. The problem: Markdown breaks the moment you need structure — captioned
     figures, self-resolving citations, conditional sections, loops over data.
     The usual escape ("drop into HTML" / SSG frontmatter) shreds prose flow.
  3. The Wit answer: plain sentences stay plain; structure is first-class but
     opt-in.
  4. Comparison table — Markdown / HTML / LaTeX / Wit across: reads-as-prose,
     structured nodes, data + logic, self-organising documents
     (TOC/bibliography), output targets.
  5. What ships: five zero-dependency TypeScript packages + a VS Code
     extension.
  6. Who it's for → hands to the two doors, and to the migration guides for
     Markdown/LaTeX refugees.
- **Examples to show (progressive, ✓ verified):**
  - *Basic* — three plain paragraphs with one `*bold*` word: proves "it's just
    text until you need more" (from `examples/01-prose.wit`).
  - *Realistic* — the README "A taste" snippet: a `~` comment, `@h1 … h1@`,
    a paragraph with `*safety*` / `_darkest_`, and a `@reference_entry` block;
    the same source compiles to HTML **or** Markdown (verified:
    `--format md` emits `# Why I like lighthouses`).
  - *Edge / payoff contrast* — a Markdown captioned-figure hack vs
    `@figure @img |src …| |alt …| @figcaption … figcaption@ figure@`
    (verified against `tests/fixtures/18-core-vocab/links-and-media.wit`).
- **Key points:** prose is the default, not an escape hatch; structure is
  first-class but opt-in; one source → HTML / Markdown / PDF; zero runtime
  deps.
- **Common mistakes (set expectations early):** Wit is *not* a CMS, editor, or
  general templating engine — it is a file format (PLAN §A non-goals). It is
  *not* Turing-complete; `<% %>` is the single compute escape hatch.
- **See also:** Migration from Markdown, Migration from LaTeX, The mental
  model, Choose your path.
- **Sources:** `README.md` (Why Wit / A taste), `PLAN.md` §A,
  `examples/01-prose.wit`, `tests/fixtures/02-emphasis/`,
  `packages/runtime/src/core-vocab.ts`.

### Your first document — `/docs/start/first-document`

- **Purpose:** Write real prose, build it to HTML then PDF, internalise the
  edit→build loop — the payoff, delivered early (rubric §1; sequence §4.0
  step 3). **Audience:** both, writer-leaning.
- **Why / when:** the reader has installed nothing yet mentally; this is where
  they see a rendered document come out of a plain file.
- **Concept:** a `.wit` file of ordinary paragraphs already builds to a
  finished, styled document — no boilerplate, no preamble.
- **Outline:**
  1. Create `hello.wit` — three plain paragraphs, zero markup (the
     `examples/01-prose.wit` "keeper" text).
  2. `wit build hello.wit -o hello.html` → open it; note the batteries-included
     default theme (looks like a Word doc; `defaultThemeCss`).
  3. Add one heading (`@h1 … h1@`) and one `*bold*` word; rebuild; see it
     change.
  4. Build to PDF — `wit build hello.wit -o hello.pdf` (headless Chrome;
     relative images anchored via `<base href>`); show the "no Chrome found"
     fallback message honestly.
  5. Other targets — stdout by default, `-o out.md` for Markdown,
     `--fragment` for embedding, `--raw` to bring your own CSS.
  6. The loop — edit → `wit build` → refresh. **No `--watch` exists**; the loop
     is *re-run the build* (fast) or a one-line shell `while` loop. Mention
     `wit check` for errors and `wit fmt` for tidy indentation (each deepened
     later).
- **Examples to show (✓ verified):**
  - The keeper paragraphs as starting text → build to `.html`.
  - Same file after adding `@h1 The Lamp Keeper h1@` and `_italic_`/`*bold*`
    (verified: `<h1>…</h1>` + `<strong>`/`<em>`).
  - The three build invocations (`-o .html`, `-o .pdf`, `-o .md`) and the
    Markdown output for comparison.
- **Key points:** format is inferred from the `-o` extension; default HTML is a
  complete styled file; PDF reuses that document through Chrome; the loop is
  just edit-and-rebuild.
- **Common mistakes:** expecting `--watch` (doesn't exist — frame the shell
  loop); expecting PDF without a system Chrome (show the fallback message and
  `WIT_CHROME`).
- **See also:** Install, The mental model, Producing & shipping (Write track),
  Troubleshooting.
- **Sources:** `examples/01-prose.wit`,
  `packages/cli/src/cmd-build.ts` (`resolveFormat`, `emitPdf`, `htmlOptions`),
  `packages/render-html/src/theme.ts`, `README.md` (Quick start).

### Install — `/docs/start/install`

- **Purpose:** Get a working `wit` on the reader's machine and prove it.
  **Audience:** both (writer path = global CLI; dev path = per-project
  packages).
- **Why / when:** immediately after the payoff — the reader now wants it
  locally. Kept *after* "first document" so the playground/first-doc hook lands
  before any install friction.
- **Outline:**
  1. Prerequisites: Node ≥ 20 (README badge, `CONTRIBUTING.md`); pnpm ≥ 9 only
     to build from a clone.
  2. Install the CLI globally — `npm install -g @witlang/cli`.
  3. Smoke test — `wit --version` (prints `0.1.0`), `wit --help` (show the
     real usage block from `HELP_TEXT`).
  4. Add packages to a project (dev path) — `@witlang/parser`,
     `@witlang/runtime`, `@witlang/render-html`, `@witlang/render-markdown`.
  5. From a clone (contributors) — `pnpm install && pnpm build`, then
     `node packages/cli/dist/bin.js …`.
  6. Optional: VS Code extension via `pnpm vscode:install` (not on the
     marketplace; requires VS Code 1.94+ and `code` on PATH).
  7. Optional: PDF needs a system Chrome/Chromium (or `WIT_CHROME`) —
     forward-reference to the first-document page.
- **Examples to show (✓ verified):**
  - The `wit --help` usage block (parse / check / fmt / build / tour).
  - `npm i @witlang/parser @witlang/runtime @witlang/render-html` for embedders.
- **Key points:** global CLI is the fast path for writers; libraries are the
  path for developers; zero runtime deps means a clean install; Chrome is only
  needed for PDF.
- **Common mistakes:** wrong Node (< 20); expecting the extension on the
  marketplace (it isn't — dev-install only); assuming a clone is needed to try
  Wit (it isn't — the Playground runs in-browser).
- **Live playground seeds:** none (install is host-side). Show a copy-paste
  terminal component and a "no install needed to try it" playground link.
- **See also:** Your first document, the Playground, Roadmap (marketplace
  publish is planned).
- **Sources:** `README.md` (Quick start / VS Code extension),
  `CONTRIBUTING.md` (Node/pnpm versions), `packages/cli/src/bin.ts`
  (`HELP_TEXT`, `VERSION`), `docs/publishing-to-npm.md`.

### Nodes & core vocabulary — `/docs/start/nodes`

- **Purpose:** teach the one mechanic every later page depends on —
  `@name … name@` wraps content in a structure — and tour the built-in
  vocabulary so writers can reach for headings, lists, quotes, tables, and
  figures immediately. **Audience:** both. *(Prerequisite for the Write
  track's rich-content pages; onboarding-sequence §4.0 step 5.)*
- **Why / when:** right after the first build, once the reader wants more than
  paragraphs. Taught *before* the mental model so Layer 1 has concrete
  referents.
- **Concept:** a node call `@name body name@` wraps a span of content in a
  named structure; the renderer decides block vs inline, never the writer.
- **Outline:**
  1. The call: `@name … name@` — open, close, body between; the bare
     self-closing form `@name`; the short-close `@name body !!`.
  2. Nesting nodes; **indentation is cosmetic** — scope comes from the pairs,
     not columns (verified: `wit fmt` re-indents without changing structure).
  3. A guided tour of core vocabulary by category, each with rendered output:
     headings, inline marks, lists, links/media, blocks, tables, figures,
     sectioning, `div`/`span`, `row`/`col`.
  4. Parameters in one breath: metadata rides in `|k v|` / `(k v)`, content
     stays in the body — the full form matrix is a Reference guide.
  5. You don't define these; they ship. (Defining your own is Components.)
- **Examples to show (progressive, ✓ verified):**
  - *Basic* — `@h1 The Lamp Keeper h1@`, `@blockquote … blockquote@`
    (`18-core-vocab/headings.wit`, `blocks.wit`).
  - *Realistic* — a nested list: `@ul @li … li@ … ul@` →
    `<ul><li>…</li>…</ul>` (`18-core-vocab/lists.wit`).
  - *Edge* — a link carrying metadata in a param, content in the body:
    `@a |href https://example.org| Example a@` → `<a href="…">Example</a>`
    (`18-core-vocab/links-and-media.wit`).
- **Every option / edge (each cited):** headings h1–h6
  (`headings.wit`); inline marks `em/strong/code/u/s/sub/sup/mark/small/br`
  (`inline-marks.wit`); lists `ul/ol/li/dl/dt/dd` (`lists.wit`); links & media
  `a/img/figure/figcaption/audio/video` (`links-and-media.wit`); blocks
  `p/blockquote/pre/hr` (`blocks.wit`); sectioning
  `section/article/aside/header/footer/nav/main` (`sectioning.wit`); tables
  (`19-tables/`); `div`/`span`/`row`/`col` (`core-vocab.ts` comments —
  invisible flex layout).
- **Key points:** one mechanic (`@name … name@`) underlies every structural
  page; built-ins map to HTML shapes; you reach for them without defining
  anything; content in the body, metadata in params.
- **Common mistakes:** carrying content in a param (params are metadata);
  expecting indentation to create scope (it doesn't); the **comment-as-first-
  child bug** — a `~` comment as the first line of a node body silently
  collapses the following blocks into one `<p>` (nesting an `@h3` wrongly);
  add a blank line after the comment (verified; FINDINGS C-1).
- **Live playground seeds (✓ verified):** (1) turn a paragraph into
  `@blockquote`; (2) build a small `@ul` of `@li`s.
- **See also:** The mental model, Emphasis, the Core-vocab Reference, the
  Tables/Images Write pages.
- **Sources:** `tests/fixtures/18-core-vocab/*`, `tests/fixtures/19-tables/*`,
  `examples/04-using-nodes.wit`, `examples/05-parameters.wit`,
  `packages/runtime/src/core-vocab.ts`,
  `packages/render-html/src/render-core-vocab.ts`.

### The mental model — `/docs/start/mental-model`

- **Purpose:** the core idea — prose is the default; nodes, definitions, data,
  and logic layer in only where needed. **Audience:** both. *(Pairs with the
  "layers" diagram in Concept explainers.)*
- **Why / when:** after the reader has met prose and a few nodes; this names
  the pattern they've already seen and previews where the language goes.
- **Concept:** Wit is five layers stacked on prose. You climb only as far as a
  given document needs; most documents live in the bottom two.
- **Outline (the five layers):**
  1. **Layer 0 — Prose.** Paragraphs, blank-line separation, `_italic_` /
     `*bold*`, `~` comments. Most of a document is this.
  2. **Layer 1 — Nodes.** `@name … name@` wraps a span; core vocab needs no
     definition; renderer decides block vs inline.
  3. **Layer 2 — Definitions.** Name a chunk once and reuse it: single-line
     `#name: value` (**`!!` optional** — verified: `#epigraph: The sea…` then
     `@epigraph` builds), value-block `#name: … !!`, block-form `#name … name#`
     wrapping long sections; captures `||a,b||` + interpolation `::a::` +
     body slot `...`.
  4. **Layer 3 — Data.** Records `{ k - v }`, collections `[ … ]`, dotted
     access `@x.field`.
  5. **Layer 4 — Logic.** `(if … end)`, `(each … as … end)`, and `<% %>`
     scripting as the explicit escape hatch (not Turing-complete).
  6. The governing rule — content goes in node **bodies**; parameters are
     **metadata** (never carry content in a param). Structure appears only
     where the author reaches for it.
  7. One document climbing all five layers, annotated.
- **Examples to show (progressive, ✓ verified):**
  - *Basic* — prose → prose + `@aside … aside@`.
  - *Realistic* — a `#epigraph: …` def recalled by `@epigraph`
    (define-once-recall-anywhere; `!!`-less single-line form verified).
  - *Edge* — a `#chapter ||number, title, subtitle||` def using `::number::`
    interpolation, a nested `(if ::subtitle::)`, and the `...` body slot
    (`examples/07-defining-nodes.wit`).
- **Key points:** everything is prose until you opt into structure; params ≠
  content; logic is a last resort; scripting is the sanctioned escape hatch.
- **Common mistakes:** expecting `{{path}}` or `::name::` to interpolate in
  **prose** — they don't. `::name::` is a capture hole *inside a def body
  only*; `{{path}}` is live *only inside `@@` raw-node bodies*; data-in-prose
  is `@name.field` (verified; FINDINGS D). Expecting `contains`/`<`/`>`/`and`
  in conditionals — only `is` / `equals` exist (verified: `(if @tags contains
  urgent)` silently misfires; FINDINGS D).
- **Live playground seeds:** (1) the "five layers, one document" annotated
  sample; (2) `#epigraph: …` then `@epigraph`.
- **See also:** Nodes & core vocab, Components (Write), Data (Write), the
  "layers" and "pipeline" Concept explainers.
- **Sources:** `packages/skill/skill/SKILL.md` (principles — but verify against
  code; FINDINGS E), `examples/04-using-nodes.wit`,
  `examples/07-defining-nodes.wit`, `packages/runtime/src/core-vocab.ts`,
  `PLAN.md` §A.

### Choose your path — `/docs/start/choose-your-path`

- **Purpose:** the two-door split — send writers and developers down their
  track. **Audience:** both (routing page).
- **Why / when:** the end of the shared spine; the reader has enough to know
  which door fits.
- **Outline:**
  1. Two cards — **Write** (keep a manuscript in git, compile a PDF for
     readers) and **Build** (embed `@witlang/parser`, build custom renderers).
  2. Write door → what's inside `/docs/write` (prose, emphasis, headings,
     lists, figures, layout, citations, drafts, multi-file manuscripts,
     rendering, styling, genres).
  3. Build door → what's inside `/docs/build` (architecture, packages,
     parse→AST, resolve/expand, renderers, the `DataLoader` seam, custom
     renderers, embedding, scripting bridge).
  4. Shared destinations both doors converge on — Reference, Recipes,
     Playground, Troubleshooting, the migration guides.
  5. "Not sure?" → default to Write; you can cross over anytime.
- **Examples to show:** none — navigation page. Use `PathCards` with one
  representative snippet per door (a `#chapter` manuscript def for Write; a
  `parse()→resolve()→expand()` call for Build).
- **Key points:** two audiences, one language; the tracks converge; picking
  wrong costs nothing.
- **See also:** everything downstream — this is the hub.
- **Sources:** `docs/plan/README.md` §3, §5, §6.2, §6.3;
  `onboarding-sequence.md` §4.1–§4.3.

---

## Playground — `/playground`

A **page-design spec**, not content. The playground is the only place Wit runs
at request time, and it runs client-side.

- **Purpose:** a full-screen in-browser live editor with instant preview and a
  gallery of runnable examples. **Audience:** both.
- **Why / when:** the zero-friction "try it" surface linked from What-is-Wit,
  Install, and every Reference page's live examples.
- **Page layout / UX:**
  1. **Two-pane split** — source editor (left) | live rendered preview (right);
     responsive to stacked panes on narrow viewports.
  2. **Live recompile** — debounced `parse → resolve → expand → render` on
     keystroke; preview updates in place.
  3. **Preview surface** — rendered HTML in a **sandboxed iframe** (isolates
     `@@style`/injected CSS from site chrome), themed with `wit-doc` styles.
  4. **Toolbar** — target toggle (HTML preview / Markdown source / raw HTML),
     theme toggle (light/dark matching `defaultThemeCss`'s
     `prefers-color-scheme`), copy-source, download-`.html`, reset-to-example.
  5. **Error surface** — parser/runtime errors render inline as
     `line:col E_CODE message` (mirrors CLI formatting, verified:
     `e1.wit:1:1: E_UNCLOSED_NODE: unclosed @aside`) instead of a broken
     preview.
  6. **Examples gallery** — a picker seeded from `tests/fixtures/` + `examples/`;
     selecting one loads its source.
  7. **Deep-linkable state** — encode source in the URL for sharing and for
     Reference "edit this example" hand-offs.
- **How in-browser Wit works:** ship a client bundle of `@witlang/parser` +
  `@witlang/runtime` + `@witlang/render-html` — all zero-dependency ESM that
  targets browsers (PLAN I1.4), so no server round-trip. Markdown view calls
  `@witlang/render-markdown` on the same expanded AST.
- **Honest limits (state, don't hide):** `@load` external data and PDF output
  are **not** available client-side (they need subprocess/Chrome). The
  playground disables PDF and either stubs `@load` or pre-bakes loaded data
  into a demo dictionary. **No `--watch` concept applies** — the playground is
  inherently live, which is the closest thing to a watcher Wit offers today.
- **Examples to show (gallery seeds, each ✓ verified):**
  - "Hello prose" — plain paragraphs + one heading (`examples/01-prose.wit`).
  - "Emphasis & comments" — `examples/02-emphasis.wit`,
    `examples/03-comments.wit`.
  - "Define & reuse" — `#epigraph: …` recalled by `@epigraph`.
  - "Data + iteration" — a `[ … ]` collection through `(each … as …)`.
  - "A table from a record" — `@table |schema [name, status]| |rows @sites|`
    (`tests/fixtures/19-tables/schema-array.wit`).
  - "Figure + layout" — `@figure`/`@img |size medium|` and a `@row`/`@col`
    pair (`examples/load-demo/report.wit`) with pre-baked data.
- **Key points:** no install, no backend, shareable; the same engine as the
  CLI, so what you see is what `wit build` produces; the playground doubles as
  the live-example engine embedded across Reference pages.
- **See also:** Your first document, every Reference page, the Tutorial (its
  stages should be one-click "open in playground").
- **Sources:** `docs/plan/README.md` §2, §6.7, §7, `packages/render-html/`,
  `packages/runtime/src/index.ts`, `packages/render-markdown/`, PLAN I1.4,
  `tests/fixtures/`, `examples/`.

---

## Project — `/docs/project`

Contributor- and integrator-facing. Six pages.

### Design principles — `/docs/project/principles`

- **Purpose:** the philosophy and non-goals that shape every decision.
  **Audience:** both (contributor-leaning).
- **Why / when:** for anyone asking "why is it *this* way?" before proposing a
  change or building on the AST.
- **Outline:**
  1. Prose-first — structure is opt-in; readable source is the constraint.
  2. Content in bodies, params are metadata (the authoring rule elevated to a
     project value).
  3. Small reserved core vocabulary mirroring HTML's semantic shapes;
     everything else is user-defined (`#name`) or opaque pass-through
     (`@node`).
  4. Not Turing-complete; `<% %>` is the single explicit compute escape hatch.
  5. Not a CMS / editor / templating engine — Wit is a **file format**.
  6. Engineering constraints as principles — zero runtime deps, deterministic
     output, stable source locations, 350-line files / 20-line functions,
     fixtures as the executable spec, test-first.
- **Examples to show (✓ verified):** the `@node(type highlight)` opaque
  pass-through composing into a user `#highlight` def (PLAN §C).
- **Key points:** constraints are deliberate; the core stays small on purpose;
  the fixtures are the contract.
- **Common mistakes (contributor-facing):** proposing a new core-vocab node
  when a `#def` would do; adding string-interpolation to prose (a non-goal).
- **See also:** Architecture, Extending, the Extended tutorial (dogfoods the
  principles).
- **Sources:** `PLAN.md` §A, §C, `CONTRIBUTING.md`, `RULES.md`,
  `packages/skill/skill/SKILL.md` (verify against code).

### Architecture — `/docs/project/architecture`

- **Purpose:** the `parse → resolve → expand → render` pipeline and how
  packages map to stages. **Audience:** developer. *(Pairs with the "pipeline"
  Concept explainer.)*
- **Why / when:** the first page a tool-builder or renderer author reads.
- **Outline:**
  1. The five-stage diagram (`lex → parse → resolve → expand → render`) and the
     package that owns each (parser, parser, runtime, runtime, render-*).
  2. Per-stage contract — raw AST → bound AST → expanded AST → output string.
  3. Where tools stop early — LSP/formatter need only parse (or resolve);
     renderers consume any post-expand AST.
  4. Source locations propagate through every stage
     (`{ file, line, col, length }`).
  5. Resolution timing — the three-tier eager / expansion / snapshot table
     (PLAN §C: pipe values & conditional operands bind eagerly; def bodies
     re-resolve per use; iterated collections snapshot at loop entry).
  6. The CLI as the driver chaining stages; the VS Code LSP runs the same
     stages in-editor.
- **Examples to show (✓ verified):**
  - `wit tour file.wit` output — the readable AST tree (verified on a
    `#greet` + `@h1` doc: shows `nodeDef #greet [shape: single-line]`,
    `nodeUse @greet`, `nodeUse @h1 → paragraph → text`).
  - A tiny `#x`/`@x` doc shown parsed → resolved → expanded.
- **Key points:** stages are independently testable and replaceable; renderers
  are pluggable at the expanded-AST boundary; determinism + source locations
  are structural guarantees.
- **Common mistakes:** assuming a renderer must re-parse (it consumes the
  expanded AST); assuming expansion happens at parse time.
- **Live playground seeds:** a doc with a def + a conditional, paired with a
  "show AST" view (mirrors `wit tour`).
- **See also:** Extending, Embedding (Build), the "pipeline" explainer.
- **Sources:** `README.md` §Architecture, `PLAN.md` §C,
  `packages/cli/src/cmd-tour.ts`, `packages/runtime/src/index.ts`.

### Roadmap — `/docs/project/roadmap`

- **Purpose:** where Wit is and what's next. **Audience:** both.
- **Outline:**
  1. Status now — v0.x, language feature-complete for the initial scope.
  2. Milestone ladder M0→M7 (the M7 "1.0" bar: docs site + published packages +
     versioned spec) — mark what's shipped.
  3. In progress — the literal-node layer: `@@name … name@@` and `@@@…@@@`
     frozen bodies (**shipped**, verified), `{{path}}` interpolation inside
     `@@` bodies (**shipped**, verified: `@@style` with `{{accent}}`), and the
     `##name … name##` component def (**planned, not built**).
  4. VS Code extension roadmap — quick wins (live preview, snippets, folding,
     file icon), medium (document links, rename, workspace symbols, signature
     help, code actions), bigger bets (formatter/format-on-save, embedded
     script highlighting, custom editor, marketplace publish).
  5. Explicitly deferred / v2 — non-ASCII handles, incremental reparse hooks,
     `@witlang/theme` split. **Near-term writer-delight candidates surfaced by
     onboarding:** a `wit build --watch` (doesn't exist today) and
     record-value comma escaping (see Troubleshooting) — flag both honestly as
     not-yet-shipped.
- **Examples to show (✓ verified):** shipped `@@style` + `{{}}` interpolation
  vs planned `##card … card##`; mark clearly which builds today.
- **Key points:** pre-1.0, breaking changes allowed under 0.x; the docs site is
  itself an M7 deliverable and a dogfood test; most VS Code items reuse
  existing engine infrastructure.
- **Common mistakes:** treating `##`-defs, prose `{{}}`, `@name: … !!`
  form-fill, or `contains` as shipped — they are not (FINDINGS D/E).
- **See also:** Changelog, the VS Code section of Install.
- **Sources:** `PLAN.md` §D, §D.1, §D.2, `docs/literal-nodes-and-components.md`
  (split shipped from roadmap; FINDINGS E), `README.md` §Status, `git log`.

### How to add a node / renderer — `/docs/project/extending`

- **Purpose:** practical guide to extending the vocabulary and writing a
  renderer. **Audience:** developer.
- **Outline:**
  1. Three ways to get a new node — user `#def` (no code), core-vocab addition
     (code), `@node(type …)` opaque pass-through (renderer-dispatched).
  2. Adding to the core vocabulary — register the name in `core-vocab.ts`, add
     a handler in each renderer, add an `18-core-vocab` fixture; the test-first
     cadence (fixture + snapshot *before* the change; `CONTRIBUTING.md`).
  3. Writing a custom renderer — walk the expanded AST, dispatch on `kind`; the
     discriminated-union kinds (enumerable via `wit tour` / `cmd-tour.ts`) are
     the surface.
  4. The `@node` escape valve — carry params straight through for
     renderer-specific widgets; dispatch on the `type` param convention.
  5. Wiring into the CLI or your own driver
     (`parse → resolve → expand → renderX`).
- **Examples to show (✓ verified):** `@node(type highlight)` inside a
  `#highlight` wrapper; a minimal `switch (node.kind)` renderer skeleton over
  `paragraph`/`text`/`nodeUse`/… .
- **Key points:** most "new nodes" need zero code (just `#def`); core additions
  must land in every renderer + a fixture; `@node` is the extension seam; the
  AST is a stable serializable exhaustive union.
- **Common mistakes:** adding a core node without a fixture (breaks the "executable
  spec" contract); lifting prose from `packages/skill/skill/reference/*` without
  re-verifying (it predates recent features; FINDINGS E).
- **See also:** Architecture, Custom renderers (Build), Design principles.
- **Sources:** `packages/runtime/src/core-vocab.ts`, `packages/render-html/src/`,
  `packages/render-markdown/src/`, `packages/cli/src/cmd-tour.ts`,
  `CONTRIBUTING.md`. *(Verify skill reference files against current renderer
  code before lifting prose.)*

### The spec — `/docs/project/spec`

- **Purpose:** explain the spec's status and the migration to Reference.
  **Audience:** both.
- **Outline:**
  1. Status banner — `docs/spec.md` is **stale / out of date**; not
     authoritative.
  2. What's authoritative instead — the ranked source-of-truth (code →
     fixtures → examples → README/PLAN/CHANGELOG); the site's **Reference**
     section is built from these and becomes the new spec.
  3. The plan — Reference pages (kept honest by live examples + fixtures)
     supersede `spec.md`; deprecate and redirect once Reference is complete.
  4. Interim guidance — if you must consult the old spec, cross-check every
     claim against a fixture or a `wit build`.
  5. Also present — `wit-spec.pdf` in the repo (its own version tag), likewise
     pending regeneration.
- **Examples to show:** none — status/navigation page; link to the Reference
  index and `tests/fixtures/`.
- **Key points:** the old spec lies; the fixtures don't; Reference-as-spec is
  the chosen direction; redirect is coming.
- **See also:** Troubleshooting (which cites the fixtures as the error
  reference), Architecture.
- **Sources:** `docs/plan/README.md` §4, §9, `docs/spec.md` (marked stale),
  `PLAN.md` §K, `README.md` (`wit-spec.pdf`).

### Changelog — `/docs/project/changelog`

- **Purpose:** release history. **Audience:** both.
- **Outline:**
  1. Current release — 0.1.0 (initial public release): packages, language
     features, known-limitations pointer.
  2. Format note — Keep-a-Changelog, Changesets-driven (PLAN §K); pre-1.0 =
     0.x, breaking allowed with notes.
  3. Per-release sections going forward (Packages / Language features / Known
     limitations).
  4. Link to the roadmap for what's next.
- **Examples to show:** none — render `CHANGELOG.md` as the page body.
- **Key points:** one source of truth (`CHANGELOG.md`); versioning policy is
  explicit; known limitations live in `packages/parser/README.md`.
- **⚠ Action flag (not content):** `CHANGELOG.md` documents only **0.1.0** and
  `bin.ts` `VERSION` reads `0.1.0` (verified: `wit --version` → `0.1.0`), yet a
  `v0.2.0` tag and "typed params / iterable captures" commits exist. **Also**
  the changelog inherits the stale "47-name core vocabulary" (it's 52 + `node`).
  Reconcile version + count before this page ships or it will contradict the
  installed CLI (FINDINGS A).
- **See also:** Roadmap, Install (version smoke test).
- **Sources:** `CHANGELOG.md`, `packages/cli/src/bin.ts` (`VERSION`),
  `PLAN.md` §K, `git log`.

---

## Cross-cutting onboarding page types (NEW)

These are the page types a comprehensive onboarding needs beyond the linear
spine (AUTHORING-STANDARD §"Missing page types"). They cut across the Write and
Build tracks and are linked from Choose-your-path and Get-Started.

### Extended tutorial — build one real document → PDF — `/docs/tutorial`

A multi-page, hand-held walkthrough that builds **one** finished document end
to end. Chosen document: a short illustrated report/essay, *"The Lamp Keeper"*,
reusing the fixture voice so every stage stays grounded. Each stage is its own
page (or a clearly numbered stage on a long page); each ends by **building and
showing the rendered result**, and each is buildable at that point (no forward
references — rubric §2). Every stage links "open in Playground".

- **Purpose:** take a reader from an empty file to a built PDF, introducing one
  construct per stage in the sequence a real author would meet them.
  **Audience:** both, writer-leaning.
- **Why / when:** the linear Get-Started pages teach concepts in isolation; the
  tutorial proves they *compose* into a real artifact — the ecosystem test
  (onboarding-sequence §5).
- **Stages (each ✓ verified end-to-end this session):**
  1. **Prose.** Create `report.wit` with three plain paragraphs (the keeper
     text). Build: `wit build report.wit -o report.html`. Result: three
     `<p>`s in the default theme. *(Grounds: `examples/01-prose.wit`.)*
  2. **A heading.** Add `@h1 The Lamp Keeper h1@` at the top. Rebuild → `<h1>`.
     *(Grounds: `tests/fixtures/18-core-vocab/headings.wit`.)*
  3. **Emphasis.** Mark one word `*bold*` and one `_italic_`. Rebuild →
     `<strong>` / `<em>`. Teach the token-wrap rule (`3*4*5` stays plain) and
     the `*_…_*` vs `_*…*_` asymmetry in a callout. *(Grounds:
     `tests/fixtures/02-emphasis/`.)*
  4. **A list.** Add `@ul` of three `@li` items. Rebuild → `<ul><li>…</li></ul>`.
     Show the `@ol` variant. *(Grounds:
     `tests/fixtures/18-core-vocab/lists.wit`; `@ol` verified.)*
  5. **A table.** Add an inline-CSV table
     `@table |rows [[Site, Status],[Dunmore Head, operational]]| |caption …|`.
     Rebuild → `<table><caption>…<thead>…<tbody>…`. *(Grounds:
     `tests/fixtures/19-tables/inline-csv.wit`.)*
  6. **An image / figure.** Add
     `@figure @img |src ./lamp.png| |alt …| @figcaption A caption. figcaption@
     figure@`. Rebuild → `<figure><img …><…figcaption…></figure>`. Note the
     known cosmetic quirk: the block `@figcaption` is wrapped in a `<p>`
     (verified; FINDINGS C — harmless, flag it so the reader isn't surprised).
     *(Grounds: `tests/fixtures/18-core-vocab/links-and-media.wit`.)*
  7. **Save it in git.** `git init`, `git add report.wit`, `git commit`. The
     point: the *source* is the artifact — a plain, diffable text file.
     (Honest framing: the "watch and recompile" loop is a re-run of the fast
     build; there is no `--watch`.)
  8. **Build to PDF.** `wit build report.wit -o report.pdf` (headless Chrome).
     Show the finished paginated document; note the "no Chrome found" fallback
     and `WIT_CHROME`.
- **Key points:** one construct per stage; every stage builds; the same source
  produced HTML at every step and a PDF at the end; the source lives in git.
- **Common mistakes (woven into the stages they belong to):** unclosed node at
  stage 2/4 (`E_UNCLOSED_NODE`); a comment as the first body line at stage 4/6
  (the collapse bug); a comma inside a table caption value.
- **See also:** every Get-Started page it operationalises; the Playground; the
  Draft-in-git workflow (Write); Troubleshooting.
- **Sources:** `examples/01-prose.wit`, `tests/fixtures/18-core-vocab/*`,
  `tests/fixtures/19-tables/inline-csv.wit`,
  `packages/cli/src/cmd-build.ts` (`emitPdf`), `README.md`.

### Migration — from Markdown — `/docs/migrate/markdown`

- **Purpose:** map every common Markdown construct to its Wit equivalent, then
  show what Wit adds that Markdown can't. **Audience:** writers coming from
  Markdown (the larger of the two migration audiences).
- **Why / when:** the reader already thinks in Markdown; a 1:1 table converts
  fluency instantly, and the "what Wit adds" section justifies the switch.
- **Concept:** Wit is a superset in spirit — everything Markdown expresses,
  plus the structure Markdown forces you into HTML for.
- **Mapping table (every row ✓ verified by build):**

  | Markdown | Wit | Renders | Fixture |
  |---|---|---|---|
  | `# H1` … `###### H6` | `@h1 … h1@` … `@h6 … h6@` | `<h1>`…`<h6>` | `18-core-vocab/headings.wit` |
  | `**bold**` | `*bold*` | `<strong>` | `02-emphasis/basic-bold.wit` |
  | `*italic*` / `_italic_` | `_italic_` | `<em>` | `02-emphasis/basic-italic.wit` |
  | `- item` (ul) | `@ul @li item li@ ul@` | `<ul><li>` | `18-core-vocab/lists.wit` |
  | `1. item` (ol) | `@ol @li item li@ ol@` | `<ol><li>` | `18-core-vocab/lists.wit` (`@ol` verified) |
  | `[text](url)` | `@a |href url| text a@` | `<a href>` | `18-core-vocab/links-and-media.wit` |
  | `![alt](src)` | `@img |src src| |alt alt|` | `<img>` | `18-core-vocab/links-and-media.wit` |
  | `` `code` `` (inline) | `@@code code code@@` (verbatim) or `@code … code@` | `<code>` | `raw-node.test.ts`, `18-core-vocab/inline-marks.wit` |
  | ```` ``` ```` (block) | `@@pre … pre@@` (verbatim) or `@pre … pre@` | `<pre>` | `raw-node.test.ts`, `18-core-vocab/blocks.wit` |
  | `> quote` | `@blockquote … blockquote@` | `<blockquote>` | `18-core-vocab/blocks.wit` |
  | `---` (hr) | `@hr hr@` | `<hr>` | `18-core-vocab/blocks.wit` |
  | `\| a \| b \|` table | `@table |rows [[a,b],[…]]|` | `<table>` | `19-tables/inline-csv.wit` |

- **The key difference to teach up front:** Markdown's inline emphasis is
  *symbolic* (`**`); Wit's is a single mark that **wraps a token**, so
  `file_name` and `3*4*5` stay plain with no escaping (verified;
  `02-emphasis/underscore-in-identifier.wit`, `arithmetic-shapes.wit`). Also:
  Wit uses `@@code` for *verbatim* inline code so `@refs` inside stay literal
  (verified: `@@code map(f, @xs) code@@` → `<code>map(f, @xs)</code>`).
- **What Wit adds that Markdown can't (each ✓ verified):**
  - **Captions on figures** — `@figcaption` inside `@figure`
    (`18-core-vocab/links-and-media.wit`). Markdown has no figure/caption.
  - **Data-driven tables** — `@table |schema [name, status]| |rows @sites|`
    builds a table from a record collection (`19-tables/schema-array.wit`).
  - **Components** — define once, reuse: `#chapter ||number, title||` with
    `::interpolation::` and a `...` body slot
    (`examples/07-defining-nodes.wit`).
  - **Conditionals** — `(if @flag) … (end)` for draft/final variants
    (`12-conditionals`; teach only `is`/`equals`).
  - **Self-organising documents** — a bibliography that gathers entries across
    files via `+#bibliography` additive partials (`08-additive-partials`).
- **Common mistakes (Markdown-muscle-memory, each grounded):** typing `**x**`
  and getting a literal `*` around `x` (bold is single `*`); expecting
  `_*x*_` to nest (it leaves the inner `*` literal — use `*_x_*`; verified,
  FINDINGS C); expecting a raw URL/`~/path` to auto-link or comment (it stays
  prose; `03-comments/path-safety-in-comment.wit`); pasting a Markdown pipe
  table (Wit tables are node calls, not pipe rows).
- **See also:** Nodes & core vocab, Emphasis (Write), Tables (Write), the
  Tutorial, Troubleshooting.
- **Sources:** `tests/fixtures/02-emphasis/*`, `18-core-vocab/*`,
  `19-tables/*`, `examples/07-defining-nodes.wit`,
  `packages/render-html/src/raw-node.test.ts`.

### Migration — from LaTeX — `/docs/migrate/latex`

- **Purpose:** convert LaTeX authors with the *pain → relief* framing, map the
  core constructs, and be **honest about the gaps**. **Audience:** academic /
  LaTeX writers.
- **Why / when:** LaTeX users tolerate enormous ceremony for typeset output;
  the pitch is "keep the semantic structure, drop the preamble."
- **The relief framing (lead with it):** no preamble, no `\documentclass`, no
  `\usepackage` dependency hell, no compile-toolchain — a `.wit` file of prose
  builds to a styled PDF with `wit build file.wit -o file.pdf` (verified). The
  document *is* the content; the theme is batteries-included.
- **Core mappings (each ✓ verified):**

  | LaTeX | Wit | Fixture |
  |---|---|---|
  | `\section{X}` / `\subsection{X}` | `@h1 X h1@` / `@h2 X h2@` | `18-core-vocab/headings.wit` |
  | `\textbf{x}` | `*x*` | `02-emphasis/basic-bold.wit` |
  | `\emph{x}` / `\textit{x}` | `_x_` | `02-emphasis/basic-italic.wit` |
  | `itemize` / `enumerate` | `@ul`/`@ol` of `@li` | `18-core-vocab/lists.wit` |
  | `\begin{figure}…\caption{}\end{figure}` | `@figure @img |src …| |alt …| @figcaption … figcaption@ figure@` | `18-core-vocab/links-and-media.wit` |
  | `\begin{tabular}{…}` | `@table |rows [[…]]|` (or schema form) | `19-tables/inline-csv.wit`, `schema-array.wit` |
  | `\cite{weil}` + `\bibliography` | a `#cite` schema, named `#weil` sources, `@weil_attention` in prose, and a `+#bibliography` that self-gathers | `examples/09-citations.wit`, `08-additive-partials` |
  | `\newcommand{\x}[1]{…}` | `#x ||arg||` def with `::arg::` + `...` | `examples/07-defining-nodes.wit` |

- **The citations story (the LaTeX author's favourite feature, done natively):**
  define a `#cite ||author, title, year, page||` schema once; name each source
  (`#weil: Simone Weil, Gravity and Grace, 1952, Routledge, !!`); cite by
  *idea* in prose (`as @weil_attention argued`); let `+#bibliography` gather
  entries across files. Two words in prose, no `.bib` file, no BibTeX pass
  (`examples/09-citations.wit`).
- **The honest gaps (state plainly — rubric honesty):**
  - **Math.** Wit has **no built-in math typesetting**. Options: embed a
    pre-rendered SVG/MathML via `@@` raw nodes or `@img`; produce math with an
    external renderer wired through `@load` at build time; or pass through with
    `@node(type math)` for a renderer that handles it. There is no `$…$`.
  - **Not a full typesetting system.** No fine page-layout control (floats,
    `\vspace`, custom margins, multi-column typesetting) — PDF is "the default
    HTML theme, paginated by Chrome," not a TeX engine. Wit optimises for
    *semantic structure + clean default output*, not press-ready typography.
  - **Bibliography styles** are author-defined templates (the `#cite` body),
    not a `.bst` ecosystem — powerful but DIY.
- **Common mistakes:** reaching for `$x^2$` — Wit has `@sup`/`@sub`, but a node
  opener needs a word boundary, so `x@sup 2 sup@` does **not** work (a letter
  directly before `@` suppresses the opener; PLAN I.38); `2 @sup nd sup@` →
  `2 <sup>nd</sup>` (verified) but the required space means you can't set a
  *tight* `x²` — reinforcing the "not a math system" gap (use a math image for
  real math). Expecting `\\` line breaks (use `@br br@`, verified → `<br>`);
  putting a comma inside a record field value the way LaTeX tolerates commas in
  args (Wit reads the comma as a field separator — `E_MALFORMED_RECORD`; see
  Troubleshooting).
- **See also:** Citations (Write), Multi-file manuscripts (Write), the Tutorial,
  Troubleshooting, Roadmap (math is not planned).
- **Sources:** `examples/09-citations.wit`,
  `tests/fixtures/08-additive-partials/*`, `18-core-vocab/*`, `19-tables/*`,
  `packages/runtime/src/core-vocab.ts` (`sub`/`sup`), `PLAN.md` §A (non-goals).

### Troubleshooting / Errors & fixes — `/docs/troubleshooting`

A **narrative** learning resource — the errors a newcomer actually hits, each
with **symptom → cause → fix**, in the order they tend to occur. Not the
exhaustive code list (that lives in Reference); this is the friendly companion
that turns a red error into a lesson.

- **Purpose:** convert the CLI's terse `file:line:col E_CODE message` into
  understanding. **Audience:** both, newcomer-leaning.
- **Why / when:** linked from every "build failed" moment and from the Tutorial;
  the first place a stuck reader lands.
- **How Wit reports errors (teach the format once, verified):**
  `path:line:col: E_CODE: message`, e.g.
  `report.wit:3:1: E_MISMATCHED_CLOSE: expected aside@ but got note@`.
  `wit check` reports without building; `wit build` reports the same and
  refuses to emit.
- **The newcomer errors (each ✓ verified this session):**
  1. **Unclosed node** — *Symptom:* `E_UNCLOSED_NODE: unclosed @aside` at the
     opener's line:col. *Cause:* you opened `@aside` and never wrote `aside@`.
     *Fix:* add the matching close; remember the mechanic is a *pair*, not
     indentation. *(`tests/errors/unclosed-node.wit`.)*
  2. **Mismatched close** — *Symptom:*
     `E_MISMATCHED_CLOSE: expected aside@ but got note@` at the *closer's*
     line:col. *Cause:* the close name doesn't match the open. *Fix:* make the
     names match (or fix nesting order — closes are LIFO).
     *(`tests/errors/mismatched-close.wit`.)*
  3. **Unresolved reference** — *Symptom:*
     `E_UNRESOLVED_REFERENCE: Unresolved reference @glossary`. *Cause:* you used
     `@glossary` but no `#glossary` def (or core-vocab name) exists — often a
     typo or a missing `reference ./file.wit`. *Fix:* define it, fix the
     spelling, or add the reference. *Nuance to teach:* an unknown **name**
     errors, but a missing **field on a resolved base** (`@keeper.tenure`) is
     *lenient* — it renders `<span class="wit-unresolved">` and the build
     succeeds (verified). So "my build passed but the text looks wrong" is
     usually a bad field path, not a bad name.
     *(`tests/errors/bad-reference.wit`; the shipped
     `examples/16-additive-partials/master.wit` currently *fails* this way on
     `@tocrow` — a real repo bug, FINDINGS B-2.)*
  4. **The comment-in-body bug** — *Symptom:* no error, but a heading or block
     inside a node comes out wrongly nested inside a `<p>` (verified:
     `@aside` with a leading `~` comment produced
     `<aside><p><h3>Heading</h3></p>…`). *Cause:* a `~` comment as the *first*
     line of a container body, with no blank line after it, collapses the
     following block(s). *Fix:* put a blank line after the comment (verified
     clean output). *(FINDINGS C-1 — a known parser bug, framed as a gotcha
     with a one-keystroke fix.)*
  5. **Malformed record from a comma in a value** — *Symptom:*
     `E_MALFORMED_RECORD: record field missing key` or `E_BARE_FIELD: bare
     field`. *Cause:* record fields are comma-separated, and there is **no
     quoting/escaping of commas inside `{ }` values** — `{ title - Attention,
     Perception }` reads "Perception" as a second, keyless field. *Fix:* escape
     the comma as `\,`, restructure to avoid it, or use a form-fill
     (`key: value` lines, where commas are safe). *(`tests/errors/
     comma-in-record-value-bare-word.wit`; the shipped
     `examples/15-references/master.wit` fails exactly here, FINDINGS B-1.)*
  6. **`@@` / `@@@` raw-node gotchas** — *Symptom:*
     `E_UNCLOSED_RAW_NODE: unclosed @@pre (expected pre@@)`. *Causes & fixes:*
     the close for `@@name` is `name@@` (two `@`), and for the **frozen**
     `@@@name` it is `name@@@` (three `@`) — verified. Inside `@@` bodies the
     content is **verbatim**: `@refs` stay literal, `{{path}}` *does*
     interpolate (verified: `@@style … {{accent}} …`), but inside `@@@` frozen
     bodies even `{{path}}` stays literal (verified). *Fix:* match the fence
     width; use `@@` when you want interpolation, `@@@` when you want it frozen.
     *(`packages/render-html/src/raw-node.test.ts`.)*
  7. **Form-fill line isn't `key: value`** — *Symptom:*
     `E_MALFORMED_FORM_FIELD: form-fill body line is not <key>:<value>`.
     *Cause:* inside a form-fill body a line without a `:` (e.g. plain prose)
     isn't a field. *Fix:* make it `key: value`, or use a different invocation
     form (pipes / record-arg). *(`tests/errors/form-fill-malformed-line.wit`.)*
  8. **Multi-word key access truncation** — *Symptom:* `@keeper.years at post`
     renders `<span class="wit-unresolved">@keeper.years</span> at post`.
     *Cause:* a space terminates an access segment, so only `years` is the key
     and "at post" falls back to prose. *Fix:* use single-word or snake_case
     keys (`years_at_post`) which fuzzy-match. *(Verified; FINDINGS C — note it
     contradicts a comment in `examples/12-accessing-data.wit`.)*
  9. **`contains` (and other missing operators)** — *Symptom:* a conditional
     silently misfires — `(if @tags contains urgent)` printed the literal
     "contains urgent" *and* the body (verified). *Cause:* conditionals support
     **only** `is` / `equals` (synonyms) and bare-truthy — no `contains`,
     `==`, `<`, `>`, `and`, `or`, `not`. *Fix:* restructure to an `is`/`equals`
     check or a truthy flag. *(FINDINGS D.)*
- **Cross-reference:** the **full error-code catalogue** lives in Reference —
  the enumerated codes are `E_UNCLOSED_NODE`, `E_MISMATCHED_CLOSE`,
  `E_UNCLOSED_COMMENT`, `E_UNCLOSED_PAREN`, `E_UNCLOSED_DEFINITION`,
  `E_UNCLOSED_RAW_NODE`, `E_EMPTY_PIPE`, `E_UNRESOLVED_REFERENCE`,
  `E_MISSING_FIELD`, `E_MISSING_REFERENCE_FILE`, `E_CIRCULAR_REFERENCE`,
  `E_PARTIAL_SHAPE_MISMATCH`, `E_BARE_FIELD`, `E_TYPE_MISMATCH`,
  `E_MALFORMED_RECORD`, `E_MALFORMED_FORM_FIELD` (PLAN I.124 + `tests/errors/`).
  Loc convention: opener-location for unclosed; closer-location for mismatched;
  reference-site for unresolved; field-name for missing-field (PLAN I.125).
- **Key points:** most errors point at an exact `line:col`; the mechanic is
  pairs (not indentation); `check` before you `build`; a *passing* build with
  wrong-looking text usually means a lenient unresolved field path.
- **See also:** Reference (error catalogue), Nodes & core vocab, Records/Data
  (Write), the two migration guides.
- **Sources:** `tests/errors/*` (`.wit` + `.err.json` pairs),
  `packages/render-html/src/raw-node.test.ts`, `PLAN.md` I.124–I.125,
  [FINDINGS.md](FINDINGS.md) B, C, D.

### Concept explainers with diagrams — `/docs/concepts/*`

Two visual explainers that pair with the mental-model and architecture pages.
Each **describes the diagram to draw** (this is a plan, not the asset).

#### The layers — `/docs/concepts/layers`

- **Purpose:** make "prose is the default, structure is opt-in" *visual*.
  **Audience:** both. Pairs with `/docs/start/mental-model`.
- **Diagram to draw:** a stacked/pyramid diagram, widest at the base, five
  bands bottom-to-top:
  - **L0 Prose** (widest — "most of every document") — paragraphs, `_italic_`,
    `*bold*`, `~` comments.
  - **L1 Nodes** — `@name … name@`, core vocab.
  - **L2 Definitions** — `#name`, captures `::x::`, body slot `...`.
  - **L3 Data** — `{ records }`, `[ collections ]`, `@x.field` access.
  - **L4 Logic** (narrowest — "last resort") — `(if)`, `(each)`, `<% %>`.
  Annotate with an arrow up the side labelled "climb only as far as this
  document needs," and mark L4 with "escape hatch, not Turing-complete."
- **Examples to show (✓ verified):** one small document annotated to show which
  line lives in which layer (prose line, an `@aside`, a `#epigraph:` def, a
  `@x.field`, an `(if)`).
- **Key points:** the base carries the weight; each layer up is rarer; you never
  pay for a layer you don't use.
- **See also:** The mental model, Design principles.
- **Sources:** `packages/runtime/src/core-vocab.ts`, `PLAN.md` §A/§C,
  `examples/07-defining-nodes.wit`.

#### The pipeline — `/docs/concepts/pipeline`

- **Purpose:** make `parse → resolve → expand → render` concrete for
  tool-builders. **Audience:** developer. Pairs with `/docs/project/architecture`.
- **Diagram to draw:** a left-to-right flow (the README ASCII diagram, drawn):
  `source.wit → [lex] → [parse] → [resolve] → [expand] → [render] → HTML/MD/PDF`.
  Under each box, the **artifact** it produces (chars → tokens → raw AST →
  bound AST → expanded AST → output string) and the **package** that owns it
  (`parser`, `parser`, `runtime`, `runtime`, `render-*`). Add two "exit ramps"
  showing where tools stop early: **LSP/formatter** tap out after
  parse/resolve; **renderers** attach at the expanded-AST boundary. A side note:
  source locations `{ file, line, col, length }` ride every stage.
- **Examples to show (✓ verified):** the same tiny `#greet` + `@h1` doc shown
  at three stages via `wit tour` (the tree shows
  `nodeDef #greet [shape: single-line]`, `nodeUse @greet`, `nodeUse @h1`);
  contrast the raw vs expanded tree.
- **Key points:** each stage is independently testable and replaceable;
  renderers are pluggable; determinism and source locations are structural.
- **Resolution-timing callout:** the three tiers — eager (pipe values,
  conditional operands), expansion-time (def bodies re-resolve per use),
  snapshot (an `(each)` freezes its collection at loop entry) — PLAN §C.
- **See also:** Architecture, Extending, Embedding (Build).
- **Sources:** `README.md` §Architecture, `PLAN.md` §C,
  `packages/cli/src/cmd-tour.ts`, `packages/runtime/src/index.ts`.

---

## FINDINGS relevant to a newcomer (frame honestly, don't paper over)

These [FINDINGS.md](FINDINGS.md) items touch the onboarding surface directly.
Each page above already routes around them; collected here so the section owner
sees them in one place:

- **Version drift (A, 🔴).** `wit --version` → `0.1.0`, CHANGELOG → `0.1.0`, but
  a `v0.2.0` tag + later commits exist. The Install smoke test and the Changelog
  page must not promise `0.2.0`. → Reconcile before launch.
- **Core-vocab count (A, 🔴).** It's **52 + `node`**, not 47. Every page
  references the *list*, never a number.
- **No `--watch` (D, 🟡).** The writer "compile-in-seconds loop" is a re-run of
  the fast build or a shell loop. First-document, Tutorial, and Roadmap all say
  so plainly; Roadmap lists `--watch` as a near-term delight candidate.
- **Prose interpolation doesn't exist (D, 🟡).** `{{path}}` is literal in prose
  and live *only* in `@@` bodies; `::name::` is a def-body capture hole only;
  data-in-prose is `@name.field`. The mental-model page states this as a common
  mistake.
- **Conditionals are `is`/`equals` only (D, 🟡).** No `contains`/comparisons/
  boolean ops. Mental-model and Troubleshooting both flag it.
- **Broken shipped examples (B, 🔴).** `examples/15-references/master.wit`
  (`E_MALFORMED_RECORD`, comma-in-value) and
  `examples/16-additive-partials/master.wit` (`E_UNRESOLVED_REFERENCE @tocrow`)
  do **not** build (verified). Do not seed the Playground or Tutorial from them
  until repaired; Troubleshooting cites them as real-world instances.
- **Comment-in-body bug (C, 🟠).** Taught as a gotcha in Nodes, the Tutorial,
  and Troubleshooting, with the blank-line fix.
- **Emphasis asymmetry & multi-word key truncation (C, 🟠).** Both surfaced in
  Emphasis/Tutorial and Troubleshooting with the working alternative.
- **Stale prose sources (E, ⚪).** `docs/spec.md`,
  `packages/skill/skill/reference/*`, and
  `docs/literal-nodes-and-components.md` carry unshipped constructs. The Spec
  and Extending pages say "verify against code/fixtures before lifting."

---

## Page list for this section

**Get Started — `/docs/start`** (6)
1. What is Wit? — `/docs/start/what-is-wit`
2. Your first document — `/docs/start/first-document`
3. Install — `/docs/start/install`
4. Nodes & core vocabulary — `/docs/start/nodes`
5. The mental model — `/docs/start/mental-model`
6. Choose your path — `/docs/start/choose-your-path`

**Playground** (1)
7. Playground — `/playground`

**Project — `/docs/project`** (6)
8. Design principles — `/docs/project/principles`
9. Architecture — `/docs/project/architecture`
10. Roadmap — `/docs/project/roadmap`
11. How to add a node / renderer — `/docs/project/extending`
12. The spec — `/docs/project/spec`
13. Changelog — `/docs/project/changelog`

**Cross-cutting onboarding (new)** (7)
14. Extended tutorial — `/docs/tutorial` (8 stages, one document → PDF)
15. Migration — from Markdown — `/docs/migrate/markdown`
16. Migration — from LaTeX — `/docs/migrate/latex`
17. Troubleshooting / Errors & fixes — `/docs/troubleshooting`
18. Concept: The layers — `/docs/concepts/layers`
19. Concept: The pipeline — `/docs/concepts/pipeline`

**20 page specs total.** Reference (error catalogue, per-node detail,
glossary, cheatsheet) and the Write/Build track pages are owned by the sibling
content-design files; this section links into them but does not specify them.
