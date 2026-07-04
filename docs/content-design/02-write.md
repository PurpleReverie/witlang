# Content design — Writer track (`/docs/write`)

Planning doc for the **Write** door of the Wit docs site. One section of the
overall plan in [`../plan/README.md`](../plan/README.md). This is a *content
plan* — what each page covers, the depth bar it must hit, and the verified
facts it rests on — not final prose.

**Audience:** writers keeping a manuscript in git and compiling drafts. Every
page is authored in Wit (`.wit`), compiled at build time. Assume the reader
arrived from *Get Started* and can already write a paragraph and run
`wit build`.

**Grounding.** Every fact, example, and rendered result below was confirmed by
**building the real fixture / snippet against the current CLI** on 2026-07-05
(`node packages/cli/dist/bin.js build <file> --fragment`), not the stale
`docs/spec.md`. Rendered fragments quoted here are literal build output. Where
a page teaches an edge, it cites the fixture (path) that pins it.

**Depth bar (per [`AUTHORING-STANDARD.md`](AUTHORING-STANDARD.md)).** Every page
below is specified to: **Concept** (one line) · **Why/when** · **Progressive
examples** basic→realistic→edge, each verified with its rendered result · **Every
option/edge**, each cited to a fixture · **Common mistakes** grounded in
[`FINDINGS.md`](FINDINGS.md) and the builds this agent ran · **See also** ·
**Sources**.

**Teaching order lives elsewhere.** The canonical, dependency-checked learner
sequence is [`onboarding-sequence.md`](onboarding-sequence.md) §4 (shared spine
+ Writer path) — the **single source of order**. The page specs below are a
*per-page catalog* (reference detail), **not** the teaching sequence, so their
on-page order is not authoritative. Two consequences of the dependency graph the
catalog must honour: **Multi-file precedes Citations and the full Draft
workflow** (both depend on it), and *Prose / Emphasis / Comments / Using nodes*
are **deeper revisits** of Get-Started spine pages, not first contact.

**Cross-track boundaries.** The writer pages stay light on machinery. The full
parameter-form matrix, data/records, conditionals, iteration, additive
partials, interpolation internals, and scripting live in **Guides**
(`/docs/guides`); link out rather than duplicating. Exhaustive per-node syntax
+ CLI flags live in **Reference** (`/docs/reference`).

**Honesty flags carried on every affected page** (from `FINDINGS.md`, all
re-verified this pass):
- `wit --version` reports `0.1.0` while the repo is past `v0.2.0` — do not print
  a version number in docs; describe behaviour.
- There is **no `wit build --watch`.** The "instant recompile" story is
  *re-run the fast build* (or a `while`/`entr` loop). Only `wit fmt -w` writes
  in place.
- **`{{path}}` interpolates only inside `@@` raw-node bodies/strings**, never in
  normal prose. Data-in-prose is `@name.field`; `::cap::` is a def-body capture
  hole only.

---

## 1. Paragraphs, prose & whitespace — `/docs/write/prose`

**Concept.** Plain text *is* a valid Wit document. A blank line starts a new
paragraph; nothing else is required to write.

**Why / when.** The ground floor. A writer can produce an entire essay in
nothing but prose and blank lines, and Wit will never hijack their punctuation
or line leaders into structure. Reach past prose (marks, nodes) only when you
want a specific semantic element.

**Progressive examples (verified).**

- *Basic* — one paragraph (`00-lexical/single-paragraph.wit`,
  `01-prose/single-paragraph.wit`):
  `The keeper had not spoken aloud in eleven days.` →
  `<p>The keeper had not spoken aloud in eleven days.</p>`.
- *Realistic* — three paragraphs split by blank lines
  (`00-lexical/multi-paragraph.wit`, `01-prose/multi-paragraph.wit`) →
  three `<p>…</p>` in a row. Delete the blank lines to watch them merge.
- *Edge* — a paragraph whose lines *look* like Markdown but aren't
  (`01-prose/markdown-ish-leaders.wit`): lines opening `>`, `*`, `-`, `1.` each
  render as literal prose in their own paragraph —
  `<p>&gt; she said…</p><p>* the asterisk…</p><p>- and the hyphen…</p><p>1. The
  first time…</p>`. Wit has no blockquote/bullet/ordered-list block syntax, so
  the leaders survive verbatim (`>` HTML-escaped to `&gt;`).

**Paragraph & line rules — every edge, cited.**

- **Blank line = paragraph break.** One or more consecutive blank lines split
  paragraphs (`01-prose/blank-line-splits.wit`). Multiple blank lines do not
  add empty paragraphs.
- **A "blank line" is empty *or* whitespace-only.** A line containing only
  spaces and a tab still separates paragraphs — `whitespace-only-line.wit`
  renders two `<p>`, not one (`00-lexical/whitespace-only-line.wit`).
- **Soft line break: a lone newline is preserved, not a `<br>`.** A single `\n`
  inside a paragraph stays a newline in the HTML source; because HTML collapses
  whitespace it reads as one flowing paragraph with a space
  (`01-prose/soft-line-break.wit` → `<p>…eleven days,\nand his silence…</p>`).
  The companion `blank-line-splits.wit` has the *same words* with a blank line
  and yields two paragraphs — diff the pair to see what one extra `\n` buys.
- **Line length carries no meaning.** A single 500-character physical line is
  one paragraph; there is no column limit (`01-prose/long-single-line.wit`).
- **Newline conventions are normalised.** CRLF (`windows-newlines.wit`),
  bare-CR classic-Mac (`mac-newlines.wit`), and a mix in one file
  (`mixed-newlines.wit`) all normalise to `\n` before paragraph-splitting, so
  each produces the same output as its LF twin (`00-lexical/*`).
- **Leading whitespace is cosmetic.** Leading spaces/tabs are preserved in the
  AST/HTML source but collapsed by the browser, so indented prose reads
  normally (`00-lexical/leading-whitespace.wit`, `tabs-vs-spaces.wit`).
- **File edges are forgiving.** Zero bytes → an empty document, no error
  (`empty.wit` → `<article class="wit-doc"></article>`). A single word is the
  minimal positive case (`minimal-non-empty.wit` → `<p>Wit</p>`). A missing
  trailing newline (`no-trailing-newline.wit`) and three trailing newlines
  (`multiple-trailing-newlines.wit`) both render the identical single paragraph
  as `trailing-newline.wit` — no phantom paragraphs.
- **Punctuation is yours.** Em-dash, apostrophe, colon, semicolon are never
  reserved in prose (`01-prose/punctuation-heavy.wit`). `&`, `<`, `>`, `%`
  render safely (HTML-escaped where needed).
- **Quotes round-trip verbatim** — no smart-quote substitution. `"…"` →
  `&quot;…&quot;`, `'…'` → `&#39;…&#39;` (HTML-escaped but visually straight
  quotes) (`01-prose/quoted-prose.wit`).
- **Numbers that look syntactic stay prose.** `1970.` (year-then-period),
  `5*6*7` (arithmetic), `3.14` (decimal) are all literal
  (`01-prose/numbers-and-arithmetic-shapes.wit`).
- **URLs are safe; a mid-word `@` is NOT** (see mistakes)
  (`01-prose/urls-in-prose.wit`).
- **A tilde attached to a token is prose.** `~/Documents`
  (`01-prose/tilde-slash-mid-line.wit`) and `~6 hours`
  (`01-prose/tilde-digit-mid-line.wit`) never open a comment mid-line.

**Common mistakes / gotchas.**

- **A literal `@` in prose is dangerous.** `keeper@example.org` does **not**
  round-trip: `keeper@` is read as a node *close* token, so the email is
  mangled — the paragraph splits and `keeper@example.` disappears
  (`01-prose/urls-in-prose.wit`; reproduced isolated this pass:
  `Email me at keeper@example.org today.` →
  `<p>Email me at </p><p>example.org today.</p>`). A leading `@handle` instead
  raises `E_UNRESOLVED_REFERENCE`. **`@code … code@` does not rescue it** —
  `@code keeper@example.org code@` fails with `E_MISMATCHED_CLOSE`. There is no
  backslash escape for `@`. *Fix for now: avoid a bare `@` glued to letters —
  rephrase ("keeper at example.org"), or split the address so no `word@word`
  sits in prose.* **Safe:** `@` before a space (`Meet me @ home`) or a digit
  (`@2024`).
