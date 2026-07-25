// Shared <head> metadata for both the docs (generate.mjs) and the landing
// (finalize-landing.mjs): favicon, description, and Open Graph / Twitter tags
// so the site has a proper tab icon, search snippet, and link unfurl.

import { config } from './site.config.mjs';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A tiny inline SVG favicon — a serif "W" on the brand accent. No external file.
const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect width="32" height="32" rx="6" fill="#8a2b39"/>' +
  '<text x="16" y="23" font-family="Georgia,serif" font-size="20" ' +
  'fill="#fff8ef" text-anchor="middle">W</text></svg>';
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);

// Absolute URL for a target path, when a canonical site URL is configured.
function abs(path = '') {
  if (!config.siteUrl) return '';
  return config.siteUrl.replace(/\/$/, '') + path;
}

// Head tags for one page. `title` is the full <title>; `description` is the
// meta/OG description; `path` is the site-root-relative URL of this page.
export function headTags({ title, description, path = '/' }) {
  const url = abs(path);
  const img = abs('/og.png');
  const t = esc(title), d = esc(description);
  const lines = [
    `<link rel="icon" href="${FAVICON}">`,
    `<meta name="description" content="${d}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(config.title)}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    url && `<meta property="og:url" content="${esc(url)}">`,
    img && `<meta property="og:image" content="${esc(img)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    img && `<meta name="twitter:image" content="${esc(img)}">`,
  ].filter(Boolean);
  return lines.join('\n');
}

export { FAVICON };
