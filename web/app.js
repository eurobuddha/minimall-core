'use strict';

const MAX_PRODUCTS = 40;
const IMG_MAX_DIM = 1024;       // bigger so product photos look good when enlarged in the Shop
const IMG_MAX_KB = 110;         // baked into the APK (not on-chain), so we can afford detail
let currency = 'Minima';
let products = [];
let shipping = [
  { id: 'uk', label: 'UK shipping', fee: '0' },
  { id: 'intl', label: 'International', fee: '0' },
  { id: 'digital', label: 'Digital / collect', fee: '0' },
];

// Resize + JPEG-compress an image in the browser; returns base64 (no data: prefix).
function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > IMG_MAX_DIM || h > IMG_MAX_DIM) {
        if (w >= h) { h = Math.round(h * IMG_MAX_DIM / w); w = IMG_MAX_DIM; }
        else { w = Math.round(w * IMG_MAX_DIM / h); h = IMG_MAX_DIM; }
      }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const target = IMG_MAX_KB * 1024;
      let q = 0.85, data = canvas.toDataURL('image/jpeg', q);
      while (data.length * 0.75 > target && q > 0.3) { q -= 0.1; data = canvas.toDataURL('image/jpeg', q); }
      resolve(data.split(',')[1] || '');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
    img.src = url;
  });
}

function el(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

// currency segmented control
document.querySelectorAll('#currency button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#currency button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    currency = b.dataset.cur;
  });
});

// vendor card live validation
const cardInput = document.getElementById('vendorCard');
cardInput.addEventListener('input', () => {
  const s = document.getElementById('cardStatus');
  const { key, addr } = parseCard(cardInput.value);
  if (!cardInput.value.trim()) { s.textContent = ''; s.className = 'cardstatus'; return; }
  if (key && addr) { s.textContent = '✓ key + address detected'; s.className = 'cardstatus ok'; }
  else { s.textContent = 'Expected 0x…|Mx… (paste the whole Vendor Card)'; s.className = 'cardstatus bad'; }
});

function parseCard(v) {
  const parts = String(v || '').trim().split('|');
  const key = (parts[0] || '').trim();
  const addr = (parts[1] || '').trim();
  const okKey = key.startsWith('0x') && key.length >= 120;
  const okAddr = addr.startsWith('Mx') || (addr.startsWith('0x') && addr.length === 66);
  return { key: okKey ? key : '', addr: okAddr ? addr : '' };
}

function renderProducts() {
  const host = document.getElementById('products');
  host.innerHTML = '';
  products.forEach((p, i) => {
    const thumb = el('div', { class: 'thumb' });
    if (p.image) thumb.style.backgroundImage = `url(data:image/jpeg;base64,${p.image})`;
    const fileBtn = el('label', { class: 'filebtn' }, p.image ? 'Change photo' : '+ Photo');
    fileBtn.appendChild(el('input', { type: 'file', accept: 'image/*', style: 'display:none',
      onchange: async (e) => { const f = e.target.files[0]; if (!f) return; fileBtn.textContent = 'Resizing…';
        p.image = await resizeImage(f); renderProducts(); } }));
    host.appendChild(el('div', { class: 'product' }, [
      el('div', { class: 'prow' }, [
        el('input', { type: 'text', placeholder: 'Product name', value: p.name || '',
          oninput: (e) => { p.name = e.target.value; } }),
        el('button', { class: 'rm', onclick: () => { products.splice(i, 1); renderProducts(); } }, '×'),
      ]),
      el('div', { class: 'prow' }, [thumb, fileBtn]),
      el('textarea', { placeholder: 'Description (optional)', oninput: (e) => { p.description = e.target.value; } }, p.description || ''),
      el('div', { class: 'prow' }, [
        el('label', {}, 'Price'),
        el('input', { type: 'text', class: 'sm', placeholder: '0', value: p.price || '',
          oninput: (e) => { p.price = e.target.value; } }),
        el('label', {}, 'Max qty'),
        el('input', { type: 'number', class: 'sm', placeholder: '10', value: p.maxUnits || '',
          oninput: (e) => { p.maxUnits = e.target.value; } }),
      ]),
    ]));
  });
  document.getElementById('prodCount').textContent = products.length ? `(${products.length}/${MAX_PRODUCTS})` : '';
}

function renderShipping() {
  const host = document.getElementById('shipping');
  host.innerHTML = '';
  shipping.forEach((s) => {
    host.appendChild(el('div', { class: 'prow' }, [
      el('input', { type: 'text', value: s.label, placeholder: 'Label', oninput: (e) => { s.label = e.target.value; } }),
      el('label', {}, 'Fee'),
      el('input', { type: 'text', class: 'sm', value: s.fee, placeholder: '0', oninput: (e) => { s.fee = e.target.value; } }),
    ]));
  });
}

document.getElementById('addProduct').addEventListener('click', () => {
  if (products.length >= MAX_PRODUCTS) return;
  products.push({ name: '', description: '', price: '', maxUnits: 10, mode: 'units' });
  renderProducts();
});

document.getElementById('build').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const downloads = document.getElementById('downloads');
  downloads.innerHTML = '';
  const { key, addr } = parseCard(cardInput.value);
  const shopName = document.getElementById('shopName').value.trim() || 'miniMall Shop';
  const valid = products.filter((p) => p.name && p.name.trim());
  if (!key || !addr) { status.textContent = 'Paste a valid Vendor Card first.'; status.className = 'status bad'; return; }
  if (!valid.length) { status.textContent = 'Add at least one product (with a name).'; status.className = 'status bad'; return; }

  status.textContent = 'Building your shop bundle…'; status.className = 'status working';
  const cfg = {
    shopName, currency, vendorPublicId: key, vendorAddress: addr,
    shipping: shipping.map((s) => ({ id: s.id, label: (s.label || '').trim() || s.id, fee: String(s.fee || '0') })),
    products: valid.map((p, i) => ({ id: 'p' + i, name: p.name.trim(), description: (p.description || '').trim(),
      mode: 'units', price: String(p.price || '0'), maxUnits: parseInt(p.maxUnits || 10, 10) || 10, image: p.image || '' })),
  };
  try {
    const r = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'build failed');
    status.textContent = '✓ Built. Download the .shop file and share it with customers — they open it in the miniMall Shop app.';
    status.className = 'status ok';
    downloads.appendChild(el('a', { class: 'dl', href: '/api/download/' + encodeURIComponent(j.bundle) }, '⬇ ' + j.bundle));
  } catch (e) {
    status.textContent = 'Build failed: ' + e.message; status.className = 'status bad';
  }
});

// seed one empty product
products.push({ name: '', description: '', price: '', maxUnits: 10, mode: 'units' });
renderProducts();
renderShipping();
