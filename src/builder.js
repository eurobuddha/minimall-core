'use strict';
// Produce a portable `.shop` bundle (the catalog + vendor card) that the generic Shop app imports.
// No Android toolchain — the bundle is just JSON; the Shop/Inbox apps are generic + published once.

const fs = require('fs');
const path = require('path');

const DEFAULT_SHIPPING = [
  { id: 'uk',      label: 'UK shipping',       fee: '0' },
  { id: 'intl',    label: 'International',      fee: '0' },
  { id: 'digital', label: 'Digital / collect', fee: '0' },
];

const TOKENS = {
  Minima: '0x00',
  USDT:   '0x7D39745FBD29049BE29850B55A18BF550E4D442F930F86266E34193D89042A90',
};

function slug(s) { return String(s || 'shop').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'shop'; }

function shopJson(cfg) {
  const currency = cfg.currency || 'Minima';
  const tokenid = cfg.tokenid || TOKENS[currency] || '0x00';
  const products = (cfg.products || []).map((p, i) => ({
    id: p.id || ('p' + i),
    name: p.name || ('Item ' + (i + 1)),
    description: p.description || '',
    mode: p.mode === 'weight' ? 'weight' : 'units',
    price: String(p.price != null ? p.price : '0'),
    maxUnits: parseInt(p.maxUnits != null ? p.maxUnits : 10, 10) || 10,
    image: p.image || '',           // base64 JPEG (no data: prefix) or ''
  }));
  return JSON.stringify({
    shopName: cfg.shopName || 'miniMall Shop',
    shopId: cfg.shopId || slug(cfg.shopName),
    vendorPublicId: cfg.vendorPublicId || '',
    vendorAddress: cfg.vendorAddress || '',
    currency, tokenid,
    shipping: cfg.shipping && cfg.shipping.length ? cfg.shipping : DEFAULT_SHIPPING,
    products,
  }, null, 2);
}

/** Write a `.shop` bundle to outDir. cfg: {shopName, currency, tokenid, vendorPublicId, vendorAddress, shipping, products}. */
async function build(cfg, outDir, opts = {}) {
  const log = (m) => { if (opts.onLog) opts.onLog(m); else console.log(m); };
  if (!cfg.products || !cfg.products.length) throw new Error('Add at least one product');
  if (cfg.products.length > 40) throw new Error('Maximum 40 products per shop');
  if (!cfg.vendorPublicId || !cfg.vendorAddress) throw new Error('Vendor card (publicId + address) required');
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${slug(cfg.shopName)}.shop`);
  fs.writeFileSync(file, shopJson(cfg));
  log(`→ ${file}`);
  return { bundle: file };
}

module.exports = { build, shopJson, slug, TOKENS, DEFAULT_SHIPPING };
