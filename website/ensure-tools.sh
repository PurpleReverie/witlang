#!/bin/sh
# Ensure the build/deploy toolchain is present, installing what's missing into a
# USER-OWNED location (no root / sudo needed). POSIX sh (make uses /bin/sh).
# Usage: ensure-tools.sh [pnpm] [pm2]
#
# Node is the one hard prerequisite (it can't be safely auto-installed). pnpm is
# installed via the standalone installer into $PNPM_HOME (~/.local/share/pnpm),
# and pm2 via `pnpm add -g` into that same dir. The Makefile puts $PNPM_HOME on
# PATH so recipes find them.

set -e

PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PNPM_HOME
export PATH="$PNPM_HOME:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH."
  echo "  Install Node.js >= 18 first (RunCloud: set the web app's Node.js version)."
  echo "  nvm-only node? make it visible to make's /bin/sh:"
  echo "    sudo ln -s \"\$(command -v node)\" /usr/local/bin/node"
  exit 1
fi

ensure_pnpm() {
  command -v pnpm >/dev/null 2>&1 && return 0
  [ -x "$PNPM_HOME/pnpm" ] && return 0
  echo "pnpm not found — installing pnpm@9.15.9 into $PNPM_HOME (no root needed)..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.9 SHELL="${SHELL:-/bin/sh}" sh - >/dev/null
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.9 SHELL="${SHELL:-/bin/sh}" sh - >/dev/null
  else
    echo "ERROR: need curl or wget to install pnpm. Install one, or install pnpm manually."
    exit 1
  fi
  [ -x "$PNPM_HOME/pnpm" ] || command -v pnpm >/dev/null 2>&1 || {
    echo "ERROR: pnpm install did not land in $PNPM_HOME. Install manually:"
    echo "  curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.9 sh -"
    exit 1; }
  echo "  pnpm $("$PNPM_HOME/pnpm" -v 2>/dev/null || pnpm -v) ready."
}

ensure_pm2() {
  command -v pm2 >/dev/null 2>&1 && return 0
  [ -x "$PNPM_HOME/pm2" ] && return 0
  ensure_pnpm
  echo "pm2 not found — installing via pnpm into $PNPM_HOME (no root needed)..."
  pnpm add -g pm2 >/dev/null 2>&1 || "$PNPM_HOME/pnpm" add -g pm2 >/dev/null
  { command -v pm2 >/dev/null 2>&1 || [ -x "$PNPM_HOME/pm2" ]; } || {
    echo "ERROR: could not install pm2. Install manually: pnpm add -g pm2"; exit 1; }
  echo "  pm2 ready."
}

for tool in "$@"; do
  case "$tool" in
    pnpm) ensure_pnpm ;;
    pm2)  ensure_pm2 ;;
    *) echo "ensure-tools: unknown tool '$tool' (ignored)" ;;
  esac
done
