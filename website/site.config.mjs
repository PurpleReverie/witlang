// Single source of truth for deploy-time site configuration.
//
// Values come from environment variables (loaded from `website/.env` if that
// file exists) with safe fallbacks, so the same source builds locally and in
// CI/deploy without edits. Copy `.env.example` to `.env` and adjust.
//
//   WIT_REPO_URL     canonical GitHub repo URL (GitHub links, "View source")
//   WIT_SITE_TITLE   brand shown in the top bar / <title>
//   WIT_SITE_TAGLINE one-line tagline
//   WIT_SITE_URL     canonical base URL of the deployed site (optional)
//
// Both the docs generator (generate.mjs) and the landing-page config partial
// (gen-config.mjs) read from here.

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Load website/.env if present. Never throws when the file is absent, so a
// clean checkout (or a CI job that injects real env vars) just uses fallbacks.
const ENV_FILE = path.join(HERE, '.env');
if (existsSync(ENV_FILE)) {
  try { process.loadEnvFile(ENV_FILE); }
  catch (e) { console.warn(`  (site.config) could not load .env: ${e.message}`); }
}

const env = process.env;

export const config = {
  repo:    env.WIT_REPO_URL    || 'https://github.com/PurpleReverie/witlang',
  title:   env.WIT_SITE_TITLE  || 'Wit',
  tagline: env.WIT_SITE_TAGLINE || 'Write the paper. Not the preamble.',
  siteUrl: env.WIT_SITE_URL    || '',
  // Runtime server (server.mjs / pm2). PORT and HOST come from .env.
  port:    Number(env.PORT) || 8000,
  host:    env.HOST || '0.0.0.0',
};
