// Post-process the CLI-built landing page (build/index.html).
//
// `wit build site.wit --raw` derives <title> from the filename ("site") and
// emits no favicon / description / social tags. This injects a proper title and
// the shared head metadata, so the landing has a real tab name, search snippet,
// and link unfurl — without changing the published render packages.
//
//   node finalize-landing.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './site.config.mjs';
import { headTags } from './site-meta.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, 'build', 'index.html');

const title = `${config.title} — ${config.tagline}`;
const meta = headTags({ title, description: config.tagline, path: '/' });

let html = readFileSync(FILE, 'utf8');

// Replace the filename-derived <title> and drop our tags in before </head>.
html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
html = html.replace(/<\/head>/i, `${meta}\n</head>`);

writeFileSync(FILE, html, 'utf8');
console.log(`finalized landing head -> "${title}"`);
