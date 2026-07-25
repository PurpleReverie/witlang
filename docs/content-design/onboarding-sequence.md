# Wit Onboarding Sequence — ordering the curriculum

Given every concept and its prerequisites (see [curriculum.md](curriculum.md)),
this file reasons about the **order**: what should be taught when, so the
sequence genuinely onboards someone to the *ecosystem* of Wit — not just its
syntax.

> **This file is the single source of teaching order** (§4). The site-section
> content plans (`02-write.md`, etc.) and the [information architecture](../plan/information-architecture.md)
> are per-page/where-it-lives catalogs and defer to §4 for sequence — so the
> order lives in exactly one place and can't drift.

---

## 1. What "good onboarding" means (the rubric)

Six principles we judge any ordering against:

1. **Motivation before mechanics.** Show the payoff — a rendered PDF, the
   git-diff-able manuscript — in the first ten minutes, before deep syntax.
   People learn what they're invested in.
2. **No forward references.** Never use a concept before it's been taught. Every
   example must only rely on earlier material.
3. **Dependency-respecting.** Follow the prereq graph (§3). A concept appears
   only after all its prerequisites.
4. **Spiral, not flat.** Introduce a concept at the depth needed *now*; revisit
   deeper later (params: two common forms → the full seven; tables: inline →
   data-driven; the git workflow: the hook → the full multi-file loop).
5. **Concrete before abstract.** Lead each concept with an example; the technical
   reference follows.
6. **Right audience, right moment.** Don't march writers through the AST or
   developers through every typographic nicety before they need it. Two paths,
   one spine.

