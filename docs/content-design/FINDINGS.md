# Content-Design Findings — code/doc drift & bugs surfaced

While designing the docs, each section agent **verified behaviour by building
real `.wit` files** against the current CLI. That process surfaced ~20 issues.
They are all one-directional: **the code is (mostly) correct; the prose docs,
comments, and a couple of examples have drifted or broken.** This is the
fix-before-ship list.

Legend: 🔴 blocks/embarrasses a docs launch · 🟠 real bug to fix or document ·
🟡 honesty/framing · ⚪ don't-transcribe (stale source).

## A. Version & count drift (quick fixes)

- 🔴 **Version drift.** `packages/cli/src/bin.ts` `VERSION = '0.1.0'` and
  `CHANGELOG.md` say `0.1.0`, but there's a `v0.2.0` tag + later feature
  commits. `wit --version` will disagree with the docs. → Bump + reconcile
  CHANGELOG.
- 🔴 **Core vocab is 52 names (53 with `node`), not 47.** The `47` in
  `packages/runtime/src/index.ts`'s own doc-comment is stale (predates
  `div`/`span`/`row`/`col`/`cite`); README + CHANGELOG inherited it. → Fix the
  comment; docs reference the list, never a number.

## B. Broken committed examples (repair)

- 🔴 **`examples/15-references/master.wit` does not build** →
  `E_MALFORMED_RECORD`. A multi-line `#book` record has a comma *inside* a
  field value (`subtitle - Attention, Perception, and the Moral Life`), and
  commas separate record fields. (See limitation C-2.)
- 🔴 **`examples/16-additive-partials/master.wit` does not build** →
  `E_UNRESOLVED_REFERENCE @tocrow`: chapters emit `@tocrow` but no `#tocrow`
  def exists. → Add the def or remove the emit.
- 🔴 **`examples/13-conditionals.wit` does not build** →
  `E_UNCLOSED_DEFINITION` (a single-line record bearing an `@` and a comma).
  *(Found during the deepening pass — the numbered "curriculum" examples rot too.)*
- 🔴 **`examples/14-iteration.wit` does not build** →
  `E_UNRESOLVED_REFERENCE @toc` (emits `@toc` with no `#toc` def).
  **So four committed examples are red: 13, 14, 15-references, 16-additive-partials.**
- 🟡 **`examples/thesis/`** builds, but `#chapter`/`#section` templates emit
  literal ATX (`## …`) instead of real `<h2>`, and `<% … wordCount() %>`
  renders empty via the CLI path. Recipes steer authors to real `@h1`/`@h2`.

## C. Parser bugs & limitations (fix, or document as known limits)

- 🟠 **Comment-as-first-child-in-container-body bug.** A `~comment` as the
  first line inside a container body (no blank line after) collapses the
  following block(s) into one `<p>` — e.g. an `@h2` gets wrongly nested. A
  blank line after the comment avoids it. Hit repeatedly this session
  (grids, examples panels). *High-value parser fix.*
- 🟠 **Record values can't contain commas** — no quoting/escaping; a comma in
  a field value is read as a field separator (cause of B-1). Consider quoted
  values or escapes.
- 🟠 **Emphasis nesting is asymmetric.** `*_x_*` → `<strong><em>x</em></strong>`
  works; `_*x*_` leaves the inner `*` literal. Docs recommend `*_…_*`.
- 🟠 **Multi-word key access:** a space terminates an access segment, so
  `@keeper.years at post` reads only `years` — contradicts the comment in
  `examples/12-accessing-data.wit`. Only space-free keys reach multi-word
  values (via canonical-key collapse).
- 🟡 **`@figure` wraps a block `@figcaption` in `<p>`** — cosmetic; harmless
  but not clean semantics. (Same auto-paragraph family as the comment bug.)
- 🟡 **`@@table` (frozen) doesn't resolve `@ref` rows** — use plain `@table`.
- ⚪ **Fixture 26 (`26-all-param-forms/showcase.wit`) genuinely fails**
  (`E_UNCLOSED_NODE`) — the intentional paused-work marker. The "all param
  forms are equivalent" showcase is aspirational; each form passes in its own
  fixture. Do not present fixture 26 as working.

## D. Missing features (framing / candidates)

- 🟡 **No `wit build --watch`.** The headline writer loop ("compile a draft in
  seconds") is honestly *re-run the fast build* / a shell loop. `wit fmt -w`
  writes in place but there's no watcher. → Frame truthfully; a `--watch` is a
  small, high-delight add for the writer story.
- 🟡 **`{{path}}` does NOT interpolate in prose** — it renders literally. It's
  live **only inside `@@` raw-node bodies**. Data-in-prose is `@name.field`;
  `::name::` is a capture hole inside a def body only. Docs must not claim
  prose `{{}}`/`::name::` interpolation.
- 🟡 **Conditionals have two operators only: `is` / `equals` (synonyms).** No
  `==`, `<`, `>`, `not`, `and`, `or`, and **no `contains`** (the skill uses
  `contains`; it doesn't exist).

## E. Stale prose sources — do NOT transcribe

- ⚪ **`docs/spec.md`** — massively out of date. Deprecate; the Reference
  section becomes the spec.
- ⚪ **`packages/skill/skill/reference/*`** — good for idioms/genres but
  predates recent features and carries unshipped/unverified constructs:
  `contains`, `##name … name##` component defs, `{{…}}` in prose/strings,
  `@name: … !!` form-fill (paused), `resolve({ readFile: async })` (real API
  is synchronous `fileReader`), `body` mis-called `content`, and speculative
  `lh.target` / `node.params.injectId` / `h.kind` / `::loopvar.field::`.
  Verify against code before lifting any prose.
- ⚪ **`docs/literal-nodes-and-components.md`** — mixes shipped `@@`/`@@@`
  literals with roadmap features (`##` defs, prose `{{}}`). Split shipped from
  roadmap.
- ⚪ **Skill `15-common-document-genres.md`** cites example files that don't
  exist (`readme.wit`, `blog-post.wit`, `decision-record.wit`).

## Suggested order

1. **B + A** (broken examples, version/count) — cheap, and they'd embarrass a
   launch.
2. **C-1 comment bug** — the one real parser fix with broad payoff.
3. **D framing** — write the affected pages honestly now; consider `--watch`
   and record-comma escaping as near-term features.
4. **E** — treat as untrusted throughout; the Reference (built from code +
   fixtures) supersedes them.
