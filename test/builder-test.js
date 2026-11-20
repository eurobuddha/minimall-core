'use strict';
// node test/builder-test.js — a .shop is paid in the token its currency names; the builder never writes one that is not.
const assert = require('assert');
const { shopJson, tokenFor } = require('../src/builder');

const MXUSD = '0x7D39745FBD29049BE29850B55A18BF550E4D442F930F86266E34193D89042A90';
const base = { shopName: 'Fixture', vendorPublicId: '0x' + 'ab'.repeat(64), vendorAddress: 'MxFIXTURE', products: [{ name: 'One', price: '1' }] };
const tok = (cfg) => JSON.parse(shopJson(Object.assign({}, base, cfg))).tokenid;

assert.strictEqual(tokenFor('Minima'), '0x00');
assert.strictEqual(tokenFor('USDT'), MXUSD);
assert.strictEqual(tokenFor('mxUSDT'), MXUSD);
assert.strictEqual(tokenFor('BTC'), null);

assert.strictEqual(tok({}), '0x00');
assert.strictEqual(tok({ currency: 'Minima', tokenid: '0x00' }), '0x00');
assert.strictEqual(tok({ currency: 'USDT' }), MXUSD);
assert.strictEqual(tok({ currency: 'mxUSDT' }), MXUSD);             // was written as 0x00
assert.strictEqual(tok({ currency: 'USDT', tokenid: MXUSD.toLowerCase() }), MXUSD);
assert.throws(() => tok({ currency: 'Minima', tokenid: MXUSD }), /tokenid/);   // was written as given
assert.throws(() => tok({ currency: 'USDT', tokenid: '0x00' }), /tokenid/);
assert.throws(() => tok({ currency: 'BTC' }), /cannot be paid/);            // was written as 0x00
assert.strictEqual(JSON.parse(shopJson(Object.assign({}, base, { products: [{ name: 'Half', price: '.5' }] }))).products[0].price, '.5');
assert.throws(() => tok({ products: [{ name: 'Big', price: '1e3' }] }), /plain number/);
assert.throws(() => tok({ products: [{ name: 'Neg', price: '-1' }] }), /plain number/);
assert.throws(() => tok({ shipping: [{ id: 'uk', label: 'UK', fee: '+2' }] }), /plain number/);
console.log('builder-test: ok');
