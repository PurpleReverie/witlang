# Rollout & open items

See [README](README.md) for the plan index.

## Phased rollout

- **v1 (prove it):** SvelteKit shell + `vite-plugin-wit` + design tokens; Get
  Started (5 pages) + one full Reference page (Core vocabulary) + the
  Playground. Validates the build-time Wit pipeline and the live-example engine.
- **v2 (breadth):** complete Write + Build tracks + full Reference + Search.
- **v3 (depth):** Guides + Recipes + Project + versioning + polish + a11y pass.

## Before v1 — fix-before-ship

The verification pass surfaced ~20 issues (see
[`../content-design/FINDINGS.md`](../content-design/FINDINGS.md)). Clear the
cheap/embarrassing ones first:

- Repair the two broken committed examples (`examples/15-references`,
  `examples/16-additive-partials`).
- Reconcile the version (`0.1.0` vs `v0.2.0` tag) and the "47 core nodes" →
  actually 52.
- Decide whether to fix the comment-in-body parser bug now (broad payoff) or
  document it as a known limitation.

## Open items

- **`docs/spec.md` is stale.** Decision: let the docs site's Reference section
  *become* the new authoritative spec (built from code + fixtures), and
  deprecate/redirect `spec.md`. (Recommended over regenerating the old file.)
- **Verify the skill package** (`packages/skill`) against current code before
  reusing its prose; it predates the newest features and carries some unshipped
  constructs. See FINDINGS §E.
- **Seed live examples from fixtures** where possible — fixture inputs are
  guaranteed-correct, so a reference example lifted from a fixture can't lie.
- Decide whether reference "live examples" render at build (static) with an
  optional "edit" that hydrates the client engine (recommended: yes).
- **Consider two small features** for the writer story: `wit build --watch`
  (the draft loop) and record-value comma escaping (unblocks a broken example).
