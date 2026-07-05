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
.PHONY: help build docs landing serve open clean dist

help:
	@echo 'Wit website targets:'
	@echo '  make build   compile the landing page + docs into build/'
	@echo '  make serve   build, then serve build/ at http://localhost:$(PORT)'
	@echo '  make open    open the served site in a browser'
	@echo '  make clean   remove build/ and site.html'
	@echo '  make dist    force-rebuild the @witlang packages'

# The generator and CLI import the compiled @witlang packages. Build them once
# if the dist is missing; after editing the parser/renderer, run `make dist`.
$(DIST):
	cd .. && pnpm -s build

dist:
	cd .. && pnpm -s build

# Whole site into build/: landing at build/index.html, docs under build/docs/.
build: docs landing
	@echo 'Site ready in build/ — run `make serve` to preview it.'

# Docs first (generate.mjs only wipes build/docs/, so the landing survives).
docs: $(DIST)
	node generate.mjs

landing: $(DIST)
	@mkdir -p build
	node $(CLI) build site.wit -o build/index.html --raw
	@echo 'built landing page -> build/index.html'

serve: build
	@echo 'Serving http://localhost:$(PORT)/  (landing)   and   /docs/  (documentation)'
	@echo 'Press Ctrl-C to stop.'
	@python3 -m http.server $(PORT) --directory build

open:
	@open 'http://localhost:$(PORT)/'

clean:
	rm -rf build site.html
	@echo 'removed build/ and site.html'
