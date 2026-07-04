# load-demo — external data via `@load`

A release note whose version, contributor list, and site table all come from
outside the document. The `.wit` file names data only by **alias**; the
programs behind those aliases live in [wit.sources.json](wit.sources.json),
which you pass at build time. A document can never name a command — only an
alias the operator configured — so this doubles as the security boundary.

## Run it

From the repo root (build the CLI first with `pnpm build`):

```sh
node packages/cli/dist/bin.js build examples/load-demo/report.wit \
  --sources examples/load-demo/wit.sources.json \
  --env examples/load-demo/.env \
  --allow-exec --fragment
```

`--allow-exec` is required to run programs; without it, only the built-in
`env` source works. Drop `--fragment` for a full styled document, or add
`-o report.html` / `-o report.pdf` to write a file.

## What's wired

| `@load` | source | format | shape | used as |
|---|---|---|---|---|
| `@load meta load@` | `scripts/meta.js` | json | record | `@meta.version`, `@meta.date` |
| `@load team load@` | `scripts/team.js` | json | collection | `(each @team as person) …` |
| `@load downloads load@` | `cat data/downloads.csv` | csv | collection | `@table \|rows @downloads\|` |
| `@load env load@` | built-in | — | record | `@env.WIT_BRANCH` |

The programs are Node scripts here, but anything that emits JSON/CSV/lines to
stdout works — Python, a SQL client, a compiled binary. Only the value model
(records / collections / scalars) crosses the seam, so Wit never learns what
CSV or Node is.

## Embedding

A program using `@witlang/runtime` skips the config + subprocess entirely and
passes its own data — the same seam. The simplest form is a plain dictionary
pairing each alias with its already-resolved object:

```ts
import { parse } from '@witlang/parser';
import { loadExternalData, resolve, expand } from '@witlang/runtime';

const doc = loadExternalData(parse(src, 'report.wit'), {
  meta: { version: '0.4.0' },
  sales: [{ site: 'Dunmore', lit: 'yes' }],
});
const out = expand(resolve(doc)); // @meta.version, @table |rows @sales|, …
```

Pass a `(req) => …` function instead when you need to fetch lazily per alias.
