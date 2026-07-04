# Content design — Guides (`/docs/guides`)

Planning doc for the **Guides** section of the Wit docs site: cross-audience
concept deep-dives. This is the COMPREHENSIVE plan — every page is specified to
the [AUTHORING-STANDARD](AUTHORING-STANDARD.md) depth bar (concept · why ·
progressive examples · **every** edge cited to a fixture · common mistakes ·
see-also · sources). This is a PLAN, not final prose.

Audience: **both** (writers and developers), leaning writer for the authoring
pages and developer-adjacent for the scripting recipes.

The Parameters material — the densest edge surface in the language — is **split
into one page per call form** (bare/block, pipes, parens, record-arg,
form-fill, colon-scatter) plus an overview. Data, logic, references,
combinations, and a new **Gotchas & ambiguity** page carry the rest of the
edges. Every fixture in the fixture folders owned by this section is mapped to a
page in the **Fixture coverage checklist** at the end.

Every example on these pages should be **live in the playground** and, where a
fixture input exists, **seeded from the fixture `.wit`** (guaranteed-correct,
can't drift).

---

## 0. Verified ground truth (read before authoring any page)

Confirmed against `packages/{parser,runtime,render-html}/src` and by building
tiny `.wit` files through `node packages/cli/dist/bin.js build x.wit
--fragment` on 2026-07-05. Ground every page in this. Do **not** transcribe
`docs/spec.md` (stale) or the skill package verbatim (predates recent
features; see [FINDINGS.md](FINDINGS.md) and "Corrections" at the end).

**The seven ways to pass params to a node use.** All bind by the same capture
names. Each verified individually against `#card ||title, status||` — all six
buildable forms render **identically** (`Title Alpha / Status draft`):

| Form | Shape | Self-closing? | Carries a body? |
|---|---|---|---|
| bare reference | `@card` | n/a (no params) | no |
| pipes | `@card \|title X\| \|status Y\| card@` | no — composes with a body | yes |
| parens (space) | `@card(title X, status Y)` | **yes** (`)` ends it) | no |
| parens (colon) | `@card(title: X, status: Y)` | **yes** | no |
| record-arg (hyphen) | `@card { title - X, status - Y }` | **yes** (`}` ends it) | no |
| record-arg (colon) | `@card { title: X, status: Y }` | **yes** | no |
| form-fill body | `@card`⏎`  title: X`⏎`  status: Y`⏎`card@` | no | body **is** the params |
| colon scatter | `@card title:X status:Y card@` | no — single-line body | yes |

**Mixing rule (CORRECTED — verify on the page).** `parens` and `pipes` **can be
combined on one node and they MERGE** — `@card(title X) |status Y| card@`
renders both (verified). The **only** exclusive form is **record-arg**:
combining `{…}` with parens or pipes collected *before* it is a hard parse error
`E_MIXED_PARAM_SOURCE` (verified for `@card |status Y| {title X}` and
`@card(status Y) {title X}`). A record-arg *followed* by pipes does **not**
merge either — record-arg self-closes at `}`, the trailing pipes are dropped,
and a now-unfilled capture surfaces as `E_MISSING_RECORD_FIELD` (verified). The
old "record-arg cannot combine with parens or pipes" is the right instinct but
the error only fires when the extra source is parsed before the `{…}`.

**Greedy-bind hazard (CORRECTED — real, reproduced).** A **bodyless** pipes
call (`@card |title X| |status Y|` with no `card@` on its line) will **greedily
swallow forward** to the next matching `card@` when no blank-line paragraph
break separates them, producing `E_UNCLOSED_NODE` (verified:
`@card |…|`⏎`@card |…| card@` → *unclosed @card*). A **blank line** between them,
or a mismatched-name closer ahead, breaks the greed and each renders on its own.
Rule: give a pipes call an explicit `name@`, or put a blank line after it, or
place a bodyless pipes call **last**. (This is why fixture `26-all-param-forms`
orders the self-closing pipes form last — and why it currently still fails
`E_UNCLOSED_NODE`; see FINDINGS C-7.)

**Statements are line/whitespace-delimited (NEW gotcha).** `(if …)`, `(each …)`,
`(end)` are recognized only when the `(` is preceded by whitespace / start of
line. A statement **glued to a preceding `)`** is not recognized and renders
literally: `(each …) (if …) … (end) (end)` works; `(each …)(if …)…(end)(end)`
prints `(if true is true)…(end)(end)` as text (verified). Keep a space or
newline between adjacent statements.

**Interpolation reality (verified, easy to get wrong).** `{{path}}` in normal
prose renders **literally** — `The book {{book.title}}` outputs the text
`{{book.title}}` (verified: renders `The book {{book.title}} versus The Keeper
here.`). `{{…}}` only interpolates **inside `@@` raw-node bodies**. To put data
into prose, use **data access** `@book.title` (verified: renders `The Keeper`).
`::name::` is a capture hole **inside a def body** only.

**Operators.** Conditionals support exactly **`is`** and **`equals`** (exact
synonyms). No `==`, `!=`, `<`, `>`, `not`, `and`, `or`, `contains`. Equality is
**string-coercion**: `@meter.value is 99` is **true** because the number `99`
stringifies to `"99"` (verified).

**Not shipped (roadmap — do NOT document as working):** `##name … name##` raw
component defs; `{{…}}` in prose/strings; the `@name: … !!` form-fill shape
(paused — present in `26-all-param-forms/showcase.wit` only as a commented
PENDING block, no parser support); `contains`; conditional `reference`.

---

# PART A — Node use & the parameter forms (the split)

The old single "Parameters" page is replaced by an **overview + one page per
form**. Each form page is grounded in its own fixture folder and enumerates
every edge there.

---

## Node use & the bare reference — `/docs/guides/node-use`

- **Concept.** `@name` opens a node use; the matching `name@` closes it. A
  bare `@name` with no body/closer is a **reference** to a defined entity; a
  `@name.field` opens a data-access path. Whether a node renders block or inline
  is a **renderer decision from position** (standalone line vs inside a
  paragraph), never a writer decision.
- **Why / when.** This is the atom every other page builds on — before params,
  before defs. Readers need the handle boundary rules and the block/inline model
  first.
- **Outline.**
  1. `@name … name@` — open/close; block vs inline by position.
  2. The bare reference `@name` and where the handle ends.
  3. The identifier character class.
  4. Access paths `@name.field` in prose.
  5. Nesting and empty bodies.
- **Examples to show (verified, cite fixture).**
  - Block vs inline pair: `@aside`⏎`body`⏎`aside@` vs `… @highlight x highlight@ …`
    (`04-nodes-use/block-name-body`, `inline-name-body`).
  - Bare reference: `@weil, ` (comma ends handle) and `@weil argued that …`
    (space ends handle) — (`04-nodes-use/bare-reference`,
    `bare-reference-adjacent-prose`).
  - Access in prose: `The title is @book.title for this edition.`
    (`04-nodes-use/dotted-access`).
- **Every edge (each cited).**
  - Handle character class is `[A-Za-z0-9_-]`; `.` opens access; any other byte
    ends the handle: hyphen mid-name `@paper-stats` (`hyphenated-name`), trailing
    digit `@h1`/`@h2` (`numeric-suffix`), underscore `@chapter_one`
    (`underscored-name`), plain letters `@weil` (`bare-reference`).
  - Boundary against prose: a following space or comma ends the handle
    (`bare-reference-adjacent-prose`, `bare-reference`).
  - Access paths are legal wherever a bare reference is (in prose too)
    (`dotted-access`).
  - Nested same-name uses pair LIFO: `@x @x … x@ x@` (`nested-same-name`).
  - Empty body `@x x@` → an **empty children array**, not null; the inter-marker
    space is not a child (`empty-body`).
  - `@`-boundary against email: a **letter before `@`** never opens a use, so
    `keeper@example.org` stays prose (`16-ambiguity/email-in-prose` — see
    Gotchas).
- **Common mistakes.** Expecting `@weil.` (sentence-final period) to be part of
  the handle — it ends the handle (period is a non-handle byte with no following
  identifier). Expecting `@Weil` to match `@weil` — handles are case-sensitive
  exact-match (only *access segments* fuzzy-match).
- **See also.** Parameters overview; Defining nodes; Data access; Gotchas.
- **Sources.** `04-nodes-use/` (all 10 fixtures) + its `_notes.md`;
  `packages/parser/src/{lexer-nodes,parser-nodes}.ts`;
  `examples/04-using-nodes.wit`.

---

## Parameters — overview & choosing a form — `/docs/guides/parameters`

- **Concept.** One template, many call syntaxes. "The form you open with is the
  form that closes." This page teaches the shared slot grammar, the mixing rule,
  the greedy-bind hazard, and a decision table; each form gets its own detail
  page.
- **Why / when.** A reader needs to pick a form and avoid the two cross-form
  traps (mixing, greedy-bind). Everything form-specific lives on the linked
  pages.
- **Outline.**
  1. The idea: same capture names, six buildable call syntaxes (table above).
  2. The **shared slot grammar** (pipes, parens, record-arg all use it).
  3. Type-probing of values.
  4. The mixing rule (parens+pipes merge; record-arg is exclusive).
  5. The greedy-bind hazard.
  6. Choosing a form (decision table).
- **Examples to show (verified).**
  - "Same card, six ways" — one `#card ||title, status||` template, six tabs,
    identical output (all six verified render `Title Alpha / Status draft`; lift
    from `26-all-param-forms/showcase.wit`, but note the showcase file itself
    fails to build — use the individual forms).
  - Merge: `@card(title Alpha) |status draft| card@` → both bind (verified).
  - Break-it: the greedy-bind hazard with a one-click fix (add `card@`).
- **Every edge (each cited).**
  - **Slot grammar** (`parser-params.ts`, same inside pipes and parens):
    positional = single token no space no `!` → `{name:null, value}`; named =
    `key value`, first word is key, rest is value (`splitFirstWord`
    `/^(\S+)\s+(.*)$/`); named-multiword = `key words - value` (space-hyphen-
    space `HyphenSeparator`); flag = trailing `!`, any word count →
    `{name, value:''}`; a mid-value `!` is punctuation. A value that is exactly
    `"quoted"` is unquoted with `\"`/`\\` recognized (`maybeUnquote`).
  - **Type-probing:** every non-flag slot value is run through `probeParamValue`
    (`withTypedValue`), so a value passed via any form can become a typed scalar
    / record / collection and be a valid `(each)` / `@x.field` / `(if)` target
    (see Typed-classified scalars).
  - **Mixing:** parens + pipes **merge** (verified); record-arg is exclusive →
    `E_MIXED_PARAM_SOURCE` when parens/pipes precede the `{…}`
    (`parser-record-arg.ts`); record-arg then trailing pipes drops the pipes.
  - **Greedy-bind:** bodyless pipes swallows forward to the next matching
    `name@` → `E_UNCLOSED_NODE` (verified); blank line or last-position fixes it.
- **Common mistakes.** Assuming record-arg merges with pipes (it errors / drops).
  Assuming parens+pipes error (they merge). Leaving a bodyless pipes call before
  another same-named node (greedy-bind).
- **See also.** Each form page below; Defining nodes; Typed scalars; Gotchas.
- **Sources.** `26-all-param-forms/` (showcase, intentionally-failing);
  `packages/parser/src/parser-params.ts`, `parser-record-arg.ts`,
  `parser-body-forms.ts`, `parser-body-scatter.ts`; `examples/05-parameters.wit`.

---

## Pipes `|…|` — the body-composing form — `/docs/guides/parameters/pipes`

- **Concept.** `@name |slot|` — the **only** param form that composes with a
  body. Pipes can sit on the open line or scatter through the body; duplicate
  keys resolve **last-one-wins**.
- **Why / when.** Reach for pipes when the node also has body content, or when
  you want to override a value mid-body. It is the form to pair with `name@`.
- **Outline.** Slot grammar recap → open-line vs scattered → last-one-wins →
  empty `||` → the two known bugs → the greedy-bind hazard.
- **Examples to show (verified).**
  - Named + positional + hyphen-key + flag in one call (lift from
    `examples/05-parameters.wit`).
  - `@scene`⏎`|mood calm|`⏎`… |mood tense| …`⏎`scene@` → `mood` = `tense`
    (`06-parameters-pipes/last-one-wins`).
  - Multiple pipes per line `@x |a x| |b y| |c z| x@`
    (`06-parameters-pipes/multiple-pipes-per-line`).
- **Every edge (each cited).**
  - Positional single token `|full|` (`bare-positional`); flag `|full width!|`
    → flag name `full width` (`flag-with-bang`); named `|mood calm|`
    (`basic-named`); multi-word **value** `|caption The second-order Fresnel
    lens|` (`multi-word-value`); multi-word **isolated** value
    (`multi-word-isolated`).
  - Multi-word key via ` - `: `|background colour - dark slate|`
    (`hyphen-multi-word-key`); embedded literal hyphen stays in a positional:
    `|well-known|` (`literal-hyphen-probe`).
  - Scatter + last-one-wins across the body (`last-one-wins`, `mid-body-scatter`).
  - Empty pipe `||` inside a body contributes zero params / errors in body
    context (`empty-pipe`).
  - Pipe-shaped **prose** stays literal: `The signal flag read red | white | red`
    is text, not slots (`pipe-in-body-text`).
  - **Known bug:** a `\n` inside a single `|…|` value does not span lines →
    `E_UNCLOSED_NODE` (`multi-line-value`). Use form-fill or a record-arg brace
    for multi-line values.
  - **Greedy-bind hazard** (see overview): bodyless pipes + a following `name@`.
- **Common mistakes.** Trying to put a newline inside `|…|` (bug). Forgetting the
  `name@` closer (greedy-bind). Writing `|full|` expecting a flag — it's a
  positional; a flag needs the trailing `!`.
- **See also.** Parameters overview; Parens; Form-fill; Defining nodes; Gotchas.
- **Sources.** `06-parameters-pipes/` (all 13 fixtures) + `_notes.md`;
  `parser-params.ts`; `examples/05-parameters.wit`.

---

## Parens `(…)` — self-closing params — `/docs/guides/parameters/parens`

- **Concept.** `@name(p, q)` — self-closing (the `)` ends the node), comma-
  separated, no body, no `name@`. Colon and space are interchangeable
  separators.
- **Why / when.** The compact inline form when a node needs params but no body —
  `@badge(tone good)`, `@figure(src lamp.png, caption The lens)`.
- **Outline.** Self-closing contract → colon vs space → the slot grammar →
  whitespace / trailing-comma / empty → the "then body" and multi-line traps.
- **Examples to show (verified).**
  - `@scene(mood calm, location harbour)` and `@scene(mood: calm)` — separators
    interchangeable (`05-nodes-parens/colon-separator`, `multiple-params`).
  - `@figure(src lamp.png, full width!, caption The lens)` — mixed positional /
    flag / named (`05-nodes-parens/mixed-params`, `named-and-flag`).
- **Every edge (each cited).**
  - Single named param (`single-named-param`); multiple params (`multiple-params`).
  - Colon separator equals space separator (`colon-separator`).
  - Multi-word flag `full width!` → whole-slot flag (`mixed-params`).
  - Multi-word key via ` - `: `@panel(background colour - dark slate)`
    (`hyphen-multi-word-key`).
  - Inner whitespace trimmed: `@x( a , b )` → `a`,`b` (`inner-whitespace`).
  - Trailing comma tolerated: `@x(a,)` (`trailing-comma`).
  - Empty parens `@x()` legal, distinct from bare `@x` (`empty-parens`).
  - Self-closing on its own line → block; following line is a separate paragraph
    (`self-closing`).
  - **Parens-then-body trap:** `@aside(tone wry) the keeper said nothing aside@`
    — the `)` already closed the node, so the trailing body + `aside@` is stray
    (`parens-then-body`). For a body, use pipes.
  - **Known bug:** a `(…)` call spanning a newline breaks — the rest of the call
    (incl. `)`) leaks into the surrounding text (`multi-line-call`). Keep parens
    calls on one line.
- **Common mistakes.** Adding a body/closer after `@x(…)` (parens is self-
  closing). Wrapping a multi-line call across lines (bug). Expecting `@x()` to be
  identical to `@x` (distinct `ParamSource`).
- **See also.** Parameters overview; Pipes (for bodies); Record-arg; Gotchas
  (em-dash vs ` - `).
- **Sources.** `05-nodes-parens/` (all 12 fixtures) + `_notes.md`;
  `parser-params.ts`; `examples/05-parameters.wit`.

---

## Record-arg `{ … }` — record literal as args — `/docs/guides/parameters/record-arg`

- **Concept.** `@name { field - value, … }` — a record literal placed after the
  handle becomes named args, bound by field name to captures. Self-closing (the
  matching `}` ends it). The **exclusive** form.
- **Why / when.** When the args read like structured data, or when you want the
  same `{ … }` record grammar (colon or hyphen, inline or block) at a call site.
- **Outline.** The record → params mapping → hyphen vs colon → inline vs multi-
  line → self-closing → the comma trap → the exclusivity rule.
- **Examples to show (verified).**
  - `@card { title - Alpha, status - draft }` → both bind (verified).
  - `@card { title: Epsilon, status: draft }` — colon separator
    (`26-all-param-forms/showcase` form 6).
  - Multi-line: `@reference_entry {`⏎`  author - …`⏎`  title - …`⏎`}`
    (`22-record-args/multi-line-record`).
- **Every edge (each cited).**
  - Single field `@x { a - 1 }` (`22-record-args/inline-single-field`); multi-
    field `@x { a - 1, b - 2 }` (`inline-multi-field`).
  - Binds to explicit captures (`template-expansion`) and to inferred captures
    (`template-implicit-captures`).
  - Multi-line brace with emphasis kept literal in values (`multi-line-record`).
  - **Comma-in-value trap:** an unquoted comma splits fields —
    `@cite { author - Boud, D., year - 2024 }` → `E_MALFORMED_RECORD` "record
    field missing key" (verified). Quote it: `{ author: "Boud, D.", year: 2024 }`
    (verified renders `Boud, D. (2024)`). (Same root cause as
    `09-records/comma-in-value` and FINDINGS C-2 / B-1.)
  - **Exclusive:** `@card |status Y| { title X }` and `@card(status Y) { title X }`
    → `E_MIXED_PARAM_SOURCE` (verified); `@card { title X } |status Y| card@` →
    record self-closes, pipes dropped, `E_MISSING_RECORD_FIELD` (verified).
- **Common mistakes.** Putting a comma inside an unquoted value. Trying to add
  pipes/parens to the same node. Expecting a body after `{ … }` (self-closing).
- **See also.** Data: records (same grammar); Escapes/quoting; Parameters
  overview (mixing rule).
- **Sources.** `22-record-args/` (all 5 fixtures) + `_notes.md`;
  `parser-record-arg.ts`, `parser-data.ts` (`tryParseRecordFromText`).

---

## Form-fill body — the body IS the params — `/docs/guides/parameters/form-fill`

- **Concept.** When a node body reads like a form — every line `key: value` — the
  body **becomes** the params. `@card`⏎`  title: X`⏎`  status: Y`⏎`card@`.
- **Why / when.** The most readable form for many-field templates (citations,
  cards, front-matter). Also the way to pass **multi-line** values (which pipes
  and parens can't).
- **Outline.** The trigger rule → line grammar → multi-line values → quoting &
  emphasis → NodeDef bodies (block / value-block → record) → the single-line
  exception.
- **Examples to show (verified).**
  - `@cite`⏎`  author: Smith`⏎`  year: 2024`⏎`cite@` — `year` typed as number
    (`23-form-fill/template-invocation`).
  - Multi-line value: `body:`⏎`    First line.`⏎`    Second line.` → one value
    `First line.\nSecond line.` (`23-form-fill/value-multi-line`).
  - Quoted comma: `author: "Came, H."` (`23-form-fill/with-quoted-string`).
- **Every edge (each cited).**
  - **Trigger** (`isFormFillRawText`): body has a `\n`, and the first non-blank,
    non-comment line matches `^\s*<id>\s*:`, **and there are ≥2 content lines**.
    A **single** content line is not form-fill → falls to colon-scatter (the
    `@x k:v x@` rule).
  - Line grammar (`parseFormFillFields`): each line `<id>:<value>`; a non-
    matching line → `E_MALFORMED_FORM_FIELD`; `~` comments and blanks ignored
    (`with-comments`); one optional leading space trimmed, trailing ws trimmed.
  - Quoted value protects commas and forces string (`with-quoted-string`);
    emphasis markers `_…_` / `*…*` survive as **literal** characters because the
    inline parser is bypassed (`with-emphasis-in-value`, `value-emphasis-renders`).
  - Multi-line value: `key:` with an empty same-line value + strictly-deeper-
    indented lines consumes the block, common indent stripped, joined with `\n`
    (`value-multi-line`); blank lines inside are kept (`value-multi-paragraph`);
    dedent ends the value (`value-block-end-by-dedent`); an indented `key:`-shaped
    line is **content, not a new field** (`value-indented-key-shape-is-content`);
    empty value then next field (`value-empty-then-next-field`).
  - NodeDef bodies: block `#point`⏎`  x: 3`⏎`  y: 7`⏎`point#` and value-block
    `#point:`⏎`  x: 3`⏎`  y: 7`⏎`!!` both collapse to a record dataDef
    (`block-record-def`, `value-block-record-def`).
  - Realistic: a `+#bibliography` value-block wrapping a `@reference_entry`
    form-fill with quoted commas (`bibliography-style`).
  - Values are type-probed (`year` → number) at capture time.
- **Common mistakes.** A one-line body isn't form-fill (it's scatter). Forgetting
  that emphasis is literal in values. Indenting a real second field under a
  `key:` (it becomes part of the value).
- **See also.** Colon-scatter; Record-arg; Data: records; Escapes (form-fill
  escapes `\:` `\"` `\\` `\,`); Interpolation & captures (rich values).
- **Sources.** `23-form-fill/` (all 13 fixtures) + `_notes.md`;
  `parser-body-forms.ts` (`isFormFillRawText`, `parseFormFillFields`,
  `takeIndentedBlock`, `formFillToParams`, `formFillToRecord`).

---

## Colon-scatter & body-scatter — inline `key:value` — `/docs/guides/parameters/colon-scatter`

- **Concept.** In a **single-line** prose body, `<id>:<v>` tokens with **zero
  whitespace** are lifted out as params; the rest stays prose.
  `@figure src:lamp caption:"Second-order Fresnel" figure@`.
- **Why / when.** The lightest inline way to tag a node mid-sentence. Its strict
  no-whitespace contract is what keeps ordinary prose (and email addresses) from
  being mis-lifted — but it also produces a documented false positive.
- **Outline.** The strict contract → value kinds → last-one-wins → the escape
  opt-out → the false positive → node/emphasis (body-scatter) values.
- **Examples to show (verified).**
  - `@thing name:Tauraj thing@` → `name=Tauraj` (`24-colon-scatter/body-scatter-single`).
  - `@thing mode:"complex value" thing@` → space-bearing value
    (`body-scatter-quoted`).
  - `@figure src:lamp caption:"…" figure@` mid-prose.
- **Every edge (each cited).** Contract (`SCATTER_RE`,
  `parser-body-scatter.ts`): id = `[A-Za-z][A-Za-z0-9_-]*`; value = bare
  `[A-Za-z0-9_-]+`, `"quoted"` (spaces allowed), `_italic_` / `*bold*`, or any
  `@node…` (bare, parens, or `@x body x@`); the byte before `<id>` must be
  start-of-string or a non-word non-`\` char; **zero whitespace anywhere,
  including between `:` and value.**
  - Single (`body-scatter-single`), multiple with residual prose
    (`body-scatter-multi`), duplicate → last-wins (`body-scatter-override`),
    quoted (`body-scatter-quoted`).
  - Value kinds via sibling-lift (body-scatter): italic (`body-scatter-italic-value`),
    bold (`body-scatter-bold-value`), closer-form node (`body-scatter-node-value`),
    parens/self-closing node (`body-scatter-self-closing-node-value`), multiple
    node params (`body-scatter-multiple-node-params`), node-then-bare
    (`body-scatter-node-then-bare`), override-with-node (`body-scatter-override-with-node`).
  - **Space after `:` breaks the contract → prose:** `@thing key: @v body v@
    thing@` lifts nothing; `@v … v@` stays a real inline node
    (`body-scatter-space-after-colon-is-prose`, verified `paramsSource:"none"`).
  - **Escape opt-out:** `name\:Tauraj` suppresses lifting; the `\` is stripped
    (`body-scatter-escape`).
  - **False positive (sharp edge):** `@thing the variable name:Tauraj is bad
    thing@` still lifts `name=Tauraj` — a strict-contract mis-fire
    (`false-positive-prose`). Escape (`name\:`) or add a space (`name: …`).
- **Common mistakes.** Writing `key: value` (with a space) and expecting it to
  lift (it stays prose). A URL/ratio/time like `see foo:bar` mid-prose lifting
  unintentionally (false positive) — escape or space it.
- **See also.** Form-fill (multi-line sibling); Escapes; Gotchas (false
  positives); Parameters overview.
- **Sources.** `24-colon-scatter/` (all 14 fixtures) + `_notes.md`;
  `parser-body-scatter.ts` (`SCATTER_RE`, `TRAILING_KEY_RE`, sibling-lift),
  `parser-body-forms.ts` (`stripEscapes`).

---

# PART B — Defining nodes, captures, interpolation

## Defining nodes (templates) — `/docs/guides/defining-nodes`

- **Concept.** `#name … name#` defines a template that `@name` uses expand.
  Three body shapes; a `||a, b||` capture list (explicit or inferred); `::name::`
  holes and a `...` body slot.
- **Why / when.** The core of reuse — cards, citations, chapter headers. Read
  before Interpolation & captures, Additive partials, Self-organising documents.
- **Outline.** Three shapes → capture lists (explicit vs inferred) → `::name::`
  → body slot `...` → forward references & def-references-def → scope.
- **Examples to show (verified).**
  - Block def with captures + interpolation: `#cite ||author, title, year||
    ::author:: (::year::). _::title::_. cite#` (`07-definitions/captures-and-interpolation`).
  - Body slot: `#panel … ... … panel#` (`07-definitions/body-slot`).
  - Inferred captures: `#tpl hello ::name:: tpl#` used as `@tpl |name world|`
    (`21-optional-captures/without-captures-inferred`).
- **Every edge (each cited).**
  - **Shapes** (`6.S.4`): block (`block-definition`), single-line `#x: v !!`
    (`single-line-def`, `single-line-def-with-captures`), value-block
    `#x:`⏎`…`⏎`!!` (`multi-line-value`).
  - **Capture list**: explicit `||a, b, c||` (`multi-capture-list`,
    `captures-and-interpolation`); optional — when absent, inferred by scanning
    the body for `::ident::` in source order (`resolveCaptures`,
    `gatherCapturesFromBody`) — inline (`21/without-captures-inferred`), block
    (`21/block-def-inferred`), explicit-kept (`21/with-explicit-captures`).
  - **`::name::`** is recognized only inside a def body (`interpolation-only`,
    `captures-body-slot-interpolation`).
  - **Body slot `...`** splices the use-site body once (`body-slot`,
    `body-slot-only`, `captures-body-slot-interpolation`).
  - **Forward references** resolve — `@x` before `#x` (hoisted)
    (`forward-reference`).
  - A def body may reference another def: `#bio … @keeper … bio#`
    (`definition-references-definition`, and `17-combinations/def-of-def`).
  - Capture inference walks into paragraphs/emphasis/nodeUse/if/each bodies
    (`parser-captures.ts` `walkNode`).
- **Common mistakes.** Using `::name::` in prose (only lives in a def body).
  Redefining `#x` twice (error unless additive `+#x`). Expecting a use-site param
  to reach a `(if)` unless the def surfaces it.
- **See also.** Interpolation & captures; Parameters (how uses feed defs);
  Additive partials; Escapes (`!!`).
- **Sources.** `07-definitions/` (all 12) + `21-optional-captures/` (all 3) +
  `_notes.md`; `parser-captures.ts`; `examples/07-defining-nodes.wit`,
  `examples/08-single-line-defs.wit`.

---

## Interpolation & captures — `/docs/guides/interpolation-captures`

- **Concept.** Two substitution mechanisms: rich-content captures `::name::` /
  body slot `...`, and scalar interpolation `{{path}}`. Captures carry **rich
  markup**, not just scalars.
- **Why / when.** To understand what a captured value becomes (real blocks vs
  text) and exactly where `{{…}}` is live.
- **Outline.** Captures recap → **content-in-captures** (the rich-value model) →
  `{{path}}` scalar holes and their one live context → `{{…}}` vs `::name::` vs
  `@field`.
- **Examples to show (verified).**
  - A capture whose value is a bulleted list renders as a **real list**
    (`25-content-in-captures/value-contains-list`).
  - `{{…}}` inside `@@style`: `.x { color: {{theme.accent}} }` with
    `#theme: { accent - green }`.
  - Side-by-side: `@book.title` (works in prose) vs `{{book.title}}` (renders
    literally, verified).
- **Every edge (each cited).**
  - **Captures carry rich content** (fixture 25's whole point): a captured value
    (form-fill body, record field, pipe value) is **re-parsed as a full
    document** at substitution / access time. Block content becomes real blocks
    (`value-contains-heading` → real `@h1`; `value-contains-list` → real
    `@ul`/`@li`; `multi-paragraph-value` → two paragraphs); at an inline position
    a single-paragraph value splices its inlines and a multi-block value lifts
    into blocks (`value-at-inline-position`); an inline-only value fast-paths
    (`value-with-emphasis-only`).
  - **`{{path}}`** is a doubled-brace **scalar** hole
    (`{{ [A-Za-z0-9_.-]+ }}`, inner whitespace allowed), resolving against
    iteration vars / data defs / a bare scalar def, coercing number→string,
    boolean→string, null→`""`; a container → `E_UNRESOLVED_REFERENCE`.
  - **Where `{{…}}` is live: only inside `@@` raw-node bodies.** In prose `{` is
    record-arg syntax, so `{{book.title}}` renders literally (verified). Frozen
    `@@@` bodies make `{{…}}` inert too.
  - **Two outputs, same lookup:** `{{name}}` → scalar string (class names,
    colors, CSS holes); `::name::` / `...` → rich content. **Data into prose =
    `@name.field`, never `{{…}}`** (FINDINGS D-2).
- **Common mistakes.** Expecting `{{book.title}}` to interpolate in a paragraph
  (it doesn't). Using `::loopvar.field::` in prose (skill-file drift; use
  `@loopvar.field`).
- **See also.** Defining nodes; Data access; Literal & raw nodes (`{{…}}` in
  `@@`); Form-fill (rich values).
- **Sources.** `25-content-in-captures/` (all 5) + `_notes.md`;
  `parser-captures.ts`, `lexer-defs.ts` (`tryInterpolation`);
  `packages/runtime/src/{expander-inline,expander}.ts` (`INTERP_HOLE`,
  `resolveInterpScalar`); `examples/07-defining-nodes.wit`.

---

# PART C — Data

## Data: records, collections, scalars — `/docs/guides/data`

- **Concept.** Declare structured data inline with `#name: value`, where the
  value is a record `{ … }`, a collection `[ … ]`, or a scalar.
- **Why / when.** The single source of truth the rest of a self-organising doc
  reads from.
- **Outline.** `#name: value` → records (separators, inline/block, multi-word
  keys, nested, quoted, multi-line values) → collections (item separation,
  records, nesting) → the value-block `!!` form → gotchas.
- **Examples to show (verified).**
  - Inline record `#world: { location - Bag End, time - night, storm - true }`.
  - Colon separator `#point: { x: 3, y: 7 }` (`09-records/colon-separator`).
  - Quoted comma `#cite: { author: "Came, H.", year: 2024 }`
    (`09-records/quoted-string-value`).
  - "One item or three?": `[ x y z ]` → **one** item `x y z`; `[ x, y, z ]` →
    three (verified) (`10-collections/whitespace-separator`, `inline-values`).
- **Every edge (each cited).** *(confirmed against `parser-data.ts`,
  `canonical-key.ts`.)*
  - **Record separators:** `key - value` (space-hyphen-space) or `key: value`
    (colon) — both → the same field (`inline-single-field`, `colon-separator`);
    nested value omits the separator: `key { … }` / `key [ … ]` (`nested-record`).
  - **Fields separated by `,` or newline**, never bare whitespace; inline
    (`inline-multi-field`) and block (`multi-line-record`) are identical;
    trailing comma tolerated (`trailing-comma`); empty `{ }` legal
    (`empty-record`).
  - **Multi-word keys** stored verbatim: `years at post` (`multi-word-key`);
    multi-word values trimmed (`multi-word-value`).
  - **Scalar typing** (eager, at parse): `true`/`false`→boolean, `null`→null,
    `NUMBER_RE = /^-?(?:[0-9]+|[0-9]+\.[0-9]+)$/`→number, else string
    (`scalar-types`) — see Typed-classified scalars.
  - **Quoted strings** make bytes literal (commas, newlines become content) and
    force string; only `\"`/`\\` recognized; unterminated → `E_UNTERMINATED_STRING`
    (`quoted-string-value`, `quoted-string-multi-line`).
  - **Multi-line record value:** `key:` empty + deeper-indented lines, common
    indent stripped, terminated by a top-level `,` or `}`
    (`block-record-multi-line-value`, `-with-close`, `-with-comma-terminator`).
  - **Comma-in-value trap:** an unquoted comma splits fields →
    `E_MALFORMED_RECORD` "record field missing key" (`comma-in-value`; FINDINGS
    C-2). Quote it.
  - **Collections** `[ … ]`: items separated by `,` or newline, **not
    whitespace** (`whitespace-separator` → one item; `inline-values` → three);
    multi-word items kept whole (`multi-word-items`); mixed per-item typing
    (`mixed-types`); of records inline (`inline-records`) and block
    (`multi-line-records`, `multi-line-values`); nested (`nested-collection`);
    trailing comma tolerated (`trailing-comma`); empty `[ ]` legal
    (`empty-collection`).
  - **Value-block `!!`** wraps a complex value (may span lines, may contain
    nodes) — why some record defs end in ` !!`.
- **Common mistakes.** Unquoted comma in a value (splits fields). Expecting
  `[ a b c ]` to be three items (it's one). Expecting `.5` / `1e3` to be numbers
  (strings — see Typed scalars).
- **See also.** Data access; Typed-classified scalars; Record-arg (same
  grammar); Escapes/quoting.
- **Sources.** `09-records/` (all 16) + `10-collections/` (all 10) + `_notes.md`;
  `parser-data.ts`; `examples/10-records.wit`, `examples/11-collections.wit`,
  `examples/08-single-line-defs.wit`.

---

## Data access — dot notation — `/docs/guides/data-access`

- **Concept.** Reach into records/collections from prose: `@name.field`,
  `@collection.0.field`, deep chains. Keys fuzzy-match by canonical form.
- **Why / when.** The verified way to put data into prose (not `{{…}}`).
- **Outline.** `@name.field` → zero-based index → deep chains → canonical-key
  fuzzy matching → where a chain ends; missing keys.
- **Examples to show (verified).**
  - `The keeper was @keeper.name.` — the sentence `.` ends the chain
    (`11-data-access/field-access`).
  - `@findings.0.claim`, `@findings.1.strength` (`index-access`,
    `access-into-collection-of-records`).
  - `@keeper.history.years` (`access-into-nested-record`); `@x.y.z.w`
    (`deep-chain`).
  - camel `@keeper.yearsAtPost` and snake `@keeper.years_at_post` both → `31`
    (verified) (`fuzzy-match-camel`, `fuzzy-match-snake`).
- **Every edge (each cited).**
  - Collections index by **zero-based number**; digit segments kept as strings
    disambiguated at resolve (`index-access`).
  - **Canonical-key matching** (`canonicalizeKey`): lowercase, then keep only
    `[a-z0-9]` — spaces, hyphens, underscores dropped and camelCase collapses.
    `years at post` reachable as `yearsAtPost` / `years_at_post` /
    `Years At Post`. Two keys colliding on one canonical form →
    `E_AMBIGUOUS_RECORD_KEY`.
  - **Critical caveat (contradicts an old example comment):** a **space
    terminates the segment**. `@keeper.years at post` reads only `years`
    (verified → `@keeper.years` unresolved, `at post` left as prose)
    (`fuzzy-match-spaces`; FINDINGS C-4). Multi-word keys are reachable **only**
    via space-free forms.
  - A trailing `.` with no valid segment ends the chain (`field-access`).
  - A **missing field is not a parse error** — resolved at expand time
    (`missing-field`; renders `<span class="wit-unresolved">…</span>`).
- **Common mistakes.** Typing spaces into an access (`@keeper.years at post`) —
  use camel/snake. Expecting a missing field to fail at build (it degrades at
  expand).
- **See also.** Data; Typed scalars; Iteration/Conditionals (access targets);
  Interpolation (why `@field`, not `{{}}`).
- **Sources.** `11-data-access/` (all 9) + `_notes.md`;
  `packages/runtime/src/canonical-key.ts`; `examples/12-accessing-data.wit`
  (with the space-caveat correction).

---

## Type-classified scalars — `/docs/guides/typed-scalars`

- **Concept.** A bareword value is eagerly classified at parse time into
  boolean / null / number / string; quotes force string.
- **Why / when.** The class drives conditionals, truthiness, iteration, and
  `{{…}}` coercion.
- **Outline.** Eager classification → the rules → quotes/escapes force string →
  where the type shows up.
- **Examples to show (verified).**
  - `#report: { title - Q3 Review, quarter - 2024, final - true }` → string /
    number / boolean (`09-records/scalar-types`).
  - `[ 1, two, true ]` → number / string / boolean (`10-collections/mixed-types`).
  - `"2024"` stays string; `.5` / `5.` / `1e3` / `+1` stay strings.
- **Every edge (each cited).** Order (`classifyScalar`): `true`/`false`→boolean;
  `null`→null; `NUMBER_RE = /^-?(?:[0-9]+|[0-9]+\.[0-9]+)$/`→number; else string.
  The regex is strict — no leading/trailing bare dot, no exponent, no unary `+`.
  Quotes/escapes force string. Classification applies to record fields
  (`scalar-types`), collection items (`mixed-types`), **and param values**
  (`probeParamValue`, so any call form can pass a typed target).
- **Common mistakes.** Assuming `"2024"` compares equal to `2024` — both
  stringify to `"2024"`, so they *do* compare equal in a conditional, but
  `"2024"` is not a *number* for arithmetic-shaped logic. Assuming `1e3` is a
  number.
- **See also.** Data; Conditionals; Iteration; Interpolation (coercion).
- **Sources.** `parser-data.ts` (`classifyScalar`, `NUMBER_RE`,
  `probeParamValue`); `09-records/scalar-types`, `10-collections/mixed-types`.

---

# PART D — Logic

## Conditionals — `/docs/guides/conditionals`

- **Concept.** `(if @path is value) … (end)` shows content only when data says
  so; `(if @path) … (end)` tests truthiness.
- **Why / when.** Status banners, draft asides, gated variants.
- **Outline.** Comparison form → `is`/`equals` synonyms & the missing operators →
  existence/truthiness → `(else)` / empty branches / nesting → what's truthy.
- **Examples to show (verified).**
  - `(if @book.status is draft) DRAFT. (end)` → renders (verified).
  - `(if @book.status equals final) … (else) NOTFINAL. (end)` → else branch
    (verified).
  - Existence `(if @book.flag) TRUTHY. (end)` → renders (verified).
  - Nested `(if @lamp.lit) (if @lamp.oil is full) … (end) (end)`
    (`12-conditionals/nested-ifs`).
- **Every edge (each cited).** *(confirmed against `expander-conditions.ts`.)*
  - **Only `is` / `equals`, exact synonyms** (`is-comparison`,
    `equals-comparison`). No `==`, `!=`, `<`, `>`, `not`, `and`, `or`,
    **`contains`** (skill-file drift; FINDINGS D-3).
  - RHS is a bareword or number: `(if @meter.value is 99)` — **true**, because
    equality is **string-coercion** (`stringifyForEquality`): number `99` →
    `"99"` (`compare-against-number`, verified truthy). Records/collections
    stringify to `""`, so a container never equals a literal
    (`compare-against-string`).
  - **Existence/truthy** — bare `(if @path)`, no operator (`truthy-bare-reference`).
    **Falsy set** (`isTruthy`): missing/unresolved, `""`, the string `"false"`,
    number `0`, boolean `false`, `null`/nullValue, empty `{}`, empty `[]`.
    Everything else truthy.
  - `(else)` optional (`if-else-end`); empty then/else legal no-ops
    (`empty-then-body`, `empty-else-body`); ifs nest with their own `(end)`
    (`nested-ifs`); then-only basic (`if-end-basic`).
  - Conditions reference already-defined static data / iteration vars.
- **Common mistakes.** Reaching for `contains`, `<`, `>`, `and`/`or` (don't
  exist). Comparing a whole record to a literal (never equal). Gluing `(if` to a
  preceding `)` (not recognized — see Gotchas).
- **See also.** Iteration; Data access; Typed scalars; Faceted content; Gotchas.
- **Sources.** `12-conditionals/` (all 10) + `_notes.md`;
  `packages/runtime/src/expander-conditions.ts`;
  `packages/parser/src/{lexer-statements,parser-statements}.ts`;
  `examples/13-conditionals.wit`.

---

## Iteration — `/docs/guides/iteration`

- **Concept.** `(each @collection as item) … (end)` renders one block per item,
  in source order.
- **Why / when.** TOCs, lists, tables, any repeated view of a collection.
- **Outline.** The form → scalars vs records → scope & shadowing → what's missing
  (no index) → empty collections → nesting → combining with `(if)`.
- **Examples to show (verified).**
  - Over scalars: `(each @themes as item) The watch returned to @item. (end)`
    (`13-iteration/each-over-values`).
  - Over records: `(each @watchers as item) @item.name kept the @item.post. (end)`
    (`each-over-records`).
  - Each-with-if (verified renders one row): `(each @hands as item) (if
    @item.awake is true) @item.name … (end) (end)` (`each-with-if`).
  - Nested: `(each @decks as deck) … (each @deck.hands as hand) @hand, (end) (end)`
    (`nested-each`).
- **Every edge (each cited).** *(confirmed against `expander-iteration.ts`.)*
  - **Collections only** — a non-collection target → `E_NOT_ITERABLE` (records
    and scalars are not iterable). No "iterate a record's fields" form; reach a
    nested list by dotted target `@deck.hands`.
  - Inside the body `@item` is the whole element; `@item.field` walks in
    (`each-over-records`). Loop vars usable inside param values:
    `@watch |keeper @item.name|` (`body-with-params`).
  - **Scope is body-local; the loop var shadows a same-named global**
    (`item-name-shadowing` — global `#item: solitary` stays `solitary` outside
    the loop; inside, `@item` is the element). Precedence: iteration env
    (innermost first) → data defs → node defs.
  - **No index / position / first / last / counter** — call it out.
  - **Empty collection emits nothing**, not an error (`empty-collection`); empty
    body legal (`empty-body`); order preserved (`iteration-order-preservation`).
  - Nesting: inner loop gets its own frame; outer item stays visible
    (`nested-each`); `(end)` pairs LIFO across sibling loops
    (`end-token-pairing`).
  - Each-with-if resolves the condition through the iteration frame
    (`each-with-if`).
- **Common mistakes.** Iterating a record (use a collection / a dotted list).
  Expecting an index variable. Gluing `(each …)(if …)` with no space (inner not
  recognized — see Gotchas).
- **See also.** Conditionals; Data; Data access; Self-organising documents;
  Multi-file references.
- **Sources.** `13-iteration/` (all 10) + `_notes.md`;
  `packages/runtime/src/expander-iteration.ts`; `examples/14-iteration.wit`.

---

# PART E — Assembly across the document & across files

## Additive partials — `/docs/guides/additive-partials`

- **Concept.** `+#name` lets many places (and many files) contribute to one
  growing node — a TOC or bibliography that assembles itself.
- **Why / when.** Cross-file structure that stays in sync as chapters are
  added/reordered.
- **Outline.** The problem → `+#name` shapes → merge order → across files
  (`reference` + self-registration) → consistency rules.
- **Examples to show (verified).**
  - Single-line: `+#bibliography: @weil Simone Weil, Gravity and Grace, 1952 !!`
    (`08/single-line-additive`).
  - Block: `+#toc`⏎`@tocrow |number I| |title The Lamp|`⏎`toc#`
    (`08/block-additive`).
  - Multi-file: `master.wit` with `reference ./one.wit` / `./two.wit` + a bare
    `@bibliography`; each chapter self-registers via `+#bibliography`
    (`08/cross-file-merge/`).
- **Every edge (each cited).**
  - A leading `+` marks a def **additive**: repeated declarations **merge**
    (`simple-additive-prefix`); a lone `+#x` with no base or sibling is a
    complete one-entry definition (`simple-additive-prefix`, `block-additive`,
    `single-line-additive`).
  - Both body shapes work — block `+#name … name#` and single-line
    `+#name: … !!` — and may carry captures with `::name::`
    (`additive-with-captures`).
  - Multiple contributions in one file (`multiple-additive-same-file`); **order
    preserved** in document / reference (DFS) order (`order-preservation`,
    `cross-file-merge/`).
  - A non-additive base + additives compose (`mix-normal-and-additive`).
  - Contributions must agree on shape (`mixed-body-shape` probes a block +
    single-line combination → the shape-mismatch conformance case;
    `E_PARTIAL_SHAPE_MISMATCH`).
  - Cross-file scope: the reference graph is the scope (`cross-file-merge/`).
- **Common mistakes.** Mixing body shapes across contributions. Declaring
  `#bibliography` in the master when chapters already `+#bibliography` (unless
  intentionally a base). Whitespace between `+` and `#`.
- **See also.** Defining nodes; Multi-file references; Self-organising documents;
  Glossary & cross-references.
- **Sources.** `08-additive-partials/` (all 9 incl. `cross-file-merge/`) +
  `_notes.md`; `packages/runtime/src/resolver-partials.ts`;
  `examples/16-additive-partials/` (note master builds broken — FINDINGS B-2).

---

## Multi-file documents & references — `/docs/guides/references`

- **Concept.** `reference ./path.wit` pulls another file into the document's
  reference graph; defs and data are **global within the graph** (hoisted).
- **Why / when.** Split a thesis/report into chapter files with a shared schema;
  let a master assemble them.
- **Outline.** The `reference` directive & path forms → one flat namespace →
  transitive/DFS visibility → shared schemas → self/circular/missing → forward
  references.
- **Examples to show (cite fixture layouts).**
  - Single: `master.wit → reference ./one.wit`; `one.wit` defines `#keeper`
    (`14-composition/single-reference/`).
  - Multiple refs, one namespace (`multiple-references/`).
  - Transitive: master → a.wit → b.wit; master sees `@place` through the chain
    (`transitive-references/`).
  - Shared schema via a diamond: two chapters both `reference ../shared/schema.wit`
    (`shared-schema/`).
  - Cross-file iteration: `master` iterates a `#hands` collection defined in
    `hands.wit` (`17-combinations/multi-file-with-iteration/`).
- **Every edge (each cited).**
  - Path forms: same-dir `./one.wit` (`single-reference`), child dir `./sub/x.wit`
    (`nested-subdir`), parent-relative `../parent.wit` (`parent-relative` — no
    snapshot committed), diamond re-convergence (`shared-schema`).
  - Multiple references form **one flat namespace** (`multiple-references`);
    transitive visibility (`transitive-references`).
  - **Forward-then-back:** a use before the `reference` line still resolves —
    position of `reference` is immaterial (hoisting) (`forward-then-back`).
  - **Self-reference** `x.wit → reference ./x.wit` — no-op via already-visited
    (`self-reference` — no snapshot committed).
  - **Circular** a↔b — cycle handling (`circular-references`); **missing file**
    → resolver error (`missing-file`). NOTE: every `14-composition` `.json` is a
    **parse-level** snapshot (records the `reference` node, does not flatten), so
    circular/missing are **resolver-stage** semantics, not parse errors — teach
    them as build-time behavior, and verify the actual error codes at author time.
  - A `reference` + additive partial coexist in one file
    (`17-combinations/partial-with-reference`; note `shared.wit` intentionally
    absent there).
- **Common mistakes.** Expecting a conditional `reference` (unsupported — pick a
  build root instead; see Faceted content). Expecting `reference` mid-file to
  scope-limit (it's global + hoisted). Relative-path confusion (`./`, `../`,
  `./sub/`).
- **See also.** Additive partials; Defining nodes (hoisting); Self-organising
  documents; Faceted content (build roots).
- **Sources.** `14-composition/` (all 10 subdirs) + `_notes.md`;
  `17-combinations/multi-file-with-iteration/`, `partial-with-reference.wit`;
  `packages/runtime` resolver / reference-graph; `examples/15-references/` (note
  master builds broken — FINDINGS B-1).

---

## Composing constructs (combinations) — `/docs/guides/combinations`

- **Concept.** How the primitives compose at their seams — data × iteration ×
  conditionals × captures × references — and the seams where they *don't* (the
  two intentional error probes).
- **Why / when.** A short bridge page: readers who know each primitive learn how
  they stack, and see the two composition errors before they hit them.
- **Outline.** Records × iteration × conditionals → captures fed by data →
  access as param/condition → def-of-def → emphasis inside a body → the two
  seams that error.
- **Examples to show (cite fixture).**
  - `(each @hands as hand) (if @hand.awake is true) @hand.name … (end) (end)`
    (`17-combinations/record-iteration-conditional`).
  - `#cite ||author, work|| … !!` fed by `@cite |author @weil.author| |work
    @weil.work|` (`definition-with-captures-and-data`).
  - Access as a pipe value (`access-in-param`) and as a condition LHS
    (`access-in-condition`).
  - Def body referencing another def (`def-of-def`).
  - Inline emphasis inside a block body: `@aside She _crossed_ the *threshold*
    aside@` (`emphasis-inside-node-body`).
- **Every edge (each cited).**
  - All the happy compositions above (`record-iteration-conditional`,
    `definition-with-captures-and-data`, `access-in-param`, `access-in-condition`,
    `def-of-def`, `emphasis-inside-node-body`, `nested-nodes-with-params` before
    its error, `partial-with-reference`, `multi-file-with-iteration/`).
  - **Seam error 1:** `!!` is **not** a use-side short-close, so
    `@aside … @em … !! … aside@` never closes `@em` → `E_UNCLOSED_NODE`
    (`nested-nodes-with-params`). The `@name: … !!` use shape is roadmap only.
  - **Seam error 2:** a bare `@inset` on its own line opens a block expecting
    `inset@` and instead hits `chapter@` → `E_MISMATCHED_CLOSE`
    (`script-injects-rendered-content`).
- **Common mistakes.** Using `!!` to close a node use. Expecting a script-
  injected node to auto-close. Both surface in this page's error probes.
- **See also.** Iteration; Conditionals; Interpolation & captures; Multi-file
  references; Derived-content recipes; Gotchas.
- **Sources.** `17-combinations/` (all 9 files + `multi-file-with-iteration/`) +
  `_notes.md`.

---

# PART F — Gotchas & the sharp edges

## Gotchas & ambiguity — `/docs/guides/gotchas`

- **Concept.** Where natural prose brushes against Wit syntax and — by design —
  **does not** trigger it, plus the handful of places where it *does* mis-fire.
  Built from `16-ambiguity` (each fixture affirms that a rule does not
  accidentally fire), the `24-colon-scatter` false positives, and the known bugs
  in FINDINGS.
- **Why / when.** The single page a writer reads to stop fighting the parser.
  This section carries the most edges; be exhaustive.
- **Outline.** Prose that looks like syntax (the 16-ambiguity affirmations) →
  the real mis-fires (scatter false positive, mixing, greedy-bind) → the parser
  bugs to route around → escape/quote fixes.
- **Examples to show (verified — exact fixture input).**
  - Email: `Contact keeper@example.org for archive access.` — `@` after a letter
    stays prose (`16-ambiguity/email-in-prose`).
  - Home path: `Save the file to ~/Documents/notes.txt` — `~/` is not a comment
    (`tilde-home-path`).
  - Em-dash: `The key — value pair … remains prose` — ` — ` (U+2014) is not the
    ` - ` param separator (`em-dash-vs-hyphen`).
- **Every edge (each cited).**
  - **`~/` home paths** are not line comments (`tilde-home-path`); `~/` inside a
    `~~ … ~~` inline comment doesn't close it (`path-collision-comment`). Line
    comments require leading `~` + a space.
  - **`@` after a word char** never opens a node use — email addresses stay prose
    (`email-in-prose`).
  - **Em-dash vs hyphen:** the param separator is the exact bytes ` - `
    (U+0020 U+002D U+0020); ` — ` and ranges like `1995 — 2010` stay prose
    (`em-dash-vs-hyphen`).
  - **`>` is not a blockquote leader** — a line starting `> ` is ordinary prose
    (`blockquote-leader`).
  - **Apostrophe after italic:** `_word_'s` closes the italic and trails `'s`
    (`apostrophe-after-italic`).
  - **Sentence-internal `digit. `** is not an ordered-list marker: `in 1970. It
    was …` stays one paragraph (`year-period-space`).
  - **Digit-flanked `*`** is arithmetic, not emphasis: `5*6*7`, `2*3*4*5`
    (`mid-line-arithmetic`).
  - **Deep nesting** has no lexical depth cap: 7-deep `@a … @g word g@ … a@`
    (`deep-nesting`).
  - **Multiple blank lines** collapse to one paragraph break (`multi-blank-line`).
  - **Colon-scatter false positive:** mid-prose `name:Tauraj` (no space) lifts a
    param (`24-colon-scatter/false-positive-prose`); the fix is `\:` or a space
    (`body-scatter-escape`, `body-scatter-space-after-colon-is-prose`).
  - **Parens-then-body** stray closer (`05-nodes-parens/parens-then-body`); **the
    parens/pipes multi-line bugs** (`05/multi-line-call`, `06/multi-line-value`).
  - **Mixing & greedy-bind** (Part A): record-arg is exclusive
    (`E_MIXED_PARAM_SOURCE`); bodyless pipes greedily binds forward
    (`E_UNCLOSED_NODE`).
  - **Glued statements** (verified): `(each …)(if …)` / `(end)(end)` — a
    statement glued to a preceding `)` is not recognized; keep a space/newline.
  - **Record comma** (FINDINGS C-2 / B-1) splits fields — quote it.
  - **Comment-as-first-child-in-container-body bug** (FINDINGS C-1): a `~comment`
    as the **first line** inside a container body (no blank line after) collapses
    the following block(s) into one `<p>` (e.g. an `@h2` gets mis-nested). Fix:
    put a blank line after the leading comment.
  - **Multi-word key access via spaces fails** (`11/fuzzy-match-spaces`; FINDINGS
    C-4) — use camel/snake.
  - **`@figure` wraps a block `@figcaption` in `<p>`** (FINDINGS C-5, cosmetic);
    **`@@table` frozen doesn't resolve `@ref` rows** — use plain `@table`
    (FINDINGS C-6).
- **Common mistakes → fixes.** Colon false-positive → `\:` / space. Record comma
  → quote. Leading comment in a container → blank line. Bodyless pipes → explicit
  `name@` / blank line / last. Glued statements → space. Spaced multi-word access
  → camel/snake. `{{…}}` in prose → `@field`.
- **See also.** Every form page; Escapes; Conditionals; Iteration; Data access;
  FINDINGS.
- **Sources.** `16-ambiguity/` (all 10) + `_notes.md`; `24-colon-scatter/`
  (`false-positive-prose`, `body-scatter-escape`,
  `body-scatter-space-after-colon-is-prose`); FINDINGS C-1…C-6, D-2, D-3;
  verified builds (glued statements, greedy-bind, mixing).

---

## Backslash escapes & special characters — `/docs/guides/escapes`

- **Concept.** Keep a literal `:` `,` `{` `}` `"` `\` where Wit would otherwise
  read syntax; quote whitespace-bearing values.
- **Why / when.** Opt out of the colon contract; write literal braces/commas;
  carry commas/spaces in values.
- **Outline.** Why escapes exist → the escape set by context → quoting as the
  whitespace alternative → the sharp edges.
- **Examples to show (verified/cited).**
  - `name\:Tauraj` in a single-line body stays prose (`24/body-scatter-escape`).
  - Quoted comma in a record: `{ author: "Came, H." }`
    (`09-records/quoted-string-value`).
  - Form-fill `\,` to keep a literal comma in a collection-shaped value.
- **Every edge (each cited).** The recognized set differs by context
  (`parser-body-forms.ts`):
  - **Prose text** (`stripEscapes`): `\:` `\"` `\\` `\{` `\}` `\,`.
  - **Form-fill values** (`stripFormFillEscapes`): `\"` `\\` `\:` `\,` (others
    like `\_` `\*` pass through as backslash+char — inline parsing doesn't run).
  - **Colon-scatter opt-out:** `\:` suppresses the token; `\` stripped after.
  - **Quoted strings** (records/params): only `\"` and `\\`.
  - **Quoting vs escaping:** for spaces/commas/newlines prefer `"…"` (form-fill,
    record, colon-scatter values). **Pipes and parens have no escape for their
    own delimiters** — a literal `|` / `,` / `)` inside a pipe/paren value is a
    known expressivity hole; rephrase or use a body form.
  - **Sharp edge:** `the variable name:Tauraj is bad` lifts `name`
    (`24/false-positive-prose`) — `name\:` or `name: …` fixes it.
- **Common mistakes.** Expecting `\_`/`\*` to work in form-fill values (they
  don't — pass literally). Expecting a pipe/paren delimiter to be escapable
  (rephrase). Forgetting quotes force string type.
- **See also.** Colon-scatter; Form-fill; Data (quoting); Record-arg; Typed
  scalars; Gotchas.
- **Sources.** `parser-body-forms.ts` (`stripEscapes`, `stripFormFillEscapes`,
  `tryUnquote`), `parser-body-scatter.ts`; `24-colon-scatter/`, `23-form-fill/`.

---

# PART G — Patterns (declarative & scripted) — existing pages, expanded

These pages sit atop the primitives above; they are kept and expanded to the
standard. Their edges are largely covered by the primitive pages, so each here
leads with the pattern and cross-links the grounded pages.

## Literal & raw nodes; custom CSS — `/docs/guides/literal-raw-nodes`

- **Concept.** `@@name … name@@` embeds verbatim content; freeze levels
  (`@`/`@@`/`@@@`) control how much Wit-processing it receives.
- **Why / when.** Code, foreign markup, themed CSS.
- **Outline.** `@@name` literal body → block vs inline → freeze levels →
  `{{…}}` holes → `@@style` → roadmap `##` (not shipped).
- **Examples to show.** `@@code`⏎`let x = @not_a_node;`⏎`code@@`; frozen
  `@@@code {{x}} code@@@` → literal `{{x}}`; `@@style .x { color: {{theme.accent}} }
  style@@` with `#theme: { accent - green }`.
- **Every edge.** `@@name … name@@` verbatim (all `@ # _ * ::` inert); block when
  a newline directly follows `@@name`, inline otherwise; first literal `name@@`
  closes, none → `E_UNCLOSED_RAW_NODE`; one boundary whitespace trimmed. Known
  HTML-tag names emit that element (`@@@code`→`<code>`); custom names →
  `<div class="wit-node" data-wit-name="…">`; bodies HTML-escaped **except**
  `style`/`script` (raw-text, with a `</style` break-out guard). Freeze levels:
  `@`=live Wit + live `{{}}`; `@@`=frozen Wit + live `{{}}`; `@@@`=both frozen.
  `{{path}}` is live **only** here. `@@table` frozen won't resolve `@ref` rows
  (FINDINGS C-6). `##name … name##` component defs are **roadmap** (no `##`
  token).
- **Common mistakes.** Expecting `{{}}` live in prose (only in `@@`). Freezing a
  table you want resolved. Documenting `##` as shipped.
- **See also.** Interpolation & captures; Derived-content; Escapes.
- **Sources.** `docs/literal-nodes-and-components.md` (split shipped vs roadmap);
  `packages/parser/src/{lexer-raw,parser-raw}.ts`;
  `packages/render-html/src/render.ts`, `raw-node.test.ts`.

## Self-organising documents — `/docs/guides/self-organising-documents`

- **Concept.** Model structure as data once, render many synchronized views.
- **Why / when.** The flagship Wit-over-Markdown pitch.
- **Outline / examples / edges.** Build on verified constructs only: `#chapters:
  [ … ]` collections, `(each … as …)`, `@item.field`, defs with captures +
  `::name::`, additive partials for cross-file growth. Pass loop values into a
  def **by pipes** (`@row |number @ch.number|`) then `::number::` inside; keep
  inline reads as `@ch.field` data access (not `::ch.field::`). Reordering a
  record re-renders every derived view. Auto-numbering/backrefs need a renderer
  or `<% %>` script — cross-link Derived-content / Glossary.
- **Common mistakes.** `::loopvar.field::` in prose (use `@`); assuming
  `@node(type figure)` custom-node behavior is core (it's a renderer extension).
- **See also.** Iteration; Data; Additive partials; Multi-file references;
  Glossary; Derived-content.
- **Sources.** `packages/skill/skill/reference/09-self-organising-documents.md`
  (verify vs code); `examples/16-additive-partials/`; fixtures `13-iteration/`,
  `08-additive-partials/`.

## Faceted content — `/docs/guides/faceted-content`

- **Concept.** One source, many gated views — draft/final, public/internal, per
  target.
- **Outline / edges.** Verified path: status/flag **data defs** + `(if … is /
  equals …)` + `(each)` over annotated sections + **multiple build roots**
  referencing different subsets + `~` comments for scratch notes. **No `contains`**
  (model membership as a string compared with `is`/`equals`, or filter in a
  script). **Conditional `reference` is not supported** — choose a build root,
  not `(if)` around a `reference`. Target dispatch lives in a `<% %>` script
  (`lh.target` is renderer-provided; cross-link Derived-content).
- **Common mistakes.** `contains`; wrapping `reference` in `(if)`.
- **See also.** Conditionals; Multi-file references; Derived-content.
- **Sources.** `packages/skill/skill/reference/12-faceted-content.md` (heed its
  staleness flags); `12-conditionals/`; `expander-conditions.ts`.

## Glossary & cross-references — `/docs/guides/glossary-cross-references`

- **Concept.** Define terms/figures/sections once, reference by id; let the
  renderer number and back-link.
- **Outline / edges.** Core on verified constructs: a `#glossary` / `#figures`
  data collection (each record a unique `id` + label + payload), `(each … as …)`
  emitting `@dl`/`@dt`/`@dd`, `@g.field` data access, additive partials for a
  cross-file bibliography. Use `@g.term` (data access), **not** `::g.term::`.
  Auto-numbering/backrefs are **not** core — a renderer or `<% %>` script does
  them (cross-link Derived-content). Keep the reference call shape uniform.
- **Common mistakes.** Mixing `::…::` and `@field` for the same read; assuming
  numbering is built in.
- **See also.** Self-organising documents; Additive partials; Iteration;
  Derived-content.
- **Sources.** `packages/skill/skill/reference/13-glossary-and-cross-references.md`
  (verify); `13-iteration/`, `08-additive-partials/`;
  `packages/runtime/src/core-vocab.ts` (`dl`/`dt`/`dd`).

## Derived-content recipes — `/docs/guides/derived-content`

- **Concept.** A cookbook of `<% %>` script-bridge recipes that post-process a
  rendered document via the `lh` object.
- **Outline / edges.** Lead with the declarative path (prefer `(each)` + data).
  The `lh` surface to rely on: `lh.data`, `lh.query(name)`, `lh.sort(name, fn)`,
  `lh.inject(id, src)`, `lh.prose().wordCount()`, node `{ params, content }`.
  Flag as renderer-specific/unverified: `lh.target`, `node.params.injectId` /
  `backrefsInjectId`, `h.kind` ("check your renderer"). Keep the boolean-as-
  string quirk (`f.supported === 'true'`). Recipes: word count/reading time,
  sort findings, "X of Y" badge, group by owner, TOC from `lh.query('h2')`. The
  script-injection seam that errors is in Combinations
  (`script-injects-rendered-content` → `E_MISMATCHED_CLOSE`). Defers the `lh` API
  reference to the Build track.
- **Common mistakes.** Reaching for a script when `(each)` suffices; relying on
  unverified `lh` members.
- **See also.** Combinations; Literal & raw nodes; Self-organising documents;
  Build track scripting.
- **Sources.** `packages/skill/skill/reference/11-derived-content-recipes.md`
  (heed staleness); `packages/runtime/src/{lh-bridge,script-runner}.ts`;
  `examples/17-scripting.wit`; `17-combinations/script-injects-rendered-content.wit`.

---

## Cross-cutting notes for the whole section

- **Seed from fixtures.** Where a page lists a fixture, lift the live example
  from the fixture `.wit`.
- **Interpolation honesty.** One consistent story everywhere: `@name.field` for
  data-in-prose, `::name::` for capture holes in a def body, `{{…}}` only inside
  `@@` raw bodies. Never show `{{…}}` interpolating in a paragraph.
- **Operators honesty.** Only `is` / `equals`; never `contains`, `<`, `>`,
  `and`, `or`, `not`, `==`.
- **Mixing/greedy honesty.** parens+pipes merge; record-arg is exclusive;
  bodyless pipes greedily bind. Show the fix, not just the failure.
- **Overlap management.** Self-organising (declarative data-as-truth) / Glossary
  (cross-reference vocabulary) / Derived-content (imperative script recipes) /
  Multi-file references (the reference graph) overlap; split as noted and
  cross-link rather than repeat.
- **Cross-links out of the section:** each form page → reference "Syntax
  reference"; Literal/raw + Derived-content → Build track "Scripting & the `lh`
  bridge"; Data / Data-access / Typed-scalars → reference "Data model / value
  types".

## Corrections (stale sources to fix as you author)

- **parens + pipes MERGE** (not an error); only **record-arg** is exclusive
  (`E_MIXED_PARAM_SOURCE`). The greedy-bind hazard is real (`E_UNCLOSED_NODE`).
  Statements glued to a `)` are not recognized. (All verified this session.)
- `examples/12-accessing-data.wit` comment claims the **spaced** access
  `@keeper.years at post` resolves — it does **not** (a space ends the segment).
- Skill reference files 09/12/13 use `contains`, conditional `reference`,
  `::loopvar.field::`, `lh.target`, `node.params.injectId`, `h.kind` — all
  unverified/unsupported.
- `docs/literal-nodes-and-components.md` documents `##name … name##` and `{{…}}`
  in prose/strings as usable — both roadmap, not shipped.
- `examples/15-references/master.wit` and `examples/16-additive-partials/master.wit`
  do **not** build (FINDINGS B-1, B-2) — repair before seeding from them.
- Fixture `26-all-param-forms/showcase.wit` genuinely fails `E_UNCLOSED_NODE`
  (FINDINGS C-7) — use the individual per-form fixtures for the "same card, six
  ways" example.
- Ignore `docs/spec.md` entirely.

---

## Fixture coverage checklist

Every `.wit` in this section's fixture folders → the page that covers it.
(✓ = taught with an example; · = cited as an edge/note.)

### 04-nodes-use → **Node use & the bare reference** (10/10)
`bare-reference` ✓ · `bare-reference-adjacent-prose` ✓ · `block-name-body` ✓ ·
`inline-name-body` ✓ · `dotted-access` ✓ · `empty-body` · `hyphenated-name` · ·
`numeric-suffix` · · `underscored-name` · · `nested-same-name` ·.

### 05-nodes-parens → **Parens** (12/12)
`single-named-param` ✓ · `multiple-params` ✓ · `colon-separator` ✓ ·
`mixed-params` ✓ · `named-and-flag` ✓ · `hyphen-multi-word-key` · ·
`inner-whitespace` · · `trailing-comma` · · `empty-parens` · · `self-closing` · ·
`parens-then-body` · (also Gotchas) · `multi-line-call` · (also Gotchas).

### 06-parameters-pipes → **Pipes** (13/13)
`basic-named` ✓ · `bare-positional` · · `flag-with-bang` ✓ · `multi-word-value` ✓ ·
`multi-word-isolated` · · `hyphen-multi-word-key` · · `literal-hyphen-probe` · ·
`last-one-wins` ✓ · `mid-body-scatter` · · `multiple-pipes-per-line` ✓ ·
`empty-pipe` · · `pipe-in-body-text` · · `multi-line-value` · (also Gotchas).

### 22-record-args → **Record-arg** (5/5)
`inline-single-field` ✓ · `inline-multi-field` · · `multi-line-record` ✓ ·
`template-expansion` · · `template-implicit-captures` ·.

### 23-form-fill → **Form-fill body** (13/13)
`template-invocation` ✓ · `block-record-def` · · `value-block-record-def` · ·
`with-comments` · · `with-quoted-string` ✓ · `bibliography-style` ✓ ·
`with-emphasis-in-value` · · `value-multi-line` ✓ · `value-multi-paragraph` · ·
`value-empty-then-next-field` · · `value-indented-key-shape-is-content` · ·
`value-block-end-by-dedent` · · `value-emphasis-renders` ·.

### 24-colon-scatter → **Colon-scatter & body-scatter** (+ Gotchas, Escapes) (14/14)
`body-scatter-single` ✓ · `body-scatter-multi` · · `body-scatter-override` · ·
`body-scatter-quoted` ✓ · `body-scatter-escape` · (Escapes) · `false-positive-prose`
· (Gotchas) · `body-scatter-node-value` · · `body-scatter-self-closing-node-value`
· · `body-scatter-italic-value` · · `body-scatter-bold-value` · ·
`body-scatter-multiple-node-params` · · `body-scatter-node-then-bare` · ·
`body-scatter-override-with-node` · · `body-scatter-space-after-colon-is-prose` ·
(Gotchas).

### 25-content-in-captures → **Interpolation & captures** (5/5)
`value-contains-list` ✓ · `value-contains-heading` · · `multi-paragraph-value` · ·
`value-at-inline-position` · · `value-with-emphasis-only` ·.

### 26-all-param-forms → **Parameters overview** (1/1)
`showcase` · (the six buildable forms; note the file itself fails — FINDINGS C-7).

### 07-definitions → **Defining nodes** (12/12)
`block-definition` · · `single-line-def` · · `single-line-def-with-captures` · ·
`multi-line-value` · · `captures-and-interpolation` ✓ · `interpolation-only` · ·
`multi-capture-list` · · `body-slot` ✓ · `body-slot-only` · ·
`captures-body-slot-interpolation` · · `forward-reference` · ·
`definition-references-definition` · (also Combinations `def-of-def`).

### 21-optional-captures → **Defining nodes** (3/3)
`with-explicit-captures` · · `without-captures-inferred` ✓ · `block-def-inferred` ·.

### 09-records → **Data** (+ Typed scalars, Record-arg) (16/16)
`inline-single-field` ✓ · `inline-multi-field` · · `multi-line-record` · ·
`nested-record` · · `multi-word-key` · · `multi-word-value` · · `scalar-types` ✓
(Typed scalars) · `trailing-comma` · · `empty-record` · · `comma-in-value` ·
(Gotchas/Record-arg) · `colon-separator` ✓ · `quoted-string-value` ✓ ·
`quoted-string-multi-line` · · `block-record-multi-line-value` · ·
`block-record-multi-line-with-close` · · `block-record-multi-line-with-comma-terminator` ·.

### 10-collections → **Data** (+ Typed scalars) (10/10)
`empty-collection` · · `inline-values` ✓ · `multi-word-items` · · `mixed-types` ✓
(Typed scalars) · `inline-records` · · `multi-line-values` · · `multi-line-records`
· · `nested-collection` · · `trailing-comma` · · `whitespace-separator` ✓.

### 11-data-access → **Data access** (9/9)
`field-access` ✓ · `index-access` ✓ · `deep-chain` · · `access-into-nested-record`
✓ · `access-into-collection-of-records` ✓ · `fuzzy-match-camel` ✓ ·
`fuzzy-match-snake` ✓ · `fuzzy-match-spaces` · (Gotchas) · `missing-field` ·.

### 12-conditionals → **Conditionals** (10/10)
`if-end-basic` · · `if-else-end` ✓ · `is-comparison` · · `equals-comparison` · ·
`compare-against-string` ✓ · `compare-against-number` · · `truthy-bare-reference`
✓ · `empty-then-body` · · `empty-else-body` · · `nested-ifs` ✓.

### 13-iteration → **Iteration** (10/10)
`each-over-values` ✓ · `each-over-records` ✓ · `body-with-params` · ·
`each-with-if` ✓ · `nested-each` ✓ · `item-name-shadowing` ✓ · `empty-body` · ·
`empty-collection` · · `end-token-pairing` · · `iteration-order-preservation` ·.

### 08-additive-partials → **Additive partials** (9/9)
`simple-additive-prefix` ✓ · `block-additive` ✓ · `single-line-additive` ✓ ·
`multiple-additive-same-file` · · `cross-file-merge/` ✓ · `mix-normal-and-additive`
· · `order-preservation` · · `mixed-body-shape` · · `additive-with-captures` ·.

### 14-composition → **Multi-file documents & references** (10/10)
`single-reference/` ✓ · `multiple-references/` ✓ · `transitive-references/` ✓ ·
`nested-subdir/` · · `parent-relative/` · · `self-reference/` · ·
`circular-references/` · · `missing-file/` · · `shared-schema/` ✓ ·
`forward-then-back/` ·.

### 17-combinations → **Composing constructs** (+ Multi-file, Derived-content) (10/10)
`record-iteration-conditional` ✓ · `definition-with-captures-and-data` ✓ ·
`nested-nodes-with-params` · (error seam) · `partial-with-reference` · (also
Multi-file) · `access-in-param` ✓ · `access-in-condition` ✓ · `def-of-def` ✓ ·
`emphasis-inside-node-body` ✓ · `script-injects-rendered-content` · (error seam;
Derived-content) · `multi-file-with-iteration/` ✓ (also Multi-file).

### 16-ambiguity → **Gotchas & ambiguity** (10/10)
`email-in-prose` ✓ · `tilde-home-path` ✓ · `em-dash-vs-hyphen` ✓ ·
`blockquote-leader` · · `apostrophe-after-italic` · · `year-period-space` · ·
`path-collision-comment` · · `mid-line-arithmetic` · · `deep-nesting` · ·
`multi-blank-line` ·.

**Total: 182 fixture entries across all 19 folders (per-folder counts above),
every one mapped to a page.** Twelve of those entries are multi-file *scenario
directories* (`08/cross-file-merge/`, `17/multi-file-with-iteration/`, and the
ten `14-composition/*` subdirs), each holding several `.wit` files — so the raw
`.wit` count is higher; no single-file fixture is left unmapped.
