#!/bin/sh
# Ensure the build/deploy toolchain is present, installing what's missing.
# POSIX sh (make runs recipes with /bin/sh). Usage: ensure-tools.sh [pnpm] [pm2]
#
# Node is the one hard prerequisite (corepack/npm ship with it) — if it's not
# on PATH we stop with instructions rather than guessing a package manager.

set -e

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH."
  echo "  Install Node.js >= 18 first, then re-run."
  echo "  RunCloud: set the web app's Node.js version in the panel."
  echo "  nvm users: symlink it where make's /bin/sh can see it, e.g."
  echo "    sudo ln -s \"\$(command -v node)\" /usr/local/bin/node"
  exit 1
fi

ensure_pnpm() {
  command -v pnpm >/dev/null 2>&1 && return 0
  echo "pnpm not found — installing pnpm@9.15.9..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@9.15.9 --activate
  else
    npm install -g pnpm@9
  fi
  command -v pnpm >/dev/null 2>&1 || {
    echo "ERROR: could not install pnpm. Install manually: npm i -g pnpm@9"; exit 1; }
  echo "  pnpm $(pnpm -v) ready."
}

ensure_pm2() {
  command -v pm2 >/dev/null 2>&1 && return 0
  echo "pm2 not found — installing pm2..."
  npm install -g pm2 || {
    echo "ERROR: could not install pm2. Install manually: npm i -g pm2"; exit 1; }
  echo "  pm2 $(pm2 -v) ready."
}

for tool in "$@"; do
  case "$tool" in
    pnpm) ensure_pnpm ;;
    pm2)  ensure_pm2 ;;
    *) echo "ensure-tools: unknown tool '$tool' (ignored)" ;;
  esac
done