- **`#` glued to a letter starts a definition and eats the line.** `#hashtag is
  trending.` renders as **empty** (parsed as a `#hashtag` def); even mid-line
  `C#sharp` corrupts output. Safe: `#42`, `# note` (space after), `C# ` (space
  after). Prefer wording that keeps `#` off a following letter.
- **A literal `|` in prose is swallowed** — it opens param state, so
  `5 | 10 | 15` renders `5  10  15`. The `\|` escape is only reliable *inside*
  node params/bodies, not top-level prose. Avoid a bare pipe in running text.
- **Don't wrap prose in `@p`.** Prose auto-paragraphs; an explicit
  `@p … p@` double-wraps to `<p><p>…</p></p>` (verified via
  `18-core-vocab/sectioning.wit`). Only reach for `@p` when a container needs a
  paragraph you can target/attribute.

**See also.** Emphasis; Comments; Using nodes; Escapes/Reference for the
param-context `\|` `\:` `\"` `\{` `\}` `\,` escapes.

**Sources.** `tests/fixtures/00-lexical/*` (all 13), `tests/fixtures/01-prose/*`
(all 12); `packages/parser/src/lexer.ts` (`lineStartsStructural`,
`tryBackslashEscape`, `tryEmphasis`); `render-html` paragraph flattening.

---

## 2. Emphasis — `/docs/write/emphasis`

**Concept.** Two inline marks and only two: `_italic_` → `<em>`, `*bold*` →
`<strong>`.

**Why / when.** Restraint by design. Because a mark must *wrap a token*,
ordinary prose punctuation can never trigger emphasis by accident — so you get
italics and bold without escaping your arithmetic, filenames, or apostrophes.

**Progressive examples (verified).**

- *Basic* — `a _miracle_ and` → `a <em>miracle</em> and`
  (`02-emphasis/basic-italic.wit`); `a *miracle* and` →
  `a <strong>miracle</strong> and` (`02-emphasis/basic-bold.wit`).
- *Realistic* — interleaved in one paragraph
  (`02-emphasis/mixed-prose-and-marks.wit`): `polished the _lens_ … the *flame*
  held` → `polished the <em>lens</em> … the <strong>flame</strong> held`.
- *Edge* — combining the two (`02-emphasis/combined-bold-italic.wit`): see
  below.

**Every option / edge, cited.**

- **Marks wrap a *token*.** A mark char flanked by word chars on the inside
  stays literal: `5*6*7` (`02-emphasis/arithmetic-shapes.wit`) and
  `snake_case_word` (`02-emphasis/underscore-in-identifier.wit`) render plain.
- **Apostrophe after a mark is safe.** `_keeper_'s` closes the italic on the
  second `_`; the `'s` is plain: `<em>keeper</em>&#39;s`
  (`02-emphasis/apostrophe-after-italic.wit`).
- **Empty marks stay literal.** `__` and `**` with nothing between render as
  two underscores / two asterisks, not emphasis
  (`02-emphasis/empty-marks.wit`).
- **Marks at a paragraph edge work.** `_Alone_,` at the start and `*dawn*.` at
  the end each emphasise correctly; a mark cannot span a blank line
  (`02-emphasis/marks-at-paragraph-boundary.wit` →
  `<p><em>Alone</em>, …</p>…<p>… <strong>dawn</strong>.</p><p><strong>Morning</strong> …</p>`).
- **Combining is asymmetric — put bold *outside*.** `*_silently_*` →
  `<strong><em>silently</em></strong>` (works). `_*aloud*_` →
  `<em>*aloud*</em>` — the inner `*` stays **literal**
  (`02-emphasis/combined-bold-italic.wit`, one file with both orderings). The
  reliable "bold *and* italic" form is `*_…_*`.
- **Node forms exist too.** `@em … em@`, `@strong … strong@`, and `@code …
  code@` are the explicit-node equivalents (see *Inline marks reference*),
  useful when a phrase already contains the mark char.

**Common mistakes / gotchas.**

- Expecting `_*x*_` to bold+italic — it doesn't; use `*_x_*` (asymmetry pinned
  by `combined-bold-italic.wit`; FINDINGS C).
- Trying to italicise a `snake_case` identifier — it won't fire, by design; use
  `@em snake_case em@` if you truly need it emphasised.
- Reaching for a `` `code` `` backtick — Wit has no Markdown code span in prose;
  inline code is `@code … code@` (`18-core-vocab/inline-marks.wit`).

**See also.** Prose; Inline marks reference (`@code`, `@u`, `@s`, `@sub`,
`@sup`, `@mark`, `@small`, `@cite`); Using nodes.

**Sources.** `tests/fixtures/02-emphasis/*` (all 9);
`packages/parser/src/lexer.ts` (`tryEmphasis`,
`hasUnclosedEmphasisInParagraph`); `render-core-vocab.ts`.

---

## 3. Inline marks reference — `/docs/write/inline-marks`

**Concept.** The node-form inline marks beyond `_`/`*`: semantic inline
elements you call by name.

**Why / when.** When you need code, strike-through, sub/superscript, a
highlight, small print, a hard line break, or a work title — none of which have
a two-character mark.

**Progressive examples (verified).**

- *Basic* — `@code lh.foo() code@` → `<code>lh.foo()</code>`
  (`18-core-vocab/inline-marks.wit`).
- *Realistic* — a run mixing several: `@u underline u@`, `@s strike s@`,
  `@sub sub sub@`, `@sup sup sup@`, `@mark highlight mark@`, `@small fine print
  small@`, `@cite Moby-Dick cite@` → `<u>underline</u>`, `<s>strike</s>`,
  `<sub>sub</sub>`, `<sup>sup</sup>`, `<mark>highlight</mark>`, `<small>fine
  print</small>`, `<cite>Moby-Dick</cite>` (verified this pass).
- *Edge* — a hard break: `Line one @br br@ line two.` → `Line one <br> line
  two.` `@br` is self-closing (write `@br br@`; degrades to a space in
  Markdown).

**Every element (cite: `18-core-vocab/inline-marks.wit` + core-vocab list).**
`@em`→`<em>`, `@strong`→`<strong>`, `@code`→`<code>`, `@u`→`<u>`, `@s`→`<s>`,
`@sub`→`<sub>`, `@sup`→`<sup>`, `@mark`→`<mark>` (theme highlights yellow),
`@small`→`<small>`, `@br`→`<br>`, `@cite`→`<cite>`. All are *inline-context*:
they flatten a single wrapping `<p>`, so `@em word em@` is `<em>word</em>` not
`<em><p>word</p></em>`.

**Common mistakes.** Forgetting the closing `@` (`em@`) — an unclosed inline
node raises `E_UNCLOSED_NODE`. Using `@code` to hold an email/`@` — it fails
(`E_MISMATCHED_CLOSE`), because `word@` inside is read as a close.

**See also.** Emphasis; Using nodes; theme mark colour in Styling.

**Sources.** `packages/runtime/src/core-vocab.ts` (names);
`render-core-vocab.ts` (`INLINE_CONTEXT_TAGS`, `flattenIfInline`);
`theme.ts` (`mark`, `small`, `code` styling).

---

## 4. Comments — `/docs/write/comments`

**Concept.** Author notes invisible to every renderer. Two forms: line comment
`~ …` and inline/block comment `~~ … ~~/`.

**Why / when.** TODOs, editorial asides, "verify this date," reminders — kept
in the source, never in the output (any target).

**Progressive examples (verified).**

- *Basic* — a line comment above a fact
  (`03-comments/line-leading-comment.wit`): the `~ remember to verify…` line
  vanishes; `<p>The lighthouse was commissioned in 1847.</p>` remains.
- *Realistic* — an inline aside mid-sentence
  (`03-comments/inline-comment.wit`): `The bell ~~ TODO: confirm year ~~/ rang
  on the hour.` → `<p>The bell  rang on the hour.</p>` (the comment is gone).
