# Content design — Recipes / Cookbook

Planning doc for the **Recipes** section of the Wit docs site (`/docs/recipes`).
Each recipe is a **full, annotated, end-to-end walkthrough**: `Goal · Audience ·
the complete step sequence` (the actual Wit *and* the exact build command at
each step) `· expected result · pitfalls · variations · Sources`. It is the
depth "annotated full sample documents" page type from
[AUTHORING-STANDARD.md](AUTHORING-STANDARD.md).

**Every Wit snippet below was built against the working tree and observed
(verified 2026-07-05).** Where the snippet is not lifted verbatim from a
committed example, it was written to a scratch file and built; the exact command
is shown. Nothing here is grounded on `docs/spec.md` or the skill prose (both
carry drift — see [FINDINGS.md](FINDINGS.md) §E).

Conventions used here:
- Build commands are the exact, verified invocation from the **repo root**,
  using the prebuilt CLI (`node packages/cli/dist/bin.js …`). Final prose can
  present these as `wit …` once install is assumed.
- Sources are absolute-from-repo-root paths.
- "Audience" is `writer` or `developer` per `docs/plan/README.md` §3.

---

## Cross-recipe shared facts (state once, reuse)

**The CLI.**
`wit build <file> [-o out.html|out.md|out.pdf] [--format html|md|pdf]
[--raw | --fragment] [--sources wit.sources.json --allow-exec] [--env .env]`.
Output format is inferred from the `-o` extension; `--format` overrides; with no
`-o` the HTML fragment/document prints to stdout.
(`packages/cli/src/bin.ts`, `packages/cli/src/cmd-build.ts`.)

**Three HTML render pathways** (`packages/render-html/src/render.ts`
`RenderHtmlOptions`, `theme.ts`):
- **default** — a self-contained styled document (`defaultThemeCss` inlined in
  `<head>`); what you get with `-o out.html` and no flag.
- **`--raw`** — a reset-only base you own (`rawThemeCss`); your CSS wins. Used by
  Recipe 7.
- **`--fragment`** — a bare `<article class="wit-doc">…</article>` for embedding;
  no `<head>`, no theme.

**Core vocab** (needs no `#def`): `h1`–`h6`; `em strong code u s sub sup mark
small br`; `ul ol li dl dt dd`; `a img figure figcaption audio video`; `table
thead tbody tfoot tr th td caption`; `p blockquote pre hr`; `section article
aside header footer nav main`; `div span`; `row col`; `cite`; and the opaque
`node`. Everything else is a user `#def`. Reference the **list**, never a count —
the `47` in `packages/runtime/src/index.ts`'s doc-comment is stale
(FINDINGS §A). Source of truth: `packages/runtime/src/core-vocab.ts`
(`CORE_VOCAB_NAMES`, `isCoreVocabName`, `RESERVED_OPAQUE`).

**The pipeline:** `parse → loadExternalData → resolve → expand → render*`.
`loadExternalData` runs **between parse and resolve** and only rewrites
`@load <alias> load@` uses into DataDefs (`packages/runtime/src/data-loader.ts`).

**The capture model** (used by Recipes 1, 4, 6, 8, 11 — verified against
`.claude/skills/wit/reference/02-defs-and-captures.md` and by building):
- A block-form def declares captures in `||…||` and interpolates them with
  `::name::` **inside its own body**. The call site supplies each capture as a
  **param** (`@def |name value|`), *not* as body prose.
- The invocation **body** lands at the `...` splice point. A def with captures
  but no `...` silently drops any body passed to it.
- There is **no `::this::`**. Content you want the def to wrap goes through `...`;
  content you want interpolated goes through a named capture.

**Prose interpolation caveat** (FINDINGS §D): `{{path}}` and `::name::` do **not**
interpolate in ordinary prose — `::name::` is a capture hole live *only inside a
def body*, and `{{…}}` is live *only inside `@@` raw-node bodies*. Data-in-prose
is `@name.field`. Several illustrative website panels show `::hero.name::` in
prose; those panels are hand-mocked "renders to" pictures, not runnable Wit.

---

## Grounding status — read before authoring (verified 2026-07-05)

Recipes ship on **green** builds only. Verified against the working tree:

| Grounding example | Build command (from repo root) | Status |
|---|---|---|
| `scratch/essay/essay.wit` | `build … -o essay.pdf` | ✅ green — 3-page, 158,820-byte PDF |
| `examples/load-demo/report.wit` | `build … --sources … --env … --allow-exec --fragment` | ✅ green |
| `examples/thesis/master.wit` | `build … --fragment` | ✅ green (two cosmetic quirks below) |
| `website/site.wit` | `build … -o site.html --raw` | ✅ green — 31,327-byte page |
| `examples/15-references/master.wit` | `build … --fragment` | ❌ RED — `E_MALFORMED_RECORD` @ `master.wit:11:25` |
| `examples/16-additive-partials/master.wit` | `build … --fragment` | ❌ RED — `E_UNRESOLVED_REFERENCE @tocrow` @ `master.wit:4:8` |
| `examples/13-conditionals.wit` | `build … --fragment` | ❌ RED — `E_UNCLOSED_DEFINITION` @ `13-conditionals.wit:12:1` |
| `examples/14-iteration.wit` | `build … --fragment` | ❌ RED — `E_UNRESOLVED_REFERENCE @toc` @ `14-iteration.wit:27:1` |

**Four of the named examples are broken today.** The previous plan listed
`13-conditionals` and `14-iteration` as green — they are **not**; this rewrite
re-grounds every recipe that touched them on snippets built here. Do not ground a
recipe on a red build.

- **`15-references` fails** at `master.wit:11:25` — the multi-line `#book: { … }`
  record has a field value containing commas
  (`subtitle - Attention, Perception, and the Moral Life`). Commas separate
  record fields, so the parser reads "Perception" as a keyless field
  (`E_MALFORMED_RECORD`). The chapter/shared files are fine; only the master's
  `#book` breaks. Re-grounding for Recipe 4: `examples/thesis` is the working
  multi-file spine; cite 15-references for *shape* only, with comma-in-record as
  a gotcha.
- **`16-additive-partials` fails** — chapters emit `@tocrow …` but no `#tocrow`
  def exists (`E_UNRESOLVED_REFERENCE`). The self-registering `+#toc` /
  `+#bibliography` *idea* is sound, but this file doesn't build. Re-grounding for
  Recipe 8: `examples/thesis`'s `+#bibliography:` partials (verified to merge and
  render) are the working pattern; 16 is conceptual illustration only.
