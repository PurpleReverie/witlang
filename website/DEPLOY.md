# Deploying the Wit site

The site is a **static tree** built into `website/build/` — `build/index.html`
is the landing page, `build/docs/` is the documentation. Any static host works.
No server, no runtime.

## Build

```
pnpm install
pnpm build                 # compile the @witlang packages
make -C website build      # -> website/build/
```

Toolchain: Node 20+ and pnpm 9 (repo pins `pnpm@9.15.9`). Output dir:
`website/build`. Publish root: `website/build`.

## Deploy config (environment)

The build reads these from the environment (see `site.config.mjs`). `.env` is
gitignored, so set them in your host's dashboard for production:

| Var | Production value |
|-----|------------------|
| `WIT_REPO_URL`     | `https://github.com/PurpleReverie/witlang` |
| `WIT_SITE_TITLE`   | `Wit` |
| `WIT_SITE_TAGLINE` | `Write the paper. Not the preamble.` |
| `WIT_SITE_URL`     | `https://witlang.org` |

Omit them and the fallbacks in `site.config.mjs` are used.

---

## Option A — Cloudflare Pages (recommended)

Best if the domain is registered at Cloudflare: DNS + hosting in one place, at
cost, automatic HTTPS.

1. **Pages → Create → Connect to Git →** `PurpleReverie/witlang`.
2. Build settings:
   - **Build command:** `pnpm install && pnpm build && make -C website build`
   - **Build output directory:** `website/build`
   - **Environment variables:** add the four `WIT_*` vars above. Also add
     `NODE_VERSION = 22` (or set via `.node-version`).
3. Save & Deploy. First build publishes to `<project>.pages.dev`.
4. **Custom domain:** Pages → the project → *Custom domains* → add
   `witlang.org` and `www.witlang.org`. If the domain's DNS is on Cloudflare,
   the records are created for you. Cloudflare provisions the certificate.

DNS (auto-created when the domain is on Cloudflare):

| Type  | Name | Value |
|-------|------|-------|
| CNAME | `@` (witlang.org)     | `<project>.pages.dev` |
| CNAME | `www`                 | `<project>.pages.dev` |

## Option B — GitHub Pages

Free, but needs a build step in CI (Pages can't run the pnpm build itself).

1. Add `.github/workflows/pages.yml` that runs the build and uploads
   `website/build` as the Pages artifact (I can generate this on request).
2. **Settings → Pages → Source: GitHub Actions.**
3. **Settings → Pages → Custom domain:** `witlang.org` (writes a `CNAME` file;
   enable *Enforce HTTPS* once the cert is issued).

DNS at your registrar (Porkbun/Namecheap/Cloudflare):

| Type  | Name  | Value |
|-------|-------|-------|
| A     | `@`   | `185.199.108.153` |
| A     | `@`   | `185.199.109.153` |
| A     | `@`   | `185.199.110.153` |
| A     | `@`   | `185.199.111.153` |
| CNAME | `www` | `purplereverie.github.io` |

---

## After first deploy

- Visit `https://witlang.org` and `https://witlang.org/docs/`.
- Confirm the "GitHub" links point at the configured repo (they read
  `WIT_REPO_URL`).
- DNS propagation is usually minutes, up to ~24h worst case.

## Local preview

```
make -C website serve      # http://localhost:8000  (Ctrl-C to stop)
```
