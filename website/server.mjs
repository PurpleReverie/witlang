// Zero-dependency static file server for the built site (website/build/).
// Port and host come from .env (via site.config.mjs). Meant to run under pm2
// — see ecosystem.config.cjs and `make deploy`.
//
//   node server.mjs           # or: pm2 start ecosystem.config.cjs

import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './site.config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, 'build');
const { port, host } = config;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
};
const typeFor = (p) => TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream';

// Resolve a request URL to a file inside ROOT, or null on traversal / miss.
// Tries: exact file, dir/index.html, and clean-URL path/index.html.
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let rel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  let abs = path.join(ROOT, rel);
  if (!abs.startsWith(ROOT)) return null; // path traversal guard

  const candidates = [];
  if (decoded.endsWith('/')) candidates.push(path.join(abs, 'index.html'));
  else candidates.push(abs, path.join(abs, 'index.html'));

  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch { /* try next */ }
  }
  return null;
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }
  const file = await resolveFile(req.url || '/');
  const isHtml = (p) => p && p.endsWith('.html');

  if (!file) {
    // Friendly 404 page if present.
    let body = '404 Not Found';
    try { body = await readFile(path.join(ROOT, '404.html')); } catch { /* plain */ }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : body);
    return;
  }

  // HTML: revalidate each load (cheap, always-fresh). Fingerprint-free assets:
  // a short cache so deploys propagate quickly.
  const cache = isHtml(file)
    ? 'no-cache'
    : 'public, max-age=3600';
  res.writeHead(200, { 'Content-Type': typeFor(file), 'Cache-Control': cache });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Wit site serving ${ROOT}`);
  console.log(`  http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
});
