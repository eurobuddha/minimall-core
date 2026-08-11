'use strict';
// miniMall-core studio: a tiny local web app (http://localhost:3456) to enter a shop's catalog +
// vendor card and build the Shop + Inbox APKs. No external deps.

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const builder = require('./builder');

const PORT = process.env.PORT || 3456;
const WEB_DIR = path.join(__dirname, '..', 'web');
// When packaged with pkg the snapshot is read-only, so write bundles to a real, writable dir.
const DIST_DIR = process.pkg ? path.join(os.tmpdir(), 'minimerch-bundles') : path.join(__dirname, '..', 'dist');

function mime(ext) {
  return { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.shop': 'application/octet-stream' }[ext] || 'application/octet-stream';
}
function serveFile(res, filePath) {
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const data = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime(path.extname(filePath)), 'Content-Length': data.length });
  res.end(data);
}
function jsonResponse(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });
}

async function handleBuild(req, res) {
  try {
    const cfg = JSON.parse((await readBody(req)).toString());
    if (!cfg.products || !cfg.products.length) return jsonResponse(res, 400, { error: 'Add at least one product' });
    if (!cfg.vendorPublicId || !cfg.vendorAddress) return jsonResponse(res, 400, { error: 'Paste your Vendor Card (from the Inbox app) first' });
    const result = await builder.build(cfg, DIST_DIR, { onLog: (m) => console.log(m) });
    jsonResponse(res, 200, { ok: true, bundle: path.basename(result.bundle) });
  } catch (e) {
    console.error('Build error:', e);
    jsonResponse(res, 500, { error: e.message });
  }
}

function handleDownload(res, name) {
  const filePath = path.join(DIST_DIR, path.basename(name));
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mime('.shop'),
    'Content-Disposition': `attachment; filename="${path.basename(name)}"`,
    'Content-Length': data.length,
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  // No CORS headers: the UI is same-origin, and this server shells out to gradle — we don't want
  // arbitrary web pages able to drive it. (Also bound to loopback below.)
  const url = req.url.split('?')[0];
  try {
    if (url === '/' || url === '/index.html') return serveFile(res, path.join(WEB_DIR, 'index.html'));
    if (url === '/app.js') return serveFile(res, path.join(WEB_DIR, 'app.js'));
    if (url === '/style.css') return serveFile(res, path.join(WEB_DIR, 'style.css'));
    if (url === '/api/tokens' && req.method === 'GET') return jsonResponse(res, 200, builder.TOKENS);
    if (url === '/api/build' && req.method === 'POST') return await handleBuild(req, res);
    if (url.startsWith('/api/download/')) return handleDownload(res, decodeURIComponent(url.slice('/api/download/'.length)));
    res.writeHead(404); res.end('Not found');
  } catch (e) { res.writeHead(500); res.end('Error: ' + e.message); }
});

server.listen(PORT, '127.0.0.1', () => {   // loopback only — never expose the build server to the LAN
  const u = `http://localhost:${PORT}`;
  console.log('miniMall-core studio → ' + u);
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${open} ${u}`, () => {});
});
