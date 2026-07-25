# Wit website — build and preview the landing page + the docs site.
#
# Run from this folder (or `make -C website <target>` from the repo root):
#
#   make build    compile the landing page + all docs into build/
#   make serve    build, then serve build/ at http://localhost:$(PORT)
#   make open     open the served site in a browser
#   make clean    remove generated output
#   make dist     force a rebuild of the @witlang packages the build depends on
#
# The result is a single static tree: build/index.html is the landing page and
# build/docs/ is the documentation. Override the port with `make serve PORT=9000`.

PORT ?= 8000
CLI  := ../packages/cli/dist/bin.js
# One compiled artifact standing in for "the @witlang packages are built".
DIST := ../packages/parser/dist/index.js

.DEFAULT_GOAL := help
.PHONY: help build docs landing serve open clean dist config deploy undeploy logs

help:
	@echo 'Wit website targets:'
	@echo '  make build   compile the landing page + docs into build/'
	@echo '  make serve   build, then serve build/ at http://localhost:$(PORT)'
	@echo '  make open    open the served site in a browser'
	@echo '  make clean   remove build/ and site.html'
	@echo '  make dist    force-rebuild the @witlang packages'
	@echo '  make config  regenerate parts/config.wit from .env (repo/brand)'
	@echo '  make deploy  build, then serve build/ under pm2 (port/host from .env)'
	@echo '  make undeploy  stop and remove the pm2 process'
	@echo '  make logs    tail the pm2 process logs'
	@echo ''
	@echo 'Config lives in website/.env (copy .env.example). Set WIT_REPO_URL,'
	@echo 'WIT_SITE_TITLE, WIT_SITE_TAGLINE, WIT_SITE_URL, and PORT/HOST there.'

# The generator and CLI import the compiled @witlang packages. Build them once
# if the dist is missing; after editing the parser/renderer, run `make dist`.
# ensure-tools installs pnpm (via corepack) if it isn't already on PATH.
$(DIST):
	@sh ensure-tools.sh pnpm
	cd .. && pnpm -s build

dist:
	@sh ensure-tools.sh pnpm
	cd .. && pnpm -s build

# Whole site into build/: landing at build/index.html, docs under build/docs/.
build: docs landing
	@echo 'Site ready in build/ — run `make serve` to preview it.'

# Deploy config: read website/.env and emit parts/config.wit (repo URL, brand)
# for the CLI-built landing page. The docs generator reads .env directly.
config:
	@node gen-config.mjs

# Docs first (generate.mjs only wipes build/docs/, so the landing survives).
docs: $(DIST)
	node generate.mjs

landing: $(DIST) config
	@mkdir -p build
	node $(CLI) build site.wit -o build/index.html --raw
	@node finalize-landing.mjs
	@echo 'built landing page -> build/index.html'

serve: build
	@echo 'Serving http://localhost:$(PORT)/  (landing)   and   /docs/  (documentation)'
	@echo 'Press Ctrl-C to stop.'
	@python3 -m http.server $(PORT) --directory build

# Production deploy: build the static site, then run it under pm2. The Node
# server (server.mjs) reads PORT/HOST from .env. `startOrReload` starts the
# process if it is not running, or reloads it with zero downtime if it is.
deploy: build
	@sh ensure-tools.sh pm2
	pm2 startOrReload ecosystem.config.cjs --update-env
	@pm2 save >/dev/null 2>&1 || true
	@echo 'Deployed under pm2 as "witlang-site" — `make logs` to watch it.'

undeploy:
	-pm2 delete witlang-site
	@pm2 save >/dev/null 2>&1 || true

logs:
	pm2 logs witlang-site

open:
	@open 'http://localhost:$(PORT)/'

clean:
	rm -rf build site.html
	@echo 'removed build/ and site.html'
