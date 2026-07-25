# Wit Documentation Site — Plan

The plan for the documentation/onboarding site that expands the existing Wit
landing page. Split into focused, single-concern files so each is easy to load
and reason about downstream.

This folder is the **HOW** (architecture, sourcing, structure, rollout). For
the **WHAT** — the per-page content design — see
[`../content-design/`](../content-design/README.md).

## Vision

One site that takes a person from *"what is this?"* to productive — whether
they are a **writer** keeping a manuscript in git or a **developer** embedding
the parser. A guided, two-door onboarding path plus an exhaustive, lookup-fast
reference, with **every example live and editable in the browser**.

## Audiences

1. **Writers** — keep a manuscript in git, in plain text; compile a PDF for
   draft readers in seconds; diff-able, versioned drafts.
2. **Developers** — use `@witlang/parser` (and the runtime/renderers) in their
   own apps; build custom renderers; embed the pipeline.
3. **Others** (academics, students, technical writers) fold into the above.

The docs home is **two doors** (Write / Build) that converge on a shared
Reference, Recipes, and Playground.

## How this plan is organized

| File | Covers |
|---|---|
| [architecture.md](architecture.md) | Locked tech decisions · the build-time `.wit` → HTML pipeline · playground · search · deploy · reusable Svelte chrome |
| [sourcing.md](sourcing.md) | Where content comes from — the source-of-truth ranking; **`spec.md` is stale** |
| [information-architecture.md](information-architecture.md) | Site map · navigation · the page index (links to per-page design) |
| [rollout.md](rollout.md) | Phased rollout · open items |

## Related

- [`../content-design/`](../content-design/README.md) — per-page content design
  (6 section files: Get Started, Write, Build, Guides, Reference, Recipes).
- [`../content-design/FINDINGS.md`](../content-design/FINDINGS.md) — code/doc
  drift + bugs surfaced while verifying examples (**fix-before-ship list**).
