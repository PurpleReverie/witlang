# Information Architecture

The site map and the page index. The **detailed per-page design** lives in
[`../content-design/`](../content-design/README.md); this file is the map that
points into it. See [README](README.md) for the plan index.

> **Order is not owned here.** This file lists *where* pages live. The
> **canonical teaching order** (dependency-checked, learner-facing) is
> [`../content-design/onboarding-sequence.md`](../content-design/onboarding-sequence.md)
> §4 — the single source of order. The lists below are grouped by section, not
> by teaching sequence.

## Site map

```
/                          Home — existing Wit landing page (kept)
/docs                      Two-door home (Write / Build)
/docs/start/*              Get Started (shared onboarding)
/docs/write/*              Writer track
/docs/build/*              Developer track
/docs/guides/*             Concept deep-dives (cross-audience)
/docs/reference/*          Exhaustive lookup
/docs/recipes/*            Cookbook / genres
/playground                Live editor + examples gallery
/docs/project/*            Contributing / architecture / roadmap
```

Two doors on the docs home (Write / Build) that converge on shared Reference,
Recipes, and Playground.

## Page index

Page-level scope only; full design (outline, examples, sources) is in the
linked content-design file.

### Home
- **Landing** — the existing `website/` Wit page, kept as-is.

### Get Started — `/docs/start` · [design](../content-design/01-get-started-project.md)
What is Wit? · Install · Your first document · The mental model · Choose your path.

### Write (writer track) — `/docs/write` · [design](../content-design/02-write.md)
Prose · Emphasis · Comments · Headings & structure · Lists · Quotes & asides ·
Tables · Images & figures · Layout (rows/cols) · Links & media · Using nodes ·
Components (defining nodes) · Citations · **The draft-in-git workflow ⭐** ·
Multi-file manuscripts · Rendering (HTML/MD/PDF) · Styling · Genres.

### Build (developer track) — `/docs/build` · [design](../content-design/03-build.md)
Architecture overview · Install packages · Parsing → the AST · Resolve & expand ·
Rendering · External data (DataLoader seam) · Build your own renderer ·
Embed Wit in an app · Custom nodes · Scripting & the `lh` bridge.

### Guides (concepts) — `/docs/guides` · [design](../content-design/04-guides.md)
Parameters (every form) · Data (records/collections/scalars) · Data access ·
Conditionals · Iteration · Additive partials · Interpolation & captures ·
Literal & raw nodes + custom CSS · Self-organising documents · Faceted content ·
Glossary & cross-references · Derived-content recipes · Escapes ·
Type-classified scalars.

### Reference (exhaustive) — `/docs/reference` · [design](../content-design/05-reference.md)
Syntax reference · Core vocabulary (every node, live) · Tables · CLI · Config ·
Data model / value types · Error codes (all 26) · API (per package) ·
Gotchas & anti-patterns · Known limitations. **This section becomes the spec.**

### Recipes / Genres — `/docs/recipes` · [design](../content-design/06-recipes.md)
Thesis · Report with live data · CSV → table · Manuscript in chapters ·
Creative writing (no indentation) · Interactive/RPG script · A website in Wit ·
Bibliography across files · Embed the parser · Write a custom renderer.

### Playground — `/playground` · [design](../content-design/01-get-started-project.md)
Full-screen live editor (in-browser Wit) + examples gallery seeded from the
reference examples.

### Project / Contributing — `/docs/project` · [design](../content-design/01-get-started-project.md)
Design principles · Architecture · Roadmap · How to add a node/renderer ·
The spec (deprecation plan) · Changelog.

## Overlap is intentional

The same feature appears in more than one section, framed differently — e.g.
tables in *Write* (how to make one), *Guides* (data → table), *Reference*
(every form). The **Reference is canonical**; Write/Guides link to it.