Ecosystem test (the user's question, made concrete): by the end, has the learner
seen Wit as a **system** — language → tooling (CLI, formatter) → multi-target
output → extensibility (components, custom nodes/renderers) → embedding (API) →
the data seam — not just a set of tags?

## 2. The prerequisite graph (key edges)

```
prose(1.1) ─┬─► emphasis(1.2) ─► escapes(1.4)
            ├─► comments(1.3)
            ├─► CLI/output(9.1 ─► 9.2)              ← depends ONLY on "have a document"
            └─► using-nodes(2.1) ─┬─► core-vocab(2.2) ─► defining-nodes(3.1) ─┬─► single-line-defs(3.2) ─► records(4.1) ─┬─► collections(4.2) ─► data-access(4.3) ─┬─► conditionals(5.1) ─► faceted(5.3)
                                  ├─► params(2.3)                            │                              ├─► scalars(4.4)             └─► iteration(5.2)
                                  ├─► indentation(2.4)                       └─► captures/body-slot(3.3)
                                  ├─► errors(10.6)
                                  ├─► references(6.1) ─► additive-partials(6.2) ─► citations(6.3)
                                  ├─► tables(7.1)   [data-driven form needs 4.2/4.3]
                                  ├─► images(7.2) ─► layout(7.3)
                                  └─► literal/raw(7.4)

data(4.2,4.3) + tables(7.1) ─► @load(8.1)
output(9.2) + literal(7.4) ─► styling(9.3)
CLI(9.1) + references(6.1) ─► draft-workflow(9.4) ⭐
[whole language] ─► pipeline(10.1) ─► AST(10.2) ─► embedding(10.3) ─► custom-renderers(10.4)
                                                 └─► scripting(10.5)
```

**The load-bearing insight:** *output* (`9.1 CLI → 9.2 targets`) depends only on
"having a document" (`1.1`). So the payoff can — and should — come almost
first. This single fact reshapes the whole sequence.

## 3. Grading the existing order (`examples/01–17`)

The numbered examples are a de-facto curriculum:

> prose → emphasis → comments → using-nodes → params → indentation →
> defining-nodes → single-line-defs → **citations** → records → collections →
> access → conditionals → iteration → references → additive-partials → scripting

**What's right:** a clean language spine — prose → marks → nodes → params →
defs → data → logic. Dependency-respecting through most of it.

**What's wrong (three real problems):**

1. **No payoff.** The learner writes sixteen lessons before ever rendering a
   document. Violates principle 1. → Insert "build your first document → PDF"
   right after prose.
2. **Citations (09) is a forward reference.** Citations depend on
   defs **+ additive-partials + data** — all taught *later* (10–16). The
   example works only because it hand-waves the machinery. → Move citations to
   *after* additive-partials (post-16), or teach a trivial cite at 09 and the
   real one later.
3. **It predates half the ecosystem.** Tables, images, layout, `@load`, the
   output/CLI story, styling, and the entire developer track (AST, embedding,
   renderers) aren't in the sequence at all. → They must be slotted, not bolted
   on.

## 4. The recommended sequence

A shared spine, then two audience paths, converging on Reference + Playground.

### 4.0 Shared spine — "Get Started" (everyone, ~15 min)
1. **What is Wit? + the mental model** — prose is the default; structure is opt-in *(framing)*.
2. **Prose** (1.1).
3. **Build your first document → PDF** (9.1 + 9.2, minimal) — ⭐ the payoff, early.
4. **Emphasis** (1.2), **Comments** (1.3).
5. **Using nodes** (2.1) + a **core-vocab tour** (2.2).
6. **Two doors:** Write / Build.

*Also surfaced here as motivation (not yet taught in full):* the **draft-in-git
hook** for writers, the **pipeline diagram** for developers.

### 4.1 Writer path — front-load writing, defer data/logic to "advanced"
1. Structure: params-common (2.3), indentation (2.4).
2. **Rich content** (writers want this fast): headings/lists (2.2 deeper),
   quotes & asides, **tables — inline** (7.1), **images & figures** (7.2),
   **layout row/col** (7.3), links & media.
3. **Components:** defining nodes (3.1), single-line defs (3.2), captures & body
   slot (3.3).
4. **Multi-file & citations:** references (6.1), additive partials (6.2),
   **citations** (6.3) — *now* correctly placed after their machinery.
5. **Advanced (data-driven writing):** records (4.1), collections (4.2), access
   (4.3), scalars (4.4); conditionals (5.1), iteration (5.2), faceted (5.3);
   **data-driven tables** (7.1 revisited); **`@load`** (8.1).
6. **Producing & shipping:** render targets (9.2), styling default vs `--raw`
   (9.3) + literal/raw & custom CSS (7.4), **the draft-in-git workflow** (9.4) ⭐
   — the full version, now that chapters (6.1) exist.
   *(escapes 1.4 woven in where special chars first bite.)*

### 4.2 Developer path — language fluency, then the engine
1. **Language fluency first** — point to the Write track's language basics
   (prose/nodes/params/defs/data/logic). A tool-builder must know the model they
   consume. *(Don't let devs skip this — it's the #1 ordering risk.)*
2. **The pipeline** (10.1): `parse → loadExternalData → resolve → expand → render`.
3. **The AST** (10.2) — `parse()` + the node kinds + `wit tour`.
4. **Embedding / the API** (10.3) + the **`DataLoader` seam** (8.1 from the dev
   angle).
5. **Custom renderers** (10.4).
6. **Scripting & the `lh` bridge** (10.5) — advanced/last-resort.
7. **Errors** (10.6) — used as reference throughout.

### 4.3 Convergence
Both paths land on the **Reference** (lookup: every node, CLI, config, errors,
API), **Recipes**, and the **Playground** (live editing) — the shared,
non-linear surfaces.

## 5. Does this order onboard to the ecosystem?

Judged against the §1 rubric:

| Principle | Verdict |
|---|---|
| Motivation before mechanics | ✅ PDF payoff at spine-step 3; git-hook + pipeline surfaced as framing |
| No forward references | ✅ citations moved after partials; data-driven tables after data; `@load` after data+tables; the engine after language |
| Dependency-respecting | ✅ follows §2 graph; the one risk (devs skipping language) is called out |
| Spiral | ✅ params common→full, tables inline→data-driven, workflow hook→full, output minimal→styled |
| Concrete before abstract | ✅ every concept leads with an example (per the catalog) |
| Right audience, right moment | ✅ writers front-load writing, defer data/logic; devs get language then engine |

**Ecosystem coverage** — by the end each audience has traversed the whole
system, not just the syntax:
- **Writers** end at *language → components → multi-file → data → external data →
  multi-target output → the git workflow* — they see Wit as a way to *live in
  their manuscripts*, versioned and re-buildable.
- **Developers** end at *language → pipeline → AST → embedding → the DataLoader
  seam → custom renderers* — they see Wit as a *library they can build on*.

Both meet at Reference + Playground, so neither path dead-ends.

**Two residual tensions (design them consciously):**
- ⚠️ **Devs need language before the AST.** The path handles it by requiring the
  Write-track basics; make that a hard gate, not a suggestion.
- ⚠️ **`@load` straddles data and output.** It's the bridge concept — teach it
  *after* data (so `@table |rows @x|` makes sense) but *before* the shipping
  section, and again from the dev angle in embedding. A deliberate spiral, not a
  duplication.

## 6. Concrete deltas from today's `examples/01–17`

1. **Insert** "build your first document → PDF" immediately after prose.
2. **Move** citations to after additive-partials (fix the forward reference).
3. **Add** the missing ecosystem: tables, images, layout, `@load`, output/CLI,
   styling, and the whole developer track.
4. **Split** the single spine into a shared Get-Started + two audience paths.
5. **Spiral** params, tables, the git workflow, and output rather than teaching
   each once.

This ordering is the backbone for the site's Get-Started, Write, and Build
sections (see [../plan/information-architecture.md](../plan/information-architecture.md));
the per-page detail is in the section content-design files.