- *Edge* — a multi-line block spanning lines
  (`03-comments/multi-line-block-comment.wit`): three indented lines between
  `~~` and `~~/` vanish; the following paragraph survives.

**Every rule / edge, cited.**

- **`~ ` (tilde + whitespace) at line start** opens a line comment to
  end-of-line (`line-leading-comment.wit`).
- **`~~` always opens** an inline/block comment (even at line start); **`~~/`
  closes** it. Bare `~~` inside an open block is *content*, usable as a divider
  (`03-comments/internal-double-tilde-in-block.wit`, which is one all-comment
  line → empty output).
- **Only the exact `~~/` closes.** Shell paths inside a comment are safe:
  `~/Documents/notes` and `~/.bashrc` inside `~~ … ~~/` do not close it
  (`03-comments/path-safety-in-comment.wit` → empty output).
- **An empty comment is legal.** `~~ ~~/` → nothing
  (`03-comments/empty-comment.wit`).
- **Tilde-as-prose discriminator.** `~5` (approx), `~/Documents` (path),
  `x ~ y` (approx-equal) are all prose, not comments
  (`03-comments/tilde-discriminator-baseline.wit`).

**Common mistakes / gotchas.**

- **A line comment *between two prose lines* glues them with no space.**
  `1847.\n~ note\nHe served…` renders `…1847.He served…` — the comment consumes
  its own line *and* the surrounding newlines
  (`03-comments/comment-between-prose-lines.wit`). *Fix: leave a blank line on
  each side of a standalone note.*
- **A comment as the first line of a container body collapses the block after
  it** (FINDINGS C-1): put a blank line after a comment that leads a `@section`
  / grid body, or the next `@h2` gets wrongly nested into a paragraph.
- **Forgetting the space after `~`.** `~note` (no space) is *not* a line
  comment — a bare `~` glued to a token is prose punctuation.

**See also.** Prose (tilde discriminator); Using nodes (container bodies).

**Sources.** `tests/fixtures/03-comments/*` (all 8);
`packages/parser/src/lexer.ts` (`tryLineComment`, `tryBlockComment`);
FINDINGS C-1.

---

## 5. Headings & document structure — `/docs/write/headings-structure`

**Concept.** Six heading levels `@h1`–`@h6`, plus optional HTML-semantic
sectioning wrappers (`article`, `section`, `header`, `footer`, `nav`, `aside`,
`main`) and generic containers (`@div`, `@span`).

**Why / when.** Title sections; give a long document a semantic skeleton for
accessibility, print outlines, and reuse. Sectioning is *optional* structure,
not required.

**Progressive examples (verified).**

- *Basic* — `@h1 The Lamp Keeper h1@` / `@h2 Chapter One h2@` / `@h3 A Quiet
  Morning h3@` → `<h1>The Lamp Keeper</h1><h2>Chapter One</h2><h3>A Quiet
  Morning</h3>` (`18-core-vocab/headings.wit`). Headings are inline-context, so
  the body is flattened (no inner `<p>`).
- *Realistic* — a sectioned article (`18-core-vocab/sectioning.wit`):
  `@article > @header > @h1`, `@section > @p …`, `@footer > @small` →
  `<article><header><h1>Article Title</h1></header><section>…</section><footer><small>Published
  2024.</small></footer></article>`.
- *Edge* — generic containers with attributes: `@div |class card| … div@` →
  `<div class="card"><p>…</p></div>`; inline `@span |id x| … span@` →
  `<span id="x">…</span>` (verified this pass; `@div`/`@span` accept only `id`
  and `class`).

**Every option / edge, cited.**

- **Six levels** `h1`–`h6` (core-vocab list; fixture exercises `h1`–`h3`).
- **Sectioning elements** `article` / `section` / `header` / `footer` / `nav` /
  `aside` / `main` each map to the same-named HTML tag
  (`18-core-vocab/sectioning.wit` covers article/header/section/footer;
  nav/aside/main follow the same generic path — verify each snippet before
  publishing).
- **Indentation is for the writer's eye.** Nesting comes from open/close
  pairing, not columns; `wit fmt` re-indents to the structural nesting.
- **`@div`/`@span`** carry only `id`/`class` (renderer allowlist in
  `coreAttrs`).

**Common mistakes / gotchas.**

- **Wrapping section prose in `@p` double-wraps** — `@section` already
  paragraph-wraps its text children, so `@p A first paragraph. p@` yields
  `<p><p> A first paragraph. </p></p>` (`18-core-vocab/sectioning.wit`). Write
  bare prose inside `@section`.
- **A leading comment inside a `@header`/`@section` body** can collapse the
  following heading (FINDINGS C-1) — blank line after the comment.

**See also.** Using nodes; Layout; Styling (heading sizes/weights).

**Sources.** `tests/fixtures/18-core-vocab/headings.wit`, `sectioning.wit`;
`core-vocab.ts`; `render-core-vocab.ts` (`renderGeneric`, `flattenIfInline`,
`coreAttrs`); `theme.ts` (h1–h6 scale).

---

## 6. Lists — `/docs/write/lists`

**Concept.** Bulleted (`@ul`), numbered (`@ol`), and definition (`@dl`) lists.

**Why / when.** Any enumerated or term/definition content — works-cited,
glossaries, step lists.

**Progressive examples (verified).**

- *Basic* — `@ul` with three `@li` (`18-core-vocab/lists.wit`) →
  `<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>`.
  Convert `@ul`→`@ol` for `<ol>` (numbers auto).
- *Realistic* — an MLA works-cited `@ol` with `@em` inside each item
  (`scratch/essay/essay.wit` lines 48–53): `@li … @em Pediatrics em@, vol. 134…
  li@` → `<ol><li>… <em>Pediatrics</em>, vol. 134…</li>…</ol>`.
- *Edge* — a definition list (verified this pass): `@dl` / `@dt Fresnel lens
  dt@` / `@dd A stepped lens… dd@` → `<dl><dt>Fresnel
  lens</dt><dd>A stepped lens…</dd></dl>`.

**Every option / edge.**

- `@ul`/`@ol` + `@li`; `@dl` + `@dt`/`@dd`.
- **Items are inline-context** — `@li`, `@dt`, `@dd` flatten their single
  paragraph, so a one-line item has no inner `<p>` but can still hold marks,
  links, and nested lists (`INLINE_CONTEXT_TAGS`).
- Nesting a list inside an `@li` works (place a `@ul … ul@` in the item body).

**Common mistakes.** Putting the bullet character yourself (`- item`) — that's
literal prose (`01-prose/markdown-ish-leaders.wit`); use `@li`. Forgetting the
`@ul`/`@ol` wrapper — a lone `@li` has no list context.

**See also.** Using nodes; Emphasis (marks inside items); Citations (works-cited
`@ol`).

**Sources.** `tests/fixtures/18-core-vocab/lists.wit`; `scratch/essay/essay.wit`
(`@ol`); `core-vocab.ts`; `render-core-vocab.ts` (`INLINE_CONTEXT_TAGS`);
`theme.ts` (list spacing, `dl`/`dt`/`dd`).

---

## 7. Quotes, code blocks & rules — `/docs/write/quotes-asides`

**Concept.** Block-level containers: `@blockquote` (pulled quotes / epigraphs),
`@aside` (sidebars / editorial notes, also usable inline), `@pre`
(preformatted), `@hr` (divider).

**Why / when.** Epigraphs, pulled quotations, code/verbatim blocks, section
dividers, marginal notes.

**Progressive examples (verified).**

- *Basic* — a quoted passage (`18-core-vocab/blocks.wit`): `@blockquote A
  quoted passage worth remembering. blockquote@` →
  `<blockquote><p>  A quoted passage worth remembering.</p></blockquote>`
  (body wrapped in `<p>`; leading indent collapses in the browser).
- *Realistic* — the Dekker epigraph (`scratch/essay/essay.wit` line 7):
  `@blockquote "Sleep is the golden chain…" — Thomas Dekker blockquote@` renders
  as a `<blockquote>` above the opening paragraph.
