# Authoring standard — what "comprehensive" means

This is an **onboarding *and* documentation** site: it must teach a newcomer
*and* cover every edge of Wit. The **265 fixtures** in `tests/fixtures/` are the
edge surface — each is a verified `.wit` input + snapshot of one behaviour. A
page plan is not "done" until every relevant edge is taught or referenced, and
**cited to its fixture**.

The audit found the plans were breadth-first but depth-thin, and the learning
pages were the thinnest. This standard fixes that. Every expanded page spec
must meet the bar below.

## The depth bar — every page

1. **Concept** — what it is, in plain language, in one or two sentences.
2. **Why / when** — the motivation; when a reader reaches for it (and when not).
3. **Progressive examples** — at least *basic → realistic → edge*, each a
   **verified** runnable snippet with its rendered result. Never a single toy.
4. **Every option / variant / edge** — enumerated and shown, each grounded in a
   **fixture (cite the path)**. No behaviour left implicit. Walk the fixtures for
   your topic; each is a case to cover.
5. **Common mistakes / gotchas** — how it goes wrong and the fix, grounded in the
   `16-ambiguity` / `24-colon-scatter` fixtures and the known bugs in
   [FINDINGS.md](FINDINGS.md).
6. **See also** — cross-links to prerequisite and related pages.

## Reference pages — extra bar

Each node / flag / error entry carries: **syntax/signature · every parameter ·
≥2 examples with rendered output · notes & caveats · related errors · the
fixture that verifies it.** Core vocabulary gets a rich entry *per node*, not one
list page.

## Fixture-grounded rule

For your section, open its fixture folders and **account for every `.wit` file**.
Example (`02-emphasis`, 9 edges): `basic-bold`, `basic-italic`,
`combined-bold-italic`, `arithmetic-shapes`, `underscore-in-identifier`,
`apostrophe-after-italic`, `empty-marks`, `marks-at-paragraph-boundary`,
`mixed-prose-and-marks`. A comprehensive Emphasis page teaches or notes **all
nine**. An unreferenced fixture is a coverage hole.

## Missing page types a comprehensive site needs (add them)

- **Extended tutorial** — build one real document end to end, step by step.
- **Troubleshooting / Errors & fixes** — a narrative learning resource, not just
  the error-code list.
- **Migration guides** — *from Markdown* and *from LaTeX* (the two audiences).
- **Per-node reference detail** — a rich page/entry per core node.
- **Glossary**, **cheatsheet**, and **annotated full sample documents** (a whole
  thesis / report walked through).
- **Concept explainers** with diagrams (the mental model; the
  parse→resolve→expand→render pipeline).

## "Done" looks like — the Emphasis exemplar

> **Emphasis.** Concept: two inline marks, `*bold*` and `_italic_`. Why: restraint.
> Basic (`basic-bold`, `basic-italic`) → realistic (`mixed-prose-and-marks`) →
> edges: marks **wrap a token**, so `3*4*5` and `file_name_here` stay plain
> (`arithmetic-shapes`, `underscore-in-identifier`); `it's` after a mark is safe
> (`apostrophe-after-italic`); `**`/`__` empty marks (`empty-marks`); marks at a
> paragraph edge (`marks-at-paragraph-boundary`). Combining: `*_…_*` works,
> `_*…*_` leaves the inner literal — **with the why**. How it maps to
> `<em>`/`<strong>`. Common mistakes: expecting `_*x*_`; escaping a literal `*`.
> See also: Prose, Escapes, the Core-vocab marks reference.

Every learning page should read like that: a lesson that leaves no edge unshown.