- **`13-conditionals` fails** at `13-conditionals.wit:12:1` — a single-line
  record def `#author: { … email - a.vane@coast.edu … }` whose value carries an
  `@` (and internal commas) fails to close (`E_UNCLOSED_DEFINITION: missing !!`).
  Re-grounding for Recipe 6: the conditional/record snippets in this plan
  (`(if @hero.status is wounded)`, comma-free single-line records) are built and
  green.
- **`14-iteration` fails** at `14-iteration.wit:27:1` — the `@toc` block calls an
  undefined `@tocrow` (`E_UNRESOLVED_REFERENCE @toc`). Re-grounding for Recipe 6:
  the `(each @pack as item)` iteration in this plan is built and green.
- **`examples/thesis` quirks (still green, cosmetic):** `#chapter`/`#section`
  templates lay down literal ATX text, so headings render as `## What was argued`
  rather than `<h2>` in HTML; and `<% lh.prose().wordCount() %>` renders **empty**
  via the CLI path (the `lh` word-count bridge isn't wired there). Recipes steer
  authors to real `@h1`/`@h2` (as `scratch/essay` does) and treat the word-count
  script as an advanced aside, not a feature.

**Escalations for the maintainer** (out of scope here, but the canonical
grounding depends on them): repair `15-references` (comma-in-record),
`16-additive-partials` (`@tocrow` def), `13-conditionals` (`@`-in-record-def),
and `14-iteration` (`@tocrow` def) so those tutorials build green on their own
files.

---

## 1. A thesis / essay → print-ready PDF — `/docs/recipes/thesis`

- **Goal:** Turn one `.wit` file into a print-ready PDF essay with a title,
  byline, epigraph, numbered sections, a data table, a captioned figure, and a
  Works Cited list — the whole academic spine, no LaTeX preamble.
- **Audience:** writer.
- **Prerequisites / see also:** Prose · Emphasis · Core-vocab reference
  (`h1`–`h6`, `br`, `blockquote`, `table`, `figure`, `img`, `ol`/`li`). Recipe 11
  walks this exact file line-by-line.

### Steps (each with the Wit and the observed result)

**Step 1 — Title and byline.** `@h1` for the title; a byline whose lines are
separated by the void `@br br@`:

```
@h1 Let Them Sleep: The Case for Later School Start Times h1@

Jordan Ellis @br br@
Ms. Rivera — English 11 @br br@
5 July 2026
```

Renders `<h1>…</h1>` then one `<p>Jordan Ellis <br>Ms. Rivera — English 11 <br>5
July 2026</p>` — the three lines collapse into a single paragraph joined by `<br>`.

**Step 2 — Epigraph.** A `@blockquote` holds the quotation and its attribution:

```
@blockquote "Sleep is the golden chain that ties health and our bodies together." — Thomas Dekker blockquote@
```

Renders `<blockquote>…</blockquote>`.

**Step 3 — Thesis statement + sections.** Flat prose (no indentation, blank line
between paragraphs), one `@h2` per section, `@em`/`@strong` (or `_…_`/`*…*`) for
emphasis:

```
@h2 The Teenage Clock Runs Late h2@

The heart of the problem is not attitude but chemistry … losing an hour or more
of the rest their developing brain requires @em every single night em@.
```

**Step 4 — A data table** with inline literal rows; the first row is the header:

```
@table |caption Recommended versus actual sleep for adolescents| |rows [[Group, Recommended sleep, Typical school night], [Teens 13 to 18, 8 to 10 hours, 6.5 to 7 hours]]|
```

Renders `<table><caption>…</caption><thead><tr><th>Group</th>…</tr></thead><tbody>…</tbody></table>`.

**Step 5 — A captioned figure.** `@figure` wraps `@img` (with a `size` preset)
and `@figcaption`. Figures centre by default; `size` is `small` (220px),
`medium` (380px), `large` (600px), `full` (100%), or a number/percent
(`packages/render-html/src/render-core-vocab.ts:162`):

```
@figure
  @img |src assets/attendance.svg| |alt Bar chart showing attendance rising from 82 percent to 94 percent after a later start time| |size medium|
  @figcaption Figure 1. On-time attendance before and after a district shifted its start time from 7:30 to 8:35. figcaption@
figure@
```

Renders `<figure><img src="assets/attendance.svg" alt="…" style="max-width:380px;height:auto"><figcaption>…</figcaption></figure>`.

**Step 6 — Works Cited** as an `@ol` of `@li`, titles in `@em`:

```
@h2 Works Cited h2@

@ol
  @li American Academy of Pediatrics. "School Start Times for Adolescents." @em Pediatrics em@, vol. 134, no. 3, 2014, pp. 642–649. li@
  @li Dekker, Thomas. @em The Pleasant Comedy of Patient Grissell em@. 1603. li@
ol@
```

**Step 7 — Render to PDF and open it:**

```
node packages/cli/dist/bin.js build scratch/essay/essay.wit -o /tmp/essay.pdf
```

- **Expected result (verified):** `wrote /tmp/essay.pdf` — a **3-page, 158,820-byte**
  PDF with title, byline, epigraph, five sections, the sleep table, the attendance
  figure, and the four-entry Works Cited list. HTML preview: swap `-o essay.html`
  or add `--fragment` to inspect the markup.

- **Pitfalls:**
  - **Don't** reach for the thesis example's ATX `#chapter`/`#section` templates —
    they emit literal `## …` text in HTML, not real headings (FINDINGS §B).
    Use `@h2` directly, as this recipe does.
  - `_*x*_` leaves the inner `*` literal; nest emphasis as `*_x_*`
    (FINDINGS §C, `02-emphasis` fixture).
  - Record/table cell values can't contain commas *inside a `{ }` record*; the
    inline `[[…]]` table rows here are fine because each cell is comma-delimited
    at the row level.

- **Variations:**
  - **In-text citations** kept short and consistent via an argument map — define
    `#cite: ::author:: (::year::) !!` and named-idea defs
    (`#weil_attention: Weil (1952, p. 117) !!`), then cite in prose as
    `@weil_attention`. This pattern is lifted verbatim from the working
    `examples/thesis/shared/schema.wit` + `shared/sources.wit`.
  - HTML for the web instead of PDF: `-o essay.html` (styled) or `--raw` (own CSS).

- **Sources:** `scratch/essay/essay.wit`; `scratch/essay/assets/attendance.svg`;
  `examples/thesis/shared/schema.wit`; `examples/thesis/shared/sources.wit`;
  `examples/thesis/README.md` (quirks);
  `packages/render-html/src/render-core-vocab.ts` (size/align);
  `packages/render-html/src/render-core-vocab.test.ts`.

---

## 2. A report with live data — `/docs/recipes/report-live-data`

- **Goal:** Build a release note / status report whose version, contributor list,
  and metrics table all come from **outside** the document — programs and files
  resolved at build time, not pasted in.
- **Audience:** writer (with a developer wiring the sources once).
- **Prerequisites / see also:** Recipe 3 (CSV→table, a focused excerpt of this),
  Recipe 9 (the same data seam, in-process), the `@load` reference, `@row`/`@col`.

### Steps

**Step 1 — Name each external input by alias** in the document. An alias is all
the document knows; it can never name a command:

```
@load meta load@
@load team load@
@load downloads load@
@load env load@
```

**Step 2 — Wire the aliases** in `wit.sources.json`. Each entry has `run` (an
argv array) and `format` (`json` | `csv`). `env` is a built-in source — no entry:

```json
{
  "sources": {
    "meta":      { "run": ["node", "scripts/meta.js"], "format": "json" },
    "team":      { "run": ["node", "scripts/team.js"], "format": "json" },
    "downloads": { "run": ["cat", "data/downloads.csv"], "format": "csv" }
  }
}
```

A `json` source that prints an **object** becomes a record; one that prints an
**array** becomes a collection; a CSV source becomes a collection of records
keyed by the header row (`packages/runtime/src/data-loader.ts` `toDataValue`).

**Step 3 — Use a loaded record inline** with `@alias.field`:

```
@h1 Release @meta.version h1@

Cut @meta.date on branch @env.WIT_BRANCH.
```

**Step 4 — Iterate a loaded collection** with `(each … as …)`:

```
@h2 Contributors h2@
@ul
(each @team as person) @li @person.name — @person.commits commits li@ (end)
ul@
```

**Step 5 — Drop a loaded CSV straight into a table** (Recipe 3):

```
@table |rows @downloads|
```

**Step 6 — Figures at size presets and an image-beside-text band.** `@row` is an
invisible flex band; each `@col |size 260|` is a fixed column beside flowing prose:

```
@row
  @col |size 260|
    @img |src assets/downloads.svg| |alt Downloads chart|
  col@
  @col
    macOS leads this cycle … placed side by side without a single float or clear.
  col@
row@
```

**Step 7 — Build with the sources config and `--allow-exec`:**

```
node packages/cli/dist/bin.js build examples/load-demo/report.wit \
  --sources examples/load-demo/wit.sources.json \
  --env examples/load-demo/.env --allow-exec --fragment
```

- **Expected result (verified):** a fragment beginning
  `<h1>Release 0.4.0</h1><p>Cut 2026-07-05 on branch main.</p>`, a `<ul>` of
  contributors (`TauraJ — 42 commits`, `Ada Lovelace — 17 commits`), a
  four-row downloads `<table>` with header-derived columns, four figures at the
  size presets, and the row/col band. Swap `--fragment` for `-o report.pdf` for a
  styled PDF.

- **Security note to surface:** the document names only an **alias**; only the
  operator's `wit.sources.json` maps an alias to a command, and `--allow-exec`
  must be passed to run any program. Without `--allow-exec` only the built-in
  `env` source resolves. That indirection *is* the trust boundary
  (`examples/load-demo/README.md`).

- **Pitfalls:**
  - Forgetting `--allow-exec` → every non-`env` alias fails to load.
  - The iterated `@li` currently renders inside a stray `<p>` wrapper
    (`<ul><p> <li>…</li> </p></ul>`) — cosmetic auto-paragraph behaviour, harmless
    in a browser; note it rather than fight it.
  - A `json` source must print **only** JSON to stdout; stray logs corrupt the parse.

- **Variations:** any program in any language that emits JSON/CSV/lines works —
  a Python script, a SQL client, a compiled binary. Only the value model
  (records / collections / scalars) crosses the seam.

- **Sources:** `examples/load-demo/report.wit`;
  `examples/load-demo/wit.sources.json`; `examples/load-demo/.env`;
  `examples/load-demo/scripts/meta.js`, `scripts/team.js`;
  `examples/load-demo/data/downloads.csv`; `examples/load-demo/README.md`;
  `packages/runtime/src/data-loader.ts`.

---

## 3. Load a CSV into a table — `/docs/recipes/csv-to-table`

- **Goal:** Render a real `.csv` file as a table without hand-typing rows — the
  header row becomes the columns automatically. A focused excerpt of Recipe 2.
- **Audience:** writer.

### Steps

**Step 1 — Point a source at the file** in `wit.sources.json` (any program that
emits CSV to stdout works; `cat` is the simplest):

```json
"downloads": { "run": ["cat", "data/downloads.csv"], "format": "csv" }
```

**Step 2 — Load and render it:**

```
@load downloads load@

@table |rows @downloads|
```

**Step 3 — Build** with the sources config and `--allow-exec` (same command as
Recipe 2).

- **Expected result (verified):** the header row `platform,downloads,change`
  becomes three `<th>` columns; each remaining CSV line is one `<tr>`. The
  observed output:
  `<table><thead><tr><th>platform</th><th>downloads</th><th>change</th></tr></thead><tbody><tr><td>macOS</td><td>4210</td><td>+12%</td></tr>…</tbody></table>`.

- **Variations — when you don't have a file** (both built and green here):
  - **Inline literal rows** — first row is the header:
    ```
    @table |caption Inline literal rows| |rows [[Group, A, B], [Teens, 8, 6.5]]|
    ```
  - **Schema + rows** — supply the header separately, feed a loaded/defined
    collection of records as the body:
    ```
    #corpus: [
      { split - Train, docs - 40k, tokens - 12.4M }
      { split - Dev, docs - 5k, tokens - 1.5M }
    ] !!

    @table
      |schema [split, docs, tokens]|
      |rows @corpus|
    table@
    ```
    Renders a `<thead>` of `split / docs / tokens` and one `<tr>` per record.

- **Pitfalls:**
  - `@@table` (a *frozen* table) does **not** resolve `@ref` rows — use plain
    `@table` (FINDINGS §C).
  - Record field values still can't contain commas — a cell like `12.4M` is fine,
    but `Attention, Perception` inside a `{ }` record would split into two fields.

- **Sources:** `examples/load-demo/data/downloads.csv`;
  `examples/load-demo/wit.sources.json`; `examples/load-demo/report.wit` (the
  `@table |rows @downloads|` line);
  `packages/render-html/src/render-core-vocab.ts` (table/schema).

---

## 4. A manuscript in chapters (multi-file) — `/docs/recipes/manuscript-in-chapters`

- **Goal:** Keep a long document as one file per chapter, shared vocabulary in
  its own file, and a thin master that assembles them in order.
- **Audience:** writer.
- **Prerequisites / see also:** `reference`, block-form defs, the capture model,
  Recipe 8 (bibliography across the same files).

### Steps

**Step 1 — Shared vocabulary.** Put reusable templates and headings in
`shared/schema.wit` and bibliographic anchors in `shared/sources.wit`:

```
~ shared/schema.wit
#cite: ::author:: (::year::) !!
#section ||title||
## ::title::
section#
#entry: ... !!
```

**Step 2 — Per-chapter file.** Each chapter `reference`s the shared files, then
wraps its body in a block-form def so the master can place it:

```
~ chapters/01-introduction.wit
reference ../shared/schema.wit
reference ../shared/sources.wit

#chapter_one
@section |title The problem|

Attention, as @weil_attention argued, is the rarest form of generosity …
chapter_one#
```

**Step 3 — Master file.** `reference` the shared files and every chapter, add
single-line metadata, then emit the chapters in order:

```
~ master.wit
reference ./shared/schema.wit
reference ./shared/sources.wit
reference ./chapters/00-frontmatter.wit
reference ./chapters/01-introduction.wit

#thesis: { title - Attention as a Moral Practice, author - T Greig, status - draft } !!

# @thesis.title
By @thesis.author

(if @thesis.status is draft)
@watermark()
(end)

@frontmatter frontmatter@
@chapter_one chapter_one@
```

**Step 4 — Build the master:**

```
node packages/cli/dist/bin.js build examples/thesis/master.wit --fragment
```

(Or `-o thesis.pdf` / `-o thesis.md` — the CLI infers format from the extension.)

- **Expected result (verified):** one document assembled from six files — the
  metadata header, a draft watermark (because `status is draft`), the frontmatter,
  and every chapter in order. **Add a chapter** by writing the file, adding one
  `reference` line and one emit line.

- **Pitfalls (verified):**
  - **Record field values cannot contain commas** — commas separate fields, so
    `subtitle - Attention, Perception, and the Moral Life` throws
    `E_MALFORMED_RECORD`. This is exactly what breaks `examples/15-references`.
    Keep metadata comma-free, or model it as a collection.
  - **Prefer single-line records for metadata.** A multi-line `#thesis: { … } !!`
    spanning lines is not reliably classified as a DataDef under the current
    parser (`examples/thesis/README.md` "Known gaps") — write it on one line.
  - The thesis `#chapter`/`#section` templates emit literal ATX (`## …`) in HTML.
    For real `<h2>` in HTML output, define the header with `@h2 ::title:: h2@`
    instead of a bare `## ::title::`.

- **Variations:** a draft/final gate with `(if @thesis.status is draft) … (end)`;
  per-chapter shared citations via `reference ./shared/sources.wit` (Recipe 8).

- **Grounding:** `examples/thesis/` builds green and is the working spine.
  `examples/15-references/` shows the same *shape* more minimally but currently
  **fails** — cite it for structure only and surface the comma gotcha.

- **Sources:** `examples/thesis/master.wit`; `examples/thesis/chapters/*.wit`;
  `examples/thesis/shared/*.wit`; `examples/thesis/README.md`;
  `examples/15-references/` (shape + the broken `#book` record).

---

## 5. Creative writing with no indentation — `/docs/recipes/creative-writing`

- **Goal:** Write fiction where the source reads like the finished page — flat
  paragraphs, no indentation, scenes and emphasis in the lightest possible markup.
- **Audience:** writer.

### Steps (built and green — see command below)

**Step 1 — Paragraphs.** Just type them, blank line between. No leading spaces,
no wrapping node.

**Step 2 — Emphasis** with `_italic_` and `*bold*` (or `@em`/`@strong`).

**Step 3 — A chapter/scene heading** with `@h2`.

**Step 4 — A scene break.** `@hr hr@` for a plain rule, or a tiny custom def for
an ornamented divider — `#scenebreak: ✦ ✦ ✦ !!` used as a bare `@scenebreak`.

The whole file:

```
@h2 One · The Harbour h2@

The rain had not stopped for three days.

Mara pressed her palm to the cold glass and counted the boats that were
no longer there. _One. Two._ The third had been her father's.

#scenebreak: ✦ ✦ ✦ !!

@scenebreak

"You can't stay," the harbourmaster said.

She said nothing. There was *nothing*, she had learned, that saying could fix.

@hr hr@

And then the tide turned.
```

**Build:**

```
node packages/cli/dist/bin.js build story.wit --fragment    # or -o story.pdf
```

- **Expected result (verified):** each blank-line-separated block is its own
  `<p>`; `_One. Two._` → `<em>One. Two.</em>`; `*nothing*` → `<strong>nothing</strong>`;
  `@scenebreak` → `<p>✦ ✦ ✦</p>`; `@hr hr@` → `<hr>`. The apostrophe in
  `father's` renders correctly (`father&#39;s`).

- **Pitfalls:**
  - `@break` is **not** core vocab. The website "novel" panel shows `@break ✦ ✦ ✦
    break@` illustratively; in real Wit use `@hr` or a `#def` (confirmed against
    `packages/runtime/src/core-vocab.ts`: `hr` yes, `break` no).
  - `_*x*_` won't bold-italicise the inner run (asymmetric nesting). Use `*_x_*`.

- **Variations:** an epigraph as a reusable `#epigraph: … !!` value def; scene
  headings that carry a subtitle via `@h2 One · The Harbour h2@`.

- **Sources:** `website/parts/examples.wit` (the "novel that never indents" panel
  — design intent, `@break` illustrative); `scratch/essay/essay.wit` (verified
  flat prose + `@em`/`@strong`); `examples/02-emphasis.wit`;
  `examples/01-prose.wit`; `packages/runtime/src/core-vocab.ts`.

---

## 6. An interactive / RPG script — `/docs/recipes/rpg-script`

- **Goal:** Author a branching game/gamebook page where character stats, a
  wounded-check, and an inventory are **data and logic in the document**, not
  hand-edited per state.
- **Audience:** writer (with light logic).
- **Prerequisites / see also:** records, `@name.field` access, conditionals,
  iteration, the capture model (Recipe 4).

### Steps (whole file built and green — see command below)

**Step 1 — Character state as data.** A comma-free single-line record for scalars,
a separate collection for the inventory (list items can't live inside a record
field — commas would split them):

```
#hero: { name - Vera, gold - 12, status - wounded } !!
#pack: [torch, rope, a letter you should have burned] !!
```

**Step 2 — Scene vocabulary as custom defs.** Block-form defs with captures.
**Pass display text as a capture** (`|text …|`), not as a body splice — a `...`
splice wraps inline content in stray `<p>` tags:

```
#scene ||title||
@h2 ::title:: h2@
scene#

#warn ||text||
@aside ⚔ ::text:: aside@
warn#

#choice ||goto, text||
@li → ::text:: (to ::goto::) li@
choice#
```

**Step 3 — Scene heading + prose,** splicing stats with `@hero.field`:

```
@scene |title The Crossroads|

@hero.name, the road forks beneath a broken signpost. You are carrying @hero.gold gold.
```

**Step 4 — A conditional beat.** Comparison form — compare a **string** field to
a literal:

```
(if @hero.status is wounded)
@warn |text You are wounded — the dark path may kill you.|
(end)
```

**Step 5 — Choices** as list items built from the `#choice` def:

```
@strong Choose: strong@
@ul
  @choice |goto village| |text Take the lit path|
  @choice |goto tower| |text Take the dark path|
ul@
```

**Step 6 — Iterate the inventory:**

```
@strong Pack: strong@
@ul
(each @pack as item)
@li @item li@
(end)
ul@
```

**Build:**

```
node packages/cli/dist/bin.js build scene.wit --fragment
```

- **Expected result (verified):**
  `<h2>The Crossroads</h2><p>Vera, the road forks … carrying 12 gold.</p>`,
  then `<aside><p> ⚔ You are wounded … </p></aside>` (the wounded-check fired),
  then `<ul><li>→ Take the lit path (to village)</li><li>→ Take the dark path (to
  tower)</li></ul>`, then the pack list `<li>torch</li><li>rope</li><li>a letter
  you should have burned</li>`.

- **Pitfalls (the gotcha the website RPG panel glosses):**
  - Conditionals have **only** `is` / `equals` (synonyms). No `==`, `<`, `>`,
    `not`, `and`, `or`, and **no `contains`** (FINDINGS §D — the skill's
    `contains` doesn't exist).
  - `(if @hero.hp is low)` compares hp to the literal string `low` — it will
    **not** match the number `8`. Model the check as a status **string**
    (`status - wounded`) or an existence flag: `(if @hero.wounded) … (end)`
    fires when `wounded` is present/truthy (both forms built green here).
  - Prose interpolation is a mirage: `::hero.name::` in ordinary prose renders
    literally. Use `@hero.name`. `::name::` is live only inside a def body.
  - Feeding display text through a `...` body splice fragments it into `<p>`s
    inside your `<li>`/`<aside>`; pass it as a `|text …|` capture instead
    (both build, but the capture form is clean).

- **Variations:** existence-flag conditionals; multiple `#scene`s emitted in a
  master (Recipe 4); a `#choices` wrapper def that groups the list.

- **Grounding:** built green from first principles here. The committed
  `examples/13-conditionals.wit` and `examples/14-iteration.wit` are the intended
  canonical grounding but **currently fail to build** (see grounding table) —
  cite them for concept only until repaired. `website/parts/examples.wit`'s RPG
  panel is an illustrative mock (`::hero.name::` in prose, `@break`).

- **Sources:** `examples/10-records.wit` (green); `examples/12-accessing-data.wit`
  (green); `examples/13-conditionals.wit`, `examples/14-iteration.wit`
  (concept, currently red); `website/parts/examples.wit` (RPG panel, illustrative);
  `packages/runtime/src/core-vocab.ts`.

---

## 7. A website built entirely in Wit — `/docs/recipes/website-in-wit`

- **Goal:** Build a full, self-styled, multi-section landing page as one Wit
  project — you own every byte of CSS and JS, no framework.
- **Audience:** developer (writer-friendly).
- **Prerequisites / see also:** `reference`, block defs, literal nodes
  (`@@`/`@@@`), `--raw` (Cross-recipe facts).

### Steps

**Step 1 — Root `site.wit`.** `reference` the theme, the script, and each
`parts/*.wit`, then emit them in order — `@scripts` last so the DOM exists:

```
reference ./theme.wit
reference ./script.wit
reference ./parts/nav.wit
reference ./parts/hero.wit
… 

@stylesheet stylesheet@
@page_nav page_nav@
@page_hero page_hero@
…
@scripts scripts@
```

**Step 2 — Design system in `theme.wit`.** A block def whose body is a `@@style`
literal holding the whole stylesheet (custom properties, dark-mode `:root.dark`,
responsive `@media`):

```
#stylesheet
@@style
:root { --bg: #f6f1e7; --accent: #8a2b39; … }
:root.dark { … }
@media (max-width: 700px) { … }
style@@
stylesheet#
```

`@@` is a **literal** block: resolve/expand never re-parse or interpolate it, and
the renderer emits it verbatim inside `<style>`.

**Step 3 — Behaviour in `script.wit`.** JS in a `@@@` **frozen** literal (double
`@@` allows `{{…}}` interpolation; triple `@@@` freezes everything — needed so JS
`{ }` and template syntax pass straight through):

```
#scripts
@@@script
var toggle = document.querySelector('.toggle');
if (toggle) { toggle.addEventListener('click', function () { … }); }
script@@@
scripts#
```

**Step 4 — Sections in `parts/*.wit`.** Each exposes one block def
(`#page_hero`, `#page_features`, …) built from core containers `@div`/`@span`/
`@nav`/`@header`/`@section` with `(class …)` / `|class …|` params. Verbatim code
samples go in `@@@pre … pre@@@` so Wit-looking source renders as text, not markup.

**Step 5 — Build with `--raw`** so the page carries only a mechanical reset and
your CSS wins:

```
node packages/cli/dist/bin.js build website/site.wit -o website/site.html --raw
```

- **Expected result (verified):** `wrote website/site.html` — a **31,327-byte**
  self-contained page: your `<style>` from `theme.wit`, the assembled sections,
  and your `<script>` from `script.wit`. Open it; the ◐ toggle switches dark/light.

- **Pitfalls:**
  - Without `--raw` the default theme CSS is inlined and competes with yours; with
    `--raw` you get `rawThemeCss` (reset only) — your rules win.
  - The **comment-as-first-child** parser bug (FINDINGS §C): a `~comment` as the
    first line of a container body with no blank line after collapses following
    blocks into one `<p>`. Put a blank line after such comments.
  - `@@@` (frozen) is required for JS/code that contains `{{`, `}}`, or `{ }` you
    don't want touched; `@@` still applies `{{…}}` interpolation.

- **Variations:** split the CSS across several `@@style` defs; add a `parts/`
  section by writing one file + one `reference` + one emit (same additive shape
  as Recipe 4).

- **Sources:** `website/site.wit`; `website/theme.wit`; `website/script.wit`;
  `website/parts/*.wit`; `website/README.md`;
  `docs/literal-nodes-and-components.md` (`@@`/`@@@` — split shipped from roadmap
  per FINDINGS §E); `docs/universal-render-target.md` (`--raw` vs default);
  `packages/render-html/src/theme.ts` (`rawThemeCss`).

---

## 8. A bibliography across files — `/docs/recipes/bibliography-across-files`

- **Goal:** Let each chapter declare its own sources and have one bibliography
  assemble itself at the end — add a chapter and the list grows on its own.
- **Audience:** writer.
- **Prerequisites / see also:** Recipe 4 (the multi-file spine), additive partials.

### Steps

**Step 1 — Register an entry per chapter with an additive partial.** A leading
`+` means multiple declarations of the same name **merge** instead of overwriting:

```
~ in chapters/01-introduction.wit
+#bibliography: @entry Berger, John (1972). Ways of Seeing. Penguin. entry@
```

**Step 2 — Wrap each entry in a tiny value def** so one partial renders as one
block (without the wrapper, inline runs fragment into stray paragraphs):

```
~ in shared/schema.wit
#entry: ... !!
```

**Step 3 — Emit the merged list once, where you want it:**

```
~ in chapters/04-conclusion.wit
@section |title References|
@bibliography bibliography@
```

**Step 4 — Build the master** (same command as Recipe 4):

```
node packages/cli/dist/bin.js build examples/thesis/master.wit --fragment
```

- **Expected result (verified):** the four `+#bibliography:` declarations across
  `00-frontmatter`, `01-introduction`, and `04-conclusion` merge, and the single
  `@bibliography bibliography@` in the conclusion renders the combined list.

- **Pitfalls (verified in `examples/thesis/README.md`):**
  - **Inline emphasis in additive-partial bodies fragments** the entry into one
    paragraph per text/italic run — the thesis uses plain-text titles
    (`Gravity and Grace.`, not `_Gravity and Grace_.`) for that reason.
  - **`(each @bibliography as entry)` does not iterate** — `#bibliography` is an
    additive `NodeDef`, not a `DataDef` `Collection`. To iterate a list of
    sources, use a separate `#source_list: [ … ] !!` collection literal (the
    thesis does exactly this in chapter 4).

- **Variations:** the **shared-anchor** pattern — define full citations once in
  `shared/sources.wit` (`#weil_full: Weil, Simone (1952). … !!`), `reference` it
  from every chapter, cite short in prose (`@weil_attention`) and list full at the
  end.

- **Grounding:** `examples/thesis/` (green — merges and renders). The
  self-registering `+#toc` / `+#bibliography` idea in
  `examples/16-additive-partials/` is the aspirational shape but **fails to
  build** (`@tocrow` undefined) — illustration only.

- **Sources:** `examples/thesis/chapters/*.wit` (the `+#bibliography` lines);
  `examples/thesis/shared/schema.wit` (`#entry`);
  `examples/thesis/shared/sources.wit` (shared-anchor pattern);
  `examples/thesis/README.md`; `examples/16-additive-partials/` (concept, red).

---

## 9. Embed the Wit parser in an app — `/docs/recipes/embed-the-parser`

- **Goal:** Run the Wit pipeline inside your own program — parse a document, feed
  it your own data, get HTML — with no CLI, no subprocess, no config file.
- **Audience:** developer.
- **Prerequisites / see also:** Recipe 10 (shares the `parse → resolve → expand`
  front half), Recipe 2 (the same data seam, via the CLI).

### Steps

**Step 1 — Install** `@witlang/parser`, `@witlang/runtime`, `@witlang/render-html`.

**Step 2 — The whole pipeline** (verified end-to-end here):

```ts
import { parse } from '@witlang/parser';
import { loadExternalData, resolve, expand } from '@witlang/runtime';
import { renderHtml } from '@witlang/render-html';

const src = `@load meta load@
@load sales load@

@h1 Release @meta.version h1@
Cut @meta.date.

@table |rows @sales|
`;

// Feed data through the same seam the CLI uses. A plain dictionary pairs each
// alias with its already-resolved value; keys must match the @load aliases.
const doc = loadExternalData(parse(src, 'report.wit'), {
  meta:  { version: '0.4.0', date: '2026-07-05' },
  sales: [{ site: 'Dunmore', lit: 'yes' }, { site: 'Harbour', lit: 'no' }],
});

const html = renderHtml(expand(resolve(doc)), { mode: 'document', title: 'Release' });
```

- **Expected result (verified):** `html` is a full page whose body contains
  `<h1>Release 0.4.0</h1><p>Cut 2026-07-05.</p>` and a `<table>` with the two
  sales rows. Use `mode: 'fragment'` (the default) for embedding, or pass `css`
  to override the inlined theme.

- **The seam** (`packages/runtime/src/data-loader.ts`):
  - `DataSource = DataLoader | Record<string, unknown>`. The **dictionary** form
    is simplest; pass a **function** `(req: DataLoadRequest) => unknown` — where
    `DataLoadRequest = { alias, args, loc }` — to fetch lazily per alias.
  - `loadExternalData` **only rewrites `@load <alias> load@` uses**. This is the
    load-bearing correction: the document must contain the `@load` lines, and the
    dictionary keys must match those aliases. Omit the `@load meta load@` line and
    `@meta.version` throws `E_UNRESOLVED_REFERENCE @meta` — verified.

- **Multi-file documents:** if the source uses `reference`, pass resolve options
  `{ rootPath, fileReader }` where `fileReader: (absPath: string) => string` is
  **synchronous** (`packages/runtime/src/resolver.ts` `ResolveOptions`,
  `resolver-files.ts` `FileReader`). A single-file doc needs no options.

- **Correction to flag:** the stale skill doc shows `resolve(parsed, { readFile:
  async … })`. The real option is `fileReader` and it is **sync**
  (FINDINGS §E). Use the current signature.

- **Pitfalls:**
  - No `@load` line → the dictionary key is never consulted → unresolved reference.
  - A `resolve()` on a doc with `reference` but **no** `rootPath` throws (the
    resolver guards against silently dropping references).

- **Sources:** `examples/load-demo/README.md` ("Embedding" snippet, reconciled
  with the verified `renderHtml` signature and the `@load`-line requirement);
  `packages/runtime/src/data-loader.ts`; `packages/runtime/src/resolver.ts`
  (`ResolveOptions`); `packages/runtime/src/resolver-files.ts` (`FileReader`);
  `packages/render-html/src/render.ts` (`RenderHtmlOptions`);
  `packages/runtime/src/index.ts` (exports).

---

## 10. Write a custom renderer — `/docs/recipes/custom-renderer`

- **Goal:** Walk the expanded Wit AST and emit **your own** target format (LaTeX,
  plain text, RTF, a Slack payload, a JSON intermediate).
- **Audience:** developer.
- **Prerequisites / see also:** Recipe 9 (the same front half + the `fileReader`
  correction).

### Steps

**Step 1 — Get an expanded document:** `parse → resolve → expand` (add
`loadExternalData` first if the doc uses `@load`). Then walk `expanded.children`.

**Step 2 — A recursive walk that switches on `node.kind`** (verified — this
produced correct plain-text output here):

```ts
import { parse } from '@witlang/parser';
import { resolve, expand, isCoreVocabName, RESERVED_OPAQUE } from '@witlang/runtime';

const expanded = expand(resolve(parse(src, 'doc.wit')));
const param = (use, n) => use.params.find(p => p.name === n)?.value;

function renderInline(node) {
  switch (node.kind) {
    case 'text':   return node.value;
    case 'italic': return '_'  + node.children.map(renderInline).join('') + '_';
    case 'bold':   return '**' + node.children.map(renderInline).join('') + '**';
    case 'nodeUse': return renderUse(node);
    default:        return '';           // interpolation/bodySlot/scriptCall → see step 3
  }
}
function renderUse(use) {
  if (use.name === RESERVED_OPAQUE) return `[node type=${param(use, 'type')}]`;  // @node(type X)
  const body = (use.body ?? []).map(renderInline).join('');
  if (use.name === 'h1') return `\n# ${body}\n`;
  if (use.name === 'li') return `  - ${body}`;
  if (isCoreVocabName(use.name)) return body;   // generic core-vocab branch
  return body;                                  // user def already inlined by expand
}
```

**Step 3 — Dispatch `nodeUse`** by three cases:
- `use.name === RESERVED_OPAQUE` (`'node'`) → the opaque `@node(type X)` extension
  point; read `param(use, 'type')`.
- `isCoreVocabName(use.name)` → your core-vocab branch (`h1`…`table`…).
- otherwise → a user `#def` that `expand` already inlined; pass the body through.

**Step 4 — Read params** with `use.params.find(p => p.name === n)?.value`.

**Step 5 — Know what `expand` removes.** A surviving `nodeDef`, `dataDef`,
`ifStatement`, `eachStatement`, `interpolation`, or `bodySlot` signals a
pre-expansion tree or an expansion failure — error or drop it.

- **Expected result (verified):** the walk above turned
  `@h1 A Tiny Report h1@` + `Some _emphasised_ and *strong* prose.` +
  a `@ul`/`@li` list into
  `# A Tiny Report` / `Some _emphasised_ and **strong** prose.` / `- First` /
  `- Second`.

- **The AST shapes to switch on** (`packages/parser/src/ast.ts`):
  - `Block = Paragraph | Comment | NodeUse | NodeDef | DataDef |
    ReferenceDirective | IfStatement | EachStatement | ScriptBlock`.
  - `Inline = Text | Italic | Bold | Interpolation | BodySlot | NodeUse |
    ScriptCall | ScriptBlock | Comment`.
  - `NodeUse` carries `{ name, access?, params, paramsSource, body, inline,
    closeStyle, raw?, frozen? }`.

- **Pitfalls:**
  - Same `fileReader` correction as Recipe 9 — `resolve` takes a **sync**
    `fileReader`, not an async `readFile`.
  - Handle `scriptBlock` explicitly (evaluate it if you ship an `lh` runtime, else
    drop it) — the shipped Markdown renderer drops comments and scripts.
  - Inspect any file's tree first: `node packages/cli/dist/bin.js parse
    path/to/file.wit` prints the AST as JSON.

- **Grounding:** the two shipped renderers are the working reference —
  `packages/render-html` (~600 lines) and `packages/render-markdown` (~500
  lines), each with a green test suite. `render-markdown`'s dispatch (hand-rolled
  mappings for `h1`…`table`, transparent sectioning wrappers, unknown uses
  unwrapped) is the model to copy.

- **Sources:** `packages/render-html/src/render.ts`, `render-core-vocab.ts`,
  `render-table.ts`; `packages/render-markdown/src/render.ts`;
  `packages/parser/src/ast.ts`; `packages/runtime/src/core-vocab.ts`;
  `packages/runtime/src/index.ts` (exports);
  `.claude/skills/wit/reference/06-custom-renderers.md` (verify `resolve` options
  against source before copying — the doc's `readFile` example is stale).

---

## 11. Annotated full document — `scratch/essay/essay.wit` line by line

- **Goal:** Read one complete, verified document end to end and understand **every
  construct in it** — the payoff page that ties Recipes 1, 3, and 5 together.
- **Audience:** writer.
- **Grounding:** `scratch/essay/essay.wit` — builds to a **3-page, 158,820-byte**
  PDF (`build … -o /tmp/essay.pdf`, verified). 53 lines; every construct below was
  observed in the rendered HTML.

Walk the file in order. Each block: the source, then what it becomes.

**L1 — Title.** `@h1 Let Them Sleep: The Case for Later School Start Times h1@` →
`<h1>Let Them Sleep: The Case for Later School Start Times</h1>`. `@h1` is core
vocab; `h1@` is the named close.

**L3–5 — Byline with line breaks.** Three source lines each ending `@br br@`:

```
Jordan Ellis @br br@
Ms. Rivera — English 11 @br br@
5 July 2026
```

→ one `<p>Jordan Ellis <br>Ms. Rivera — English 11 <br>5 July 2026</p>`. Teaching
point: consecutive non-blank lines are **one paragraph**; `@br br@` is how you
force a visible line break inside it. `br` is a void element — no content.

**L7 — Epigraph.** `@blockquote "Sleep is the golden chain…" — Thomas Dekker
blockquote@` → `<blockquote>…</blockquote>`. The straight quotes and em dash pass
through as typed.

**L9 — Thesis statement.** A plain paragraph — no wrapping node, no indentation.
This is the core Wit move: prose is prose. It ends with the argument's three-part
roadmap in ordinary text.

**L11 — Section heading.** `@h2 The Teenage Clock Runs Late h2@` → `<h2>…</h2>`.
Every section uses the same shape (L19, L25, L36, L42, L46).

**L13–15 — Body prose with inline emphasis.** Two paragraphs; the second ends
`… requires @em every single night em@.` → `<em>every single night</em>`. `@em`
and `_…_` are interchangeable; the file uses the node form here and `@strong`
at L21.

**L17 — Data table, inline literal rows.**

```
@table |caption Recommended versus actual sleep for adolescents| |rows [[Group, Recommended sleep, Typical school night], [Teens 13 to 18, 8 to 10 hours, 6.5 to 7 hours]]|
```

→ `<table><caption>…</caption><thead><tr><th>Group</th><th>Recommended sleep</th>
<th>Typical school night</th></tr></thead><tbody><tr><td>Teens 13 to 18</td>…
</tr></tbody></table>`. The **first inner array is the header row** (→ `<th>`),
each later array a `<tr>` of `<td>`. `|caption …|` and `|rows …|` are pipe params;
cells are comma-separated *within a row array* (this is safe — the comma
restriction is on `{ }` **record** fields, not `[[…]]` table rows).

**L19–23 — Second section + `@strong`.** `… they are @strong cognitively impaired
strong@.` → `<strong>cognitively impaired</strong>`.

**L25–34 — Third section with a captioned figure.**

```
@figure
  @img |src assets/attendance.svg| |alt Bar chart showing attendance rising from 82 percent to 94 percent after a later start time| |size medium|
  @figcaption Figure 1. On-time attendance … from 7:30 to 8:35. figcaption@
figure@
```

→ `<figure><img src="assets/attendance.svg" alt="…" style="max-width:380px;height:auto">
<figcaption>Figure 1. …</figcaption></figure>`. Teaching points: `@figure`
centres by default; `|size medium|` maps to `max-width:380px`
(`small`=220 / `medium`=380 / `large`=600 / `full`=100% / or a number/percent);
`|alt …|` is required for accessibility; the `assets/attendance.svg` path is
relative to the `.wit` file.

**L36–40 — "Answering the Objections" with two inline emphases.** `… they are
@em scheduling em@ problems …` — shows `@em` mid-sentence, not just at a boundary.

**L42–44 — Conclusion.** Another `@h2` + a single closing paragraph. No new
construct — reinforces that most of a document is just prose under headings.

**L46 — Works Cited heading.** `@h2 Works Cited h2@`.

**L48–53 — Ordered reference list with italic titles.**

```
@ol
  @li American Academy of Pediatrics. "School Start Times for Adolescents." @em Pediatrics em@, vol. 134, no. 3, 2014, pp. 642–649. li@
  @li Dekker, Thomas. @em The Pleasant Comedy of Patient Grissell em@. 1603. li@
  …
ol@
```

→ `<ol><li>… <em>Pediatrics</em>, vol. 134 …</li>…</ol>`. Each `@li` is one entry;
`@em` italicises the source title inside it; straight quotes render as `&quot;`,
the en dash `–` passes through.

- **What the whole file teaches:** flat prose is the default; headings, emphasis,
  a table, a figure, and a list are each **one node**; nothing needs a `#def`
  because every construct is core vocab. This is the smallest realistic document
  that exercises the writer's whole toolkit.

- **Build and open:**
  ```
  node packages/cli/dist/bin.js build scratch/essay/essay.wit -o /tmp/essay.pdf
  # HTML instead: -o /tmp/essay.html   |   inspect markup: --fragment
  ```

- **Sources:** `scratch/essay/essay.wit` (all 53 lines);
  `scratch/essay/assets/attendance.svg`;
  `packages/render-html/src/render-core-vocab.ts` (figure/img/table).

---

## Cross-recipe notes for the site build

- **Sequencing:** Recipes 2 and 3 share `load-demo` — author 2 first, 3 as a
  focused excerpt. Recipes 9 and 10 share the `parse → resolve → expand` front
  half and the `fileReader` correction — state that seam once and link. Recipe 11
  is the capstone for 1/3/5.
- **Live-example seeds:** Recipes 1, 3 (inline/schema forms), 5, 6, and 11 are
  single-file and safe to seed the in-browser playground with (client
  parser+runtime+render-html). Recipes 2, 4, 7, 8 are multi-file and/or need
  `@load`/`--allow-exec` → show as static build-time output, or reduce to a
  single-file excerpt for the playground.
- **Honesty guardrail:** re-run each recipe's build before publishing; block any
  recipe whose grounding has gone red. **Four** named examples are red **today**
  (`13-conditionals`, `14-iteration`, `15-references`, `16-additive-partials`) —
  the recipes route around them, but repairing the four would let Recipes 4, 6,
  and 8 ground on the canonical files.

---

## Final grounding status — per recipe (verified 2026-07-05)

| # | Recipe | Grounding | Verified build |
|---|---|---|---|
| 1 | Thesis / essay → PDF | `scratch/essay/essay.wit` | ✅ green — 3-page, 158,820-byte PDF |
| 2 | Report with live data | `examples/load-demo/report.wit` | ✅ green — `--sources … --allow-exec --fragment` |
| 3 | CSV → table | `examples/load-demo/` + snippets built here | ✅ green (file, inline, and schema forms) |
| 4 | Manuscript in chapters | `examples/thesis/` | ✅ green; `15-references` cited-for-shape (❌ red) |
| 5 | Creative writing | snippet built here | ✅ green (`story.wit --fragment`) |
| 6 | RPG / interactive script | snippets built here | ✅ green; `13`/`14` cited-for-concept (❌ red) |
| 7 | Website in Wit | `website/site.wit` | ✅ green — `-o site.html --raw`, 31,327 bytes |
| 8 | Bibliography across files | `examples/thesis/` | ✅ green; `16-additive-partials` cited-for-concept (❌ red) |
| 9 | Embed the parser | pipeline run here | ✅ green — parse→load→resolve→expand→renderHtml |
| 10 | Custom renderer | walk run here + shipped renderers | ✅ green — plain-text walk observed |
| 11 | Annotated full document | `scratch/essay/essay.wit` | ✅ green — line-by-line against rendered HTML |

**Every recipe ships green.** Four cite a broken committed example *for concept
only* (Recipes 4, 6×2, 8) and re-ground the runnable steps on verified files or
snippets built during this pass. The four escalations (repair `13-conditionals`,
`14-iteration`, `15-references`, `16-additive-partials`) would move those
citations from "concept" to "canonical".
