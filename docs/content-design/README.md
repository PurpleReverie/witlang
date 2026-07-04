# Wit Docs — Content Design

Page-by-page **content design** for the Wit documentation site (see
[`../plan/`](../plan/README.md) for the site's architecture, sourcing, and
rollout). These are *planning* docs, in Markdown — the site itself is authored
in Wit and compiled at build time.

Each section was designed against **verified ground truth** — the code, the
green fixtures, and working examples — **not** the stale `docs/spec.md`. Every
example was confirmed by actually building it.

## The section plans

| File | Section | Scope |
|---|---|---|
| [01-get-started-project.md](01-get-started-project.md) | Get Started · Playground · Project | onboarding entry, the live editor, contributor/architecture pages |
| [02-write.md](02-write.md) | **Write** (writer track) | 18 pages: prose → components → citations → the draft-in-git loop → genres |
| [03-build.md](03-build.md) | **Build** (developer track) | 10 pages: pipeline, AST, DataLoader, custom renderers, embedding |
| [04-guides.md](04-guides.md) | **Guides** (concepts) | 14 pages: params, data, conditionals/iteration, literals, faceted content… |
| [05-reference.md](05-reference.md) | **Reference** | 10 pages, exhaustive: every node, all 26 errors, CLI, config, API — *becomes the spec* |
| [06-recipes.md](06-recipes.md) | **Recipes** | 10 walkthroughs: thesis, report, CSV→table, manuscript, website, embed… |
| [curriculum.md](curriculum.md) | **Curriculum — concept catalog** | every part of Wit × 4 teaching dimensions (convey/how/examples/technical) + prereqs |
| [onboarding-sequence.md](onboarding-sequence.md) | **Onboarding sequence** | prereq graph + the ordered learning path (spine + 2 tracks) + ecosystem evaluation |
| [FINDINGS.md](FINDINGS.md) | ⚠ **fix-before-ship** | ~20 code/doc-drift issues + bugs the verification pass surfaced |

The two files above are the **pedagogy layer**: `curriculum.md` says *what* to
teach for each part of Wit and how; `onboarding-sequence.md` orders it into a
path that onboards someone to the ecosystem. The six section files are *where*
that content lives on the site.

**Start here for the shape of the whole site:**
- [PAGES.md](PAGES.md) — the **master page map**: every page (~95) + concise
  coverage bullets. The one-page index of everything.
- [AUTHORING-STANDARD.md](AUTHORING-STANDARD.md) — the **depth bar** every page
  must meet (concept · why · progressive examples · every edge cited to a
  fixture · common mistakes · see-also). Enforced across the deepened plans.

## Site map (the IA these plans fill)

```
/                         Home — existing Wit landing page (kept)
/docs                     Two-door home (Write / Build)
/docs/start/*             Get Started
/docs/write/*             Writer track          → 02
/docs/build/*             Developer track       → 03
/docs/guides/*            Concept deep-dives    → 04
/docs/reference/*         Exhaustive lookup     → 05
/docs/recipes/*           Cookbook / genres     → 06
/playground               Live editor           → 01
/docs/project/*           Contributing/roadmap  → 01
```

## Conventions every page follows

- **Source of truth:** code > fixtures > examples > tests. The skill package is
  idiom-only and *verified against code*. `docs/spec.md` is **not used**.
- **Per-page template:** Purpose + Audience · Outline · Examples-to-show ·
  Key points · Playground seeds · Sources.
- **Every example is live** — browser-run Wit, seeded from a verified fixture
  where possible, so an example that lies fails visibly.
- **Recent features are covered** (absent from the old spec): `@load` +
  `wit.sources.json`, image `size`/`align` + `@figure`, `@row`/`@col`,
  `@table |rows @ref|`, `--raw` vs default theme, PDF via `<base href>`.

## Cross-cutting notes

- **Overlap is intentional, framed differently:** e.g. tables appear in *Write*
  (how to make one), *Guides* (data → table), and *Reference* (every form). The
  reference is canonical; guides/write link to it.
- **The docs are a dogfood + test:** if a `.wit` feature regresses, the docs
  build breaks. The verification pass already proved this by finding two broken
  committed examples (see FINDINGS §B).

## Next steps

1. Skim [FINDINGS.md](FINDINGS.md) and decide the fix-before-ship cut
   (recommend: broken examples + version/count now; comment-in-body parser bug
   next).
2. Scaffold the SvelteKit app in `website/` + `vite-plugin-wit` (build-time
   `.wit` → HTML).
3. Build v1: Get Started + the Playground + the Core-vocabulary reference page
   (proves the pipeline and the live-example engine).
4. Fill Write / Build / Guides / Reference / Recipes from these plans.
