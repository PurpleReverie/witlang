# Authoring the docs content (voice + Wit conventions)

Every page is a `.wit` file compiled by `website/generate.mjs`. Follow this or
pages break or read wrong.

## Voice — match the audience

**Writers** (Get Started, Write, Recipes, Migration, Troubleshooting): warm,
plain-spoken, encouraging, editorial — a good writing handbook, not a man page.
Address the reader as *you*; lead with what they can *do*. Short paragraphs.
Explain any technical term the moment you use it. Confident, never salesy.

**Developers** (Build, API/Reference-API): precise and dense, code-first.
Assume programming fluency; give exact signatures; skip the hand-holding.

**Reference**: scannable and complete — tables, tight entries, minimal prose.

**Always:** active voice, present tense, *you*. Be **honest about limits** —
never oversell; if something doesn't work, say so and give the workaround.
Every example must actually build.

## Page shape

- Title: `@h1 Page Title h1@` (exactly one, first line).
- Sections: `@h2 …`, sub-sections `@h3 …`.
- Meet the depth bar (see `docs/content-design/AUTHORING-STANDARD.md`): concept →
  why → progressive examples → every edge → common mistakes → see also.
- End most pages with a "See also" paragraph of links.

## Showing Wit code (critical)

- **A block of example Wit** goes in a frozen literal: `@@@pre` … `pre@@@`. The
  content is verbatim and auto-syntax-highlighted. Use this for every multi-line
  example.
- **Inline literal syntax that contains `@`, `#`, or `|`** must use frozen
  inline code: `@@@code @h1 … h1@ code@@@` → renders `<code>@h1 … h1@</code>`.
  **Never** write `@code @h1 … h1@ code@` — the inner `@h1` is parsed as a node
  and breaks the build.
- Inline code with **no** `@`/`#`/`|` is fine plain: `@code wit build code@`.

## Prose pitfalls that break the build (learned the hard way)

- **Never put `@`, `#`, or `|` mid-prose** where it could be read as syntax.
  `keeper@site.org` splits the paragraph (`keeper@` reads as a node close);
  a line starting `#word` becomes a definition and vanishes; a bare `|` opens
  param state. To *mention* such syntax, wrap it in `@@@code … code@@@`.
- **Never start a node body with a `~` comment** without a blank line after —
  it collapses the next block into a stray `<p>`. Put a blank line after any
  comment inside a container.
- **Data in prose** is `@name.field` (with surrounding spaces), never `::x::` or
  `{{x}}` (those don't interpolate in prose).

## Links

Use **root-relative** links; the generator rewrites them per page:
`@a |href /docs/write/tables/| tables a@`, home is `@a |href /| … a@`. Never
hand-write `../../`.

## Callouts

Tips and warnings: `@aside(class note) 💡 … aside@` (styled by the docs theme).

## Verify every page

From the repo root, each file must build clean:
`node packages/cli/dist/bin.js build website/content/<section>/<slug>.wit --fragment`
It must exit 0 and produce the HTML you expect. Then the whole site builds with
`node website/generate.mjs`.

## File layout

`website/content/<section>/<slug>.wit` where `<section>` ∈
`start · write · build · guides · reference · recipes · project`. Report the
ordered list of `{ title, slug, file }` you created so the nav can be assembled.