- *Edge* — an aside used **both ways** (verified this pass): inline `The keeper,
  @aside a rare inline note, aside@ kept watch.` →
  `<p>The keeper, <aside> a rare inline note, </aside> kept watch.</p>`; the same
  node on its own line → `<aside><p> A standalone block aside. </p></aside>`.
  You write it identically — the renderer places it.

**Every option / edge, cited.**

- `@blockquote` wraps its body in a paragraph; the theme adds a left rule and
  muted colour.
- `@pre` for preformatted/verbatim (`18-core-vocab/blocks.wit`:
  `@pre function example() { return 1; } pre@` →
  `<pre><p>  function example() { return 1; }</p></pre>`, mono theme).
- `@hr hr@` is self-closing → `<hr>` (`18-core-vocab/blocks.wit`).
- `@aside` works as a standalone block or woven inline (same syntax).

**Common mistakes.** Expecting `@pre` to preserve exact indentation as
significant whitespace — it renders monospaced but the body still goes through
paragraph wrapping; for code with meaningful layout, verify the build. Using a
bare `>` for a quote — that's literal prose (`01-prose/markdown-ish-leaders.wit`);
use `@blockquote`.

**See also.** Emphasis; Using nodes; Styling (blockquote rule, `pre`
background).

**Sources.** `tests/fixtures/18-core-vocab/blocks.wit`;
`examples/04-using-nodes.wit`; `scratch/essay/essay.wit`; `render-core-vocab.ts`;
`theme.ts` (`blockquote`, `pre`, `hr`).

---

## 8. Tables — `/docs/write/tables`

**Concept.** A table without wrestling pipes: three authoring inputs (inline
CSV, schema + rows, a `@ref` collection), plus header/caption controls and
multi-line cells. `@table` centres by default.

**Why / when.** Any tabular data — and, uniquely, a table straight from loaded
or defined records with columns derived from the keys.

**Progressive examples (verified).**

- *Basic* — inline CSV, row 0 is the header (`19-tables/inline-csv.wit`):
  `@table |rows [[Client Hours, COUN603, COUN704, TOTAL], [One to One, 62.75,
  41.25, 104], [Couple, 0.75, 0, 0.75]]| |caption Practicum Hours|` →
  `<table><caption>Practicum Hours</caption><thead><tr><th>Client
  Hours</th>…</thead><tbody>…</tbody></table>`.
- *Realistic* — a table from a defined record collection
  (`19-tables/schema-array.wit`): `#sites: [{ name - Dunmore Head, status -
  operational }, …] !!` then `@table |schema [name, status]| |rows @sites|` →
  header `name`/`status`, one row per record. Columns come from the schema keys.
- *Edge* — a loaded CSV tabled with **no schema** (`examples/load-demo/report.wit`
  line 29): `@table |rows @downloads|` derives columns from the collection's
  first record's keys (see *Rendering / @load*).

**Every form / option / edge, cited (definitive: `render-table.ts`).**

1. **Inline CSV** — `|rows [[…],[…]]|`; row 0 is the header
   (`inline-csv.wit`).
2. **Positional schema** — `|schema [k1, k2]| |rows …|`; keys double as labels
   (`schema-array.wit` → headers `name`/`status`).
3. **Labelled schema** — `|schema { k - Label, … }|`; label is the display text
   (`schema-record.wit`: `{ name - Site, status - Status }` → headers
   `Site`/`Status`).
4. **`@ref` collection rows** — `|rows @collection|`; when a `#def`/`@load`
   collection of records is passed, columns come from record keys if no schema
   (`schema-array.wit`, `report.wit`).
5. **`|caption …|`** — adds a `<caption>` (centred, muted) (`inline-csv.wit`).
6. **Header control** — `|header false|` suppresses the header row
   (`no-header.wit` → no `<thead>`); `|header N|` uses row *N* as the header and
   drops rows 0..N (verified: `|header 1|` on 4 rows → header = row 1, body =
   rows 2–3); `|header [a,b,c]|` sets an explicit header and keeps every row as
   body (verified this pass).
7. **Empty** — `@table table@` (no params) → `<table></table>`
   (`empty.wit`).
8. **Multi-line cells** — wrap a cell value in `! … !` to hold line breaks *and*
   commas (which otherwise separate cells): `[Kāwanatanga, ! The practice of good
   governance, spanning multiple lines. !]` keeps the comma inside one `<td>`
   (`multiline-cell.wit`).
