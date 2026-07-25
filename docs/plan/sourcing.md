# Sourcing — where content comes from

The rule that keeps the docs honest. See [README](README.md) for the index.

## `docs/spec.md` is stale — do NOT source from it

The old spec is **massively out of date**; treat it as untrusted until
regenerated (or deprecated). Ground every page in what is *verified true right
now*, ranked:

| Rank | Source | Why it's trustworthy | Provides |
|---|---|---|---|
| 1 | **code** (`packages/*/src`) | definitive — it's what runs | exact behaviour, API, CLI flags, error codes, core vocab |
| 2 | **fixtures** (`tests/fixtures/00–26`, `*.json`) | machine-verified snapshots, all green — can't drift | precise input→output for every feature; edge cases; **verified examples** |
| 3 | **examples** (`examples/*.wit`) | build green in CI | idiomatic, current usage; the curriculum |
| 4 | **tests** (`*.test.ts`) | green | behaviour + edge cases, error paths |
| 5 | `packages/skill/skill/` | written at a point in time | idioms, genres, recipes, anti-patterns — **verify against code before using** |
| — | ~~`docs/spec.md`~~ | **STALE** | do not use; regenerate or deprecate |

## The authoring rule

**Read the code and the matching fixture, confirm behaviour by building a tiny
`.wit`, then write.** Never transcribe the old spec.

The Reference section (built this way) **becomes the new authoritative spec**;
the old `spec.md` is deprecated. Because every example is browser-run live Wit
(seeded from a verified fixture where possible), an example that lies fails
visibly — the docs are self-checking.

## Coverage note — recent features the spec predates

These exist in code + the `load-demo`/`essay` examples and are the current
reality; the old spec has none of them:

- `@load` external data + `wit.sources.json` + `DataLoader`
- image `size`/`align` + `@figure` centering
- `@row`/`@col` layout
- `@table |rows @ref|` (auto columns from record keys)
- PDF output with `<base href>` for relative assets
- default theme vs `--raw`
- `wit fmt`

## Verification already paid off

Sourcing this way turned the planning pass into an audit — it surfaced ~20
code/doc-drift issues and **two broken committed examples**. See
[`../content-design/FINDINGS.md`](../content-design/FINDINGS.md).
