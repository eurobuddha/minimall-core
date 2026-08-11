#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const cmd = process.argv[2];

if (cmd === 'build') {
  const builder = require('./builder');
  const cfgPath = process.argv[3];
  const outDir = process.argv[4] || path.join(__dirname, '..', 'dist');
  if (!cfgPath) { console.error('usage: mini-merch-core build <config.json> [outDir]'); process.exit(1); }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  builder.build(cfg, outDir, { verbose: true })
    .then((r) => { console.log('\nBuilt bundle: ' + r.bundle); })
    .catch((e) => { console.error('Build failed:', e.message); process.exit(1); });
} else if (cmd === 'studio') {
  require('./studio');
} else {
  console.log([
    'miniMall-core — native Minima-Core shop builder',
    '',
    '  mini-merch-core build <config.json> [outDir]   build shop + inbox APKs',
    '  mini-merch-core studio                         launch the web studio (http://localhost:3456)',
  ].join('\n'));
}