9. **Centred by default** — the theme sets `margin: 1em auto` on `table`; the
   renderer emits no `text-align` (number alignment is CSS's job).

**Common mistakes / gotchas.**

- **`@@table` (frozen literal) does NOT resolve `@ref` rows.** Verified this
  pass: `@@table |schema […]| |rows @sites| table@@` →
  `<table></table>` (empty), while plain `@table` with the same params renders
  fully. Use plain `@table` for any data-backed table (FINDINGS C).
- **A comma inside a cell value splits it into two cells** — there is no record
  comma-escape (FINDINGS C-2). Use the `! … !` cell wrapper
  (`multiline-cell.wit`) when a cell must contain a comma.
- **Positional-schema headers are the raw keys** (lowercase `name`/`status`) —
  reach for the labelled `{ k - Label }` form when you want display headers.

**See also.** Rendering (`@load` for live data); Components (defining record
collections); Guides *Data & records* for the record/collection syntax.

**Sources.** `packages/render-html/src/render-table.ts` (definitive:
`readRowsParam`, `readSchemaParam`, `pickHeader`, `deriveSchemaFromRecords`);
`tests/fixtures/19-tables/*` (all 6); `examples/load-demo/report.wit`;
`theme.ts` (table borders/centring); FINDINGS C.

---

## 9. Images & figures — `/docs/write/images`

**Concept.** Place, size, align, and caption an image with writer-friendly
params — no CSS. `@img` for a bare image; `@figure` + `@figcaption` for a
captioned one.

**Why / when.** Charts, diagrams, photos. Sizing and alignment compile to
self-contained inline styles that work in HTML, `--raw`, and PDF alike.

**Progressive examples (verified).**

- *Basic* — `@img |src ./lamp.png| |alt The keeper's lamp|` →
  `<img src="./lamp.png" alt="The keeper&#39;s lamp">`
  (`18-core-vocab/links-and-media.wit`).
- *Realistic* — a captioned figure (`scratch/essay/essay.wit` lines 29–32):
  `@figure > @img |size medium| > @figcaption Figure 1. … figcaption@` →
  `<figure><img … style="max-width:380px;height:auto"><p><figcaption>Figure 1.
  …</figcaption></p></figure>`, centred by theme.
- *Edge* — the four presets side by side (`examples/load-demo/report.wit` lines
  33–51): small/medium/large/full, each in its own `@figure`.

**Every size preset & align semantic, cited (`render-core-vocab.ts`
`resolveSize`/`layoutStyle`; verified exact styles this pass).**

| `|size …|` | emitted style | behaviour |
|---|---|---|
| `small` | `max-width:220px;height:auto` | *cap* width |
| `medium` | `max-width:380px;height:auto` | *cap* width |
| `large` | `max-width:600px;height:auto` | *cap* width |
| `full` | `width:100%;height:auto` | *fill* the column |
| `240` (number) | `max-width:240px;height:auto` | *cap* at N px |
| `50%` | `width:50%;height:auto` | *fill* that fraction |

Presets and px values **cap** width (never upscale); `full` and `%` **fill**.

**Align** (`|align left/center/right|`) — semantics differ per element:
- On `@img`: block-positions the image. `center` →
  `display:block;margin-left:auto;margin-right:auto`; `right` →
  `display:block;margin-left:auto`; `left` →
  `display:block;margin-right:auto`.
- On `@figure`: aligns the figure's *contents* (image + caption together) →
  `text-align:left|center|right`.
- `|size|` and `|align|` compose: `|size medium| |align center|` →
  `max-width:380px;height:auto;display:block;margin-left:auto;margin-right:auto`.
- A **capped `@figure`** (size on the figure) auto-centres its box
  (`margin-left/right:auto`); figures + captions centre by default (theme
  `figure { text-align:center }`).

**PDF & relative paths.** Keep image paths relative. For PDF, `wit build -o
x.pdf` renders through headless Chrome from a temp file, so the build injects a
`<base href="file://…/<document-dir>/">` into `<head>` to anchor relative asset
paths back to the document's directory — so `./assets/downloads.svg` resolves
(`cmd-build.ts` `emitPdf`). HTML output resolves relative to wherever the `.html`
sits.

**Common mistakes / gotchas.**

- **A block `@figcaption` gets wrapped in `<p>`** inside `@figure`
  (`<p><figcaption>…</figcaption></p>`) — cosmetic, harmless (FINDINGS C).
- Expecting a preset to *enlarge* a small source — presets only cap; use `full`
  or a `%` to fill.
- Alt text with an apostrophe is fine (HTML-escaped); alt text is a param, so
  keep it on one `|alt …|`.

**See also.** Layout (image beside text); Links & media; Rendering (PDF).

**Sources.** `render-core-vocab.ts` (`renderImg`, `renderFigure`,
`layoutStyle`, `resolveSize`, `SIZE_PRESETS`); `cmd-build.ts` (PDF `<base
href>`); `18-core-vocab/links-and-media.wit`; `examples/load-demo/report.wit`;
`scratch/essay/essay.wit`; `theme.ts` (`figure`/`figcaption`).

---

## 10. Layout — rows & columns — `/docs/write/layout`

**Concept.** Put blocks side by side with an invisible flex band: `@row`
contains `@col`s. No floats, no CSS.

**Why / when.** Image beside text, two-column commentary, a table next to a
note. Degrades gracefully — columns wrap (stack) on narrow widths and in print.

**Progressive examples (verified — `examples/load-demo/report.wit` lines
57–67).**

- *Basic / realistic* — image in a fixed column, prose filling the rest:
  `@row > @col |size 260| > @img …, @col > prose` →
  `<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin:1.2em
  0"><div style="flex:0 0 260px;min-width:0"><img …></div><div style="flex:1 1
  0;min-width:0">macOS leads this cycle…</div></div>`.
- *Edge* — two bare `@col`s (both fill) give equal columns.

**Every option / edge, cited.**

- `@row` → the flex band `ROW_STYLE` (gap 1.5rem, `flex-wrap:wrap`).
- `@col |size …|` → `flex:0 0 <basis>` where basis is a preset
  (small/medium/large → 220/380/600px), a number (px), `Npx`, or `N%`
  (`resolveColumnBasis`).
- **Bare `@col`** → `flex:1 1 0;min-width:0` (fills remaining space).
- Columns **wrap** when the row is too narrow (mobile/print safe).

**Common mistakes / gotchas.**

- A `@row` placed after prose in an auto-paragraph context gets wrapped in
  `<p>` (`<p><div style="…flex…">…</div></p>`) — technically invalid nesting
  browsers tolerate; separate the row with blank lines to keep it a top-level
  block.
- `@col` outside a `@row` still renders a `<div>` but without the flex context —
  always pair them.

**See also.** Images; Headings & structure (`@div`); Genres (data report).

**Sources.** `render-core-vocab.ts` (`renderRow`, `renderColumn`,
`resolveColumnBasis`, `ROW_STYLE`); `core-vocab.ts`;
`examples/load-demo/report.wit`.

---

## 11. Links & media — `/docs/write/links-media`

**Concept.** Hyperlinks (`@a`) and embedded audio/video (`@audio`, `@video`).

**Why / when.** In-text links; playable media in HTML output (degrades in
print/Markdown).

**Progressive examples (verified).**

- *Basic* — `Visit @a |href https://example.org| Example a@.` →
  `<p>Visit <a href="https://example.org">Example</a>.</p>`
  (`18-core-vocab/links-and-media.wit`). Link text is the body; the URL is a
  param.
- *Realistic* — a link opening in a new tab: `@a |href …| |target _blank| … a@`
  → `<a href="…" target="_blank">…</a>` (`renderAnchor`).
- *Edge* — media with controls (verified this pass): `@audio |src ./bell.mp3|
  |controls true| audio@` → `<audio src="./bell.mp3" controls></audio>`;
  `@video |src ./tour.mp4| |controls true| video@` → `<video src="…"
  controls></video>`.

**Every option / edge, cited.**

- `@a` params: `href` (defaults to `#` if omitted), optional `target`
  (`renderAnchor`).
- `@audio` / `@video`: `src`, and the `controls` attribute (`renderMedia`).

**Common mistakes / gotchas.**

- **The `controls` flag needs a value.** Bare `|controls|` is parsed as a
  *positional* param (value "controls", name `null`) and emits **no** attribute;
  write `|controls true|` (any value works) to get `controls` (verified — the
  plan's old "bare flag" note was wrong).
- A literal `@` in link text or an email inside prose breaks (see Prose) — for a
  `mailto:` link, put the address in the `href` param, not in running prose.

**See also.** Images (also `links-and-media.wit`); Prose (`@` gotcha);
Rendering (media in Markdown/PDF).

**Sources.** `render-core-vocab.ts` (`renderAnchor`, `renderMedia`,
`paramFlag`); `tests/fixtures/18-core-vocab/links-and-media.wit`;
`core-vocab.ts`.

---

## 12. Using nodes — `/docs/write/using-nodes`

**Concept.** One syntax calls *any* node: `@name … name@` opens and closes; the
middle is the body. The most important "click" page in the track.

**Why / when.** Everything from `@h1` to your own `@chapter` is the same shape;
learn it once.

**Outline / examples.**

1. `@name … name@` opens and closes; the name must match on both ends.
2. **Inline vs block is the renderer's call, not yours** — identical syntax
   (block `@aside … aside@` vs inline `@highlight … highlight@`, from
   `examples/04-using-nodes.wit`; verified inline/block aside above).
3. **Bare reference `@name`** — no body, drops a value in
   (`04-nodes-use/bare-reference`).
4. **Empty / self-closing** — `@hr hr@`, `@br br@`
   (`04-nodes-use/empty-body`).
5. **Nodes nest** (`@chapter > @scene/@aside`,
   `04-nodes-use/nested-same-name`).
6. **Parameters, briefly** — `|key value|` pipes, record-arg `{ k: v }`, colon
   scatter `@x k:v x@`; full matrix → Guides *Parameters*.

**Common mistakes.** Mismatched close (`@h2 … h3@` → `E_MISMATCHED_CLOSE`);
unclosed node (`E_UNCLOSED_NODE`); a bare `@word` that isn't defined →
`E_UNRESOLVED_REFERENCE`.

**See also.** All of §3–§11 (every element is a node); Components (define your
own); Guides *Parameters — every form*.

**Sources.** `examples/04-using-nodes.wit`; `tests/fixtures/04-nodes-use/*`
(owned by that section's agent — keep specs, verify snippets before publishing);
`render-core-vocab.ts`. *(Fixtures outside this agent's set — treat as
cross-reference.)*

---

## 13. Reusable pieces (components) — `/docs/write/components`

**Concept.** Define your own nodes once, use them everywhere: `#name: value`
(single-line), `#name: … !!` (value block), `#name … name#` (block def with a
`...` body slot).

**Why / when.** Chapter templates, citation formats, callouts — the writer's
route to consistency.

**Outline / examples.** `#year: 1923` used as `@year`
(`examples/08-single-line-defs.wit`); a value block `#epigraph: … !!`; a block
def `#chapter ||number, title|| … ::number:: … chapter#` with a `@chapter |number
I| … chapter@` call (`examples/07-defining-nodes.wit`). `#` defines, `@` uses; a
colon (`#name:`) means "no body slot"; `||caps||` names params, `::cap::` drops
them in; `...` is where the invocation body renders.

**Common mistakes.** Commas inside a record field value break the record
(FINDINGS C-2); `::name::` works only inside a def body, never in prose
(FINDINGS D); a `#word` line at file top can silently be read as a def — mind
the `#`-at-line-start rule from Prose.

**See also.** Using nodes; Citations; Multi-file; Guides *Defs & captures*.

**Sources.** `examples/08-single-line-defs.wit`, `07-defining-nodes.wit`;
`tests/fixtures/07-definitions/*` *(cross-reference — verify before publishing)*.

---

## 14. Citations & references — `/docs/write/citations`

**Concept.** The signature Wit pattern: citations that read as *ideas*, defined
once and woven inline, plus a bibliography from the same template.

**Why / when.** Academics/students who want readable prose and a consistent
reference list.

**Outline.** (1) the clutter problem; (2) define `#cite` once (captures +
format); (3) name sources (`#weil`, `#berger`); (4) argument map
(`#weil_attention: @weil p. 42`); (5) prose where a citation is two words
(`as @weil_attention argued`); (6) bare refs when no locator is needed; (7) a
`#ref` bibliography template called once per source.

**Verified-forms caution.** Use the forms from `examples/09-citations.wit`:
record-arg fields use `key - value`; form-fill bodies use `key: value`. The
skill's `04-citations.md` uses `@cite { key: value }` — treat as idiom, not
gospel (FINDINGS E).

**See also.** Components; Multi-file (shared sources); Guides
*Citation styles & footnotes*.

**Sources.** `examples/09-citations.wit` (primary — verify);
`packages/skill/skill/reference/04-citations.md` (idiom only).
*(Fixtures outside this agent's set.)*

---

## 15. The draft workflow ⭐ — `/docs/write/draft-workflow`

**Concept.** A manuscript in git, compiled to a reader PDF in seconds,
versioned and diff-able. The page that sells the language.

**Why / when.** The headline writer story: text source, shareable output, real
version control.

**Outline / examples (verified where noted).**

1. Manuscript is plain text (`manuscript.wit`) in a git repo.
2. Compile a reader copy: `wit build manuscript.wit -o draft.pdf` → `wrote
   draft.pdf` (verified — PDF written via headless Chrome, 29 KB for a tiny
   doc).
3. Send the PDF; keep writing.
4. Every draft is diff-able — show a one-paragraph `git diff` (prose, not opaque
   `.docx` bytes).
5. Versioned drafts — tag/branch, compare v1 vs v2.
6. Normalise before committing: `wit fmt manuscript.wit -w` → `formatted
   manuscript.wit` (or `unchanged …`); re-indents to structural nesting,
   requires the file to parse (verified — `cmd-fmt.ts`, `format`).
7. Other outputs from the same source → forward-ref *Rendering*.
8. Real artifact: `scratch/essay/essay.wit` → `essay.pdf`;
   `examples/load-demo/report.wit` → `report.pdf`.

**Caveats to honour.**
- **No `--watch`.** "Instant recompile" = re-run the fast build, or a
  `while`/`entr`/`ls | entr` loop (verified: `bin.js` has `parse`, `check`,
  `fmt`, `build`, `tour` — no watch).
- **PDF needs a local Chrome/Chromium** (or `WIT_CHROME`); otherwise the build
  errors with guidance to render `.html` and convert
  (`cmd-build.ts` `findChrome`).

**See also.** Rendering; Multi-file; Styling.

**Sources.** `packages/cli/src/cmd-build.ts` (PDF, `-o` inference, Chrome
discovery, `<base href>`); `packages/cli/src/cmd-fmt.ts`;
`packages/cli/src/bin.ts` (subcommand list — no watch); `scratch/essay/`;
`examples/load-demo/`.

---

## 16. Multi-file manuscripts — `/docs/write/multi-file`

**Concept.** Split a book into chapter files and assemble them in order with
`reference ./path.wit`.

**Why / when.** Sane per-chapter editing and diffs; shared vocabulary across a
long manuscript.

**Outline.** Why split → `reference ./file.wit` imports another file's
defs/data/nodes → shared `shared/schema.wit` + `shared/sources.wit` → wrap each
chapter as `#chapter_one … chapter_one#` → `master.wit` references parts and
emits them in order (`@chapter_one chapter_one@`) → assembly order = order of
uses → bibliographies accumulate (`+#…`, brief; → Guides).

**Honesty flag.** `examples/15-references/master.wit` currently **fails to
build** (`E_MALFORMED_RECORD` — a comma inside a `#book` field value, FINDINGS
B-1) and `examples/16-additive-partials/master.wit` fails
(`E_UNRESOLVED_REFERENCE @tocrow`, FINDINGS B-2). Fix or rebuild these before
citing them as working examples; `examples/thesis/` builds but has its own
caveats (FINDINGS B-3).

**See also.** Components; Citations; Draft workflow; Guides *Additive partials*.

**Sources.** `examples/15-references/*`, `examples/thesis/*`;
`resolver-files.ts`; FINDINGS B-1/B-2/B-3. *(Fixtures outside this agent's
set.)*

---

## 17. Rendering: HTML / Markdown / PDF — `/docs/write/rendering`

**Concept.** Turn a `.wit` into the format you need; know which to reach for.

**Why / when.** Web/email/embed (HTML), GitHub/portable (Markdown),
reader/print (PDF).

**Progressive examples (verified this pass).**

- *Basic* — default `wit build file.wit` emits a **complete self-contained
  styled document** to stdout: `<!doctype html><html lang="en"><head>… inlined
  default theme …<title>file</title></head>…`. The `<title>` is the source
  filename.
- *Realistic* — `wit build file.wit --fragment` emits just `<article
  class="wit-doc">…</article>` for embedding.
- *Edge* — Markdown: `wit build doc.wit --format md` → `# Hi` / `A **bold**
  line.`; a full essay renders GFM including a pipe table
  (`| Group | … |`) and `> quote` (verified on `scratch/essay/essay.wit`).

**Every option / edge, cited (`cmd-build.ts`).**

- **`-o out.ext`** infers format: `.html`/`.htm` → HTML, `.md`/`.markdown` →
  Markdown, `.pdf` → PDF; an unknown extension errors
  `E_UNKNOWN_OUTPUT_FORMAT`.
- **`--format html|md|pdf`** overrides inference (e.g. force `.md` to a
  non-`.md` path).
- **`--raw`** (HTML/PDF) swaps the batteries-included theme for a mechanical
  reset only (verified: same document shell, `rawThemeCss` body).
- **`--fragment`** = bare `<article>` (no `<head>`/theme).
- **PDF** renders the same document through headless Chrome with a `<base
  href>`; needs Chrome/Chromium or `WIT_CHROME`.
- **`@load` external data** — `@load <alias> load@` names data produced at build
  time by a program wired in `wit.sources.json`; pass `--sources
  wit.sources.json --allow-exec` (and `--env .env`; `env` is a built-in source).
  Verified: `report.wit` builds its `@team`/`@downloads`/`@meta`/`@env` from
  live sources into lists, a table, and headings.

**Which one when** — small decision table: HTML (share/embed), Markdown
(GitHub/portable, media & `@br` degrade to text/space), PDF (reader/print, needs
a browser).

**Common mistakes.** Expecting the default output to be a fragment — it's a
finished document; use `--fragment` to embed. Expecting audio/video to work in
Markdown/PDF — HTML-only.

**See also.** Draft workflow; Styling; Images (PDF base-href); Guides *External
data*.

**Sources.** `packages/cli/src/cmd-build.ts`; `packages/render-markdown/src/*`;
`packages/runtime/src/data-loader.ts`, `packages/cli/src/data-sources.ts`;
`examples/thesis/README.md`; `bin.ts`.

---

## 18. Styling — `/docs/write/styling`

**Concept.** Control the look: the batteries-included theme, small `@@style`
tweaks over it, or `--raw` for full art direction.

**Why / when.** A good-looking document with zero styling; an escape hatch for
brand colours/fonts; a blank canvas when you want total control.

**Every option / edge, cited (`theme.ts`, `cmd-build.ts`).**

- **Default theme** = a Word/Google-Docs look: Calibri/Carlito sans stack, 11pt
  body, an 8.5in "page" (`--wit-page`) with 1in padding (`--wit-pad`) on a
  light-grey canvas, `prefers-color-scheme` dark variant, and print/`@page`
  rules (1in margin, avoid breaking headings/figures/tables). Verified: default
  build inlines this CSS into `<head>`.
- **Small tweaks** — override a CSS variable via `@@style .wit-doc {
  --wit-accent: #2b6; } style@@`; it cascades *over* the theme.
- **`{{path}}` interpolation** into an `@@` raw body pulls a value from a
  record (e.g. `{{theme.accent}}`). **Live only inside `@@` bodies/strings, not
  prose** (FINDINGS D).
- **`--raw`** — `rawThemeCss` is a mechanical reset only (box model, no body
  margin, responsive media); you style everything via `@@style` + wrapping
  nodes (`@div`/`@section`). Verified: `--raw` document shell contains only the
  reset.
- The **same CSS drives HTML and PDF** (default theme or your `--raw` `@page`
  rules).

**Common mistakes.** Expecting `{{}}`/`::name::` to interpolate in prose — they
don't (FINDINGS D). Overriding a variable outside `.wit-doc` scope — the theme
scopes rules to `.wit-doc`.

**See also.** Rendering (`--raw`); Headings & structure (`@div` wrappers);
Guides *Literal nodes & `@@`*.

**Sources.** `packages/render-html/src/theme.ts` (`defaultThemeCss`,
`rawThemeCss`); `cmd-build.ts` (`htmlOptions`, `--raw`);
`docs/universal-render-target.md`, `docs/literal-nodes-and-components.md`
(`@@`/`{{}}` — split shipped from roadmap).

---

## 19. Document genres — `/docs/write/genres`

**Concept.** Starting shapes for real documents — which features carry each
genre. Bridge to Recipes.

**Genres → load-bearing features + a verified skeleton.**

- **Essay / article** — prose + headings + `@blockquote` epigraph + a `@table` +
  a `@figure` + `@ol` works-cited. `scratch/essay/essay.wit` is the strongest
  verified single-file example (builds to HTML, Markdown, and PDF).
- **Thesis / long-form** — multi-file + shared schema + accumulating
  bibliography (`examples/thesis/*`; honour FINDINGS B/C caveats).
- **Data report** — `@load` → `@table`/`@figure`/`@row`
  (`examples/load-demo/report.wit`, verified end-to-end).
- **Letter** — title block with `@br`, date, salutation, body, sign-off —
  author fresh and build-verify (do not lift from the skill).

**Honesty flag.** `packages/skill/skill/reference/15-common-document-genres.md`
cites example files that don't exist in this repo (`readme.wit`,
`blog-post.wit`, `decision-record.wit`) — use for *shape ideas only*; build and
verify every snippet (FINDINGS E).

**See also.** Every §1–§18 (genres are combinations); Recipes (full worked
builds).

**Sources.** `scratch/essay/essay.wit`; `examples/thesis/*`;
`examples/load-demo/report.wit`.

---

## 20. Writer Cheatsheet — `/docs/write/cheatsheet`

**Concept.** One screen: every writer construct at a glance. **All entries below
are verified build output.** Purpose: the page a writer keeps open.

**Marks & inline (in prose).**

```
_italic_        → <em>            *bold*          → <strong>
*_both_*        → bold+italic     (never _*both*_ — inner * stays literal)
@code x code@   → <code>          @br br@         → <br>
@u @s @sub @sup @mark @small @cite …name@         → same-named inline tag
```

**Headings & structure.**

```
@h1 …h1@ … @h6 …h6@              six levels
@article @section @header        @footer @nav @aside @main  (semantic wrappers)
@div |class card| … div@         @span |id x| … span@       (generic + id/class)
```

**Blocks.**

```
@blockquote …blockquote@   quote/epigraph      @pre …pre@   preformatted
@aside …aside@   note (inline OR block)         @hr hr@      divider
```

**Lists.**

```
@ul  @li … li@  ul@             bullets
@ol  @li … li@  ol@             numbered (auto)
@dl  @dt term dt@ @dd def dd@  dl@   definitions
```

**Tables.**

```
@table |rows [[H1,H2],[a,b]]| |caption Cap|        inline CSV (row 0 = header)
@table |schema [k1,k2]| |rows @records|            positional schema
@table |schema { k - Label }| |rows [[…]]|         labelled schema
|header false|   |header 2|   |header [X,Y]|        header control
[…, ! multi-line, comma-safe cell !]                multi-line cell
                                                     (use @table, NOT @@table, for @ref rows)
```

**Images & layout.**

```
@img |src a.png| |alt …| |size small|medium|large|full|240|50%| |align center|left|right|
@figure  @img |size medium|  @figcaption Fig 1. figcaption@  figure@
@row  @col |size 260| … col@  @col … col@  row@    side-by-side (col wraps on narrow)
```

**Links & media.**

```
@a |href https://x| |target _blank| text a@
@audio |src a.mp3| |controls true| audio@   @video |src v.mp4| |controls true| video@
```

**Comments (never rendered).**

```
~ line comment to end of line              (needs the space after ~)
~~ inline or multi-line comment ~~/         (only ~~/ closes; ~/ paths are safe)
```

**Build commands.**

```
wit build doc.wit                 styled HTML document → stdout
wit build doc.wit --fragment      bare <article> for embedding
wit build doc.wit -o out.html     write HTML (ext infers format)
wit build doc.wit -o out.md       Markdown (GitHub)
wit build doc.wit -o out.pdf      PDF (needs Chrome/Chromium or WIT_CHROME)
wit build doc.wit --raw           reset-only base; you style everything
wit build report.wit --sources wit.sources.json --allow-exec --env .env    @load data
wit fmt doc.wit -w                re-indent in place
wit check doc.wit                 validate (exit non-zero on error)
```

**Prose safety one-liners.** Punctuation, quotes, `1970.`, `5*6*7`, `3.14`, `>`
`-` `*` `1.` leaders, `~5`, `~/path`, `x ~ y` are all literal prose. **Avoid**:
a literal `@` glued to letters (breaks emails), a `#` glued to a letter at line
start (starts a def), a bare `|` in running text (swallowed).

**Sources.** All §1–§18, all verified this pass.

---

## Fixture coverage checklist

Every `.wit` file in this agent's six folders, mapped to the page(s) that teach
or note it. (Reference/idiom `_notes.md` and `.json` snapshots excluded.)

### `tests/fixtures/00-lexical/` (13) → §1 Prose (whitespace & newlines)
- [x] `empty.wit` — empty input → empty document, no error
- [x] `minimal-non-empty.wit` — minimal positive case (`<p>Wit</p>`)
- [x] `single-paragraph.wit` — one paragraph baseline
- [x] `multi-paragraph.wit` — blank line separates → 3 paragraphs
- [x] `single-paragraph.wit` / `multi-paragraph.wit` — paragraph rules
- [x] `trailing-newline.wit` — normal single trailing LF
- [x] `no-trailing-newline.wit` — EOF without newline accepted
- [x] `multiple-trailing-newlines.wit` — no phantom paragraphs
- [x] `leading-whitespace.wit` — leading spaces cosmetic
- [x] `tabs-vs-spaces.wit` — leading tab/space/mixed preserved, collapsed by HTML
- [x] `whitespace-only-line.wit` — whitespace-only line still splits paragraphs
- [x] `windows-newlines.wit` — CRLF normalised
- [x] `mac-newlines.wit` — bare-CR normalised
- [x] `mixed-newlines.wit` — LF/CRLF/CR mix normalised; soft breaks preserved

### `tests/fixtures/01-prose/` (12) → §1 Prose
- [x] `single-paragraph.wit` — baseline
- [x] `multi-paragraph.wit` — blank-line split
- [x] `soft-line-break.wit` — lone `\n` preserved (renders as space)
- [x] `blank-line-splits.wit` — contrast pair to soft-line-break
- [x] `long-single-line.wit` — line length is not a signal
- [x] `markdown-ish-leaders.wit` — `>` `*` `-` `1.` stay literal prose
- [x] `numbers-and-arithmetic-shapes.wit` — `1970.` `5*6*7` `3.14` literal
- [x] `punctuation-heavy.wit` — em-dash/apostrophe/colon/semicolon literal
- [x] `quoted-prose.wit` — quotes verbatim, no smart quotes
- [x] `urls-in-prose.wit` — URLs safe; mid-word `@` mangles (Common mistakes)
- [x] `tilde-slash-mid-line.wit` — `~/Documents` prose
- [x] `tilde-digit-mid-line.wit` — `~6 hours` prose

### `tests/fixtures/02-emphasis/` (9) → §2 Emphasis
- [x] `basic-italic.wit` — `_x_` → `<em>`
- [x] `basic-bold.wit` — `*x*` → `<strong>`
- [x] `mixed-prose-and-marks.wit` — interleave
- [x] `combined-bold-italic.wit` — asymmetry (`*_x_*` works, `_*x*_` literal)
- [x] `apostrophe-after-italic.wit` — `_x_'s` safe
- [x] `arithmetic-shapes.wit` — `5*6*7` literal
- [x] `underscore-in-identifier.wit` — `snake_case_word` literal
- [x] `empty-marks.wit` — `__` / `**` literal
- [x] `marks-at-paragraph-boundary.wit` — marks at start/end of paragraph

### `tests/fixtures/03-comments/` (8) → §4 Comments
- [x] `line-leading-comment.wit` — `~ ` line comment vanishes
- [x] `inline-comment.wit` — `~~ … ~~/` inline vanishes
- [x] `multi-line-block-comment.wit` — multi-line block vanishes
- [x] `internal-double-tilde-in-block.wit` — internal `~~` is content
- [x] `path-safety-in-comment.wit` — `~/` paths don't close
- [x] `tilde-discriminator-baseline.wit` — `~5` / `~/x` / `x ~ y` prose
- [x] `empty-comment.wit` — `~~ ~~/` legal, empty
- [x] `comment-between-prose-lines.wit` — line comment glues neighbours (mistake)

### `tests/fixtures/18-core-vocab/` (6) → §3/§5/§6/§7/§9/§11
- [x] `headings.wit` — `@h1`–`@h3` → §5 Headings & structure
- [x] `inline-marks.wit` — `@em`/`@strong`/`@code` → §3 Inline marks (+ §2)
- [x] `lists.wit` — `@ul`/`@li` → §6 Lists
- [x] `links-and-media.wit` — `@a`/`@img`/`@figure`/`@figcaption` → §9 Images, §11 Links & media
- [x] `blocks.wit` — `@blockquote`/`@pre`/`@hr` → §7 Quotes, code & rules
- [x] `sectioning.wit` — `@article`/`@section`/`@header`/`@footer`/`@small` → §5 Headings & structure

### `tests/fixtures/19-tables/` (6) → §8 Tables
- [x] `inline-csv.wit` — inline CSV + `|caption|`
- [x] `schema-array.wit` — positional schema + `@ref` rows
- [x] `schema-record.wit` — labelled schema
- [x] `no-header.wit` — `|header false|`
- [x] `empty.wit` — `@table table@` → `<table></table>`
- [x] `multiline-cell.wit` — `! … !` cell (comma-safe, multi-line)

### Code-driven features (verified by building)
- [x] Image size presets/px/% + align semantics → §9 (`render-core-vocab.ts`)
- [x] `@figure` centring + capped-box auto-centre → §9
- [x] `@row`/`@col` flex layout → §10 (`renderRow`/`renderColumn`)
- [x] `@table |header N|`, `|header [a,b]|` → §8 (`pickHeader`)
- [x] `@@table` frozen does not resolve `@ref` rows → §8 (FINDINGS C)
- [x] `@load` external data + `--sources`/`--allow-exec`/`--env` → §17
- [x] Render targets: default document / `--fragment` / `--raw` / `-o` / `--format` / PDF `<base href>` → §17, §18
- [x] Default theme vs `rawThemeCss` → §18 (`theme.ts`)
- [x] `wit fmt` re-indent + `-w` → §15 (`cmd-fmt.ts`)
- [x] `@audio`/`@video` need `|controls true|` (bare flag no-op) → §11

---

## Appendix — cross-cutting facts verified for this section (2026-07-05)

Confirmed against code/fixtures/builds; call these out where relevant.

- **Only two inline marks:** `_…_` → `<em>`, `*…*` → `<strong>`. Marks wrap a
  token; digit/letter-flanked mark chars stay literal (`5*6*7`, `snake_case`).
- **Emphasis nesting is asymmetric:** `*_x_*` → `<strong><em>x</em></strong>`;
  `_*x*_` → `<em>*x*</em>` (inner `*` literal). Recommend `*_…_*`.
- **A "blank line" is empty OR whitespace-only;** it separates paragraphs. A
  lone newline is a *preserved* soft break (renders as a space, not `<br>`).
  CRLF/CR/LF normalise before splitting. Trailing newlines add no phantom
  paragraphs. Leading whitespace is preserved in source but collapses visually.
- **Prose sigil hazards:** a literal `@` glued to letters (emails) mangles
  output — `keeper@` reads as a node close and `@code` does not protect it
  (`E_MISMATCHED_CLOSE`); no `@` escape. `#`+letter at line start is a def
  (swallows the line). A bare `|` in prose is swallowed. `@`+space/digit and
  `#`+space/digit are safe.
- **Comments never reach any output.** `~ ` (space required) starts a line
  comment; `~~ … ~~/` is inline/multi-line; a line comment between prose lines
  glues them with no space; a comment as first child of a container body
  collapses the next block (add a blank line).
- **Core vocab (no `#def` needed):** h1–h6; em/strong/code/u/s/sub/sup/mark/
  small/br; ul/ol/li/dl/dt/dd; a/img/figure/figcaption/audio/video;
  table/thead/tbody/tfoot/tr/th/td/caption; p/blockquote/pre/hr;
  section/article/aside/header/footer/nav/main; div/span; row/col; cite; plus
  opaque `node` (`core-vocab.ts`).
- **Inline-context nodes flatten** a single wrapping `<p>` (h1–h6, marks, a, li,
  dt, dd, th, td, caption, figcaption, cite). `@p` around prose double-wraps.
- **Images:** presets small=220 / medium=380 / large=600 px (*cap* via
  `max-width`); `full`=100% and `N%` *fill* via `width`; bare number = px cap.
  `align` left/center/right → block margins on `@img`, `text-align` on
  `@figure`. Figures + captions centre by default.
- **Layout:** `@row` = flex band; `@col |size …|` fixed (preset/px/%), bare
  `@col` fills; columns wrap on narrow widths.
- **Tables:** inline CSV / positional schema / labelled schema / `@ref`
  collection (keys→columns); `|caption|`, `|header false|N|[…]|`; multi-line +
  comma-safe cell `! … !`; centred by default. `@@table` frozen form does *not*
  resolve `@ref` rows.
- **CLI (`bin.ts`):** subcommands `parse`, `check`, `fmt`, `build`, `tour` —
  **no `watch`/`-w` on build** (only `fmt -w`). `build` default = self-contained
  styled HTML document to stdout; `--fragment` = bare `<article
  class="wit-doc">`; `-o` infers html/md/pdf; `--format` overrides; `--raw` =
  reset-only base; PDF needs Chrome/Chromium (or `WIT_CHROME`) and anchors
  relative asset paths via `<base href>`. `wit --version` prints `0.1.0`
  (drift — don't quote it).
- **Styling:** `defaultThemeCss` = Word/Docs look (Calibri stack, 8.5in page,
  1in margin, `prefers-color-scheme` dark, `@page`/print rules). `@@style …
  style@@` cascades over it; `rawThemeCss` (via `--raw`) is a mechanical reset
  only. `{{path}}` interpolation is live in `@@` bodies/strings, **not** normal
  content.
- **Media flag:** `@audio`/`@video` emit `controls` only with `|controls true|`
  (any value); bare `|controls|` is a positional param and a no-op.
- **Known broken committed examples** (fix before citing as working):
  `examples/15-references/master.wit` (`E_MALFORMED_RECORD`),
  `examples/16-additive-partials/master.wit` (`E_UNRESOLVED_REFERENCE`)
  (FINDINGS B).
- **Untrusted prose sources** (verify against code before lifting): `docs/spec.md`,
  `packages/skill/skill/reference/*`, `docs/literal-nodes-and-components.md`,
  skill `15-common-document-genres.md` (FINDINGS E).
