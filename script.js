// script.js - versi dengan pencarian, sortir, modal produk, badge, dan perbaikan UI
const PRODUCTS_URL = 'products.json';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let NASA_PRODUCTS = []; // data produk
let cart = {}; // { id: qty }

function formatIDR(n){ return 'Rp' + Number(n).toLocaleString('id-ID'); }

function toast(msg, ms=1800){
  const t = $('#toast');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._hide);
  t._hide = setTimeout(()=> t.classList.add('hidden'), ms);
}

function saveCart(){ localStorage.setItem('nasa_cart', JSON.stringify(cart)); updateCartCount(); }
function loadCart(){ cart = JSON.parse(localStorage.getItem('nasa_cart') || '{}'); updateCartCount(); }
function updateCartCount(){ const c = Object.values(cart).reduce((s,q)=>s+q,0); $$('#cart-count').forEach(el=>el.textContent = c); }

async function loadProducts(){
  const local = JSON.parse(localStorage.getItem('nasa_products') || 'null');
  if(local && Array.isArray(local) && local.length){
    NASA_PRODUCTS = local;
    window.NASA_PRODUCTS = NASA_PRODUCTS;
    return NASA_PRODUCTS;
  }
  const resp = await fetch(PRODUCTS_URL);
  const data = await resp.json();
  NASA_PRODUCTS = data;
  window.NASA_PRODUCTS = NASA_PRODUCTS;
  return NASA_PRODUCTS;
}

function productBadgeHTML(p){
  const badges = [];
  if(p.bestseller) badges.push('<span class="badge bestseller">BestSeler</span>');
  if(p.promo) badges.push('<span class="badge promo" style="left:auto;right:12px;top:12px">Promo</span>');
  return badges.join('');
}

function renderProductCard(p){
  return `
    <div class="product" data-id="${p.id}">
      ${productBadgeHTML(p)}
      <img src="${p.image}" alt="${p.name}" />
      <h4>${p.name}</h4>
      <p class="desc">${p.short || ''}</p>
      <div class="price">${formatIDR(p.price)}</div>
      <div class="actions">
        <button class="btn" data-action="detail" data-id="${p.id}">Detail</button>
        <button class="btn primary" data-action="add" data-id="${p.id}">Tambah</button>
      </div>
    </div>
  `;
}

function renderProductsGrid(products, containerSelector){
  const container = document.querySelector(containerSelector);
  if(!container) return;
  if(!products || products.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = products.map(renderProductCard).join('');
}

function showProductsByFilter(filterFn, containerSelector){
  const list = NASA_PRODUCTS.filter(filterFn);
  renderProductsGrid(list, containerSelector);
}

// Search + Sort
function applySearchAndSort(){
  const q = ($('#search-input') && $('#search-input').value || '').trim().toLowerCase();
  const sort = $('#sort-select') ? $('#sort-select').value : 'default';
  let list = NASA_PRODUCTS.slice();

  if(q){
    list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.short||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
  }

  if(sort === 'price-asc') list.sort((a,b)=>a.price - b.price);
  else if(sort === 'price-desc') list.sort((a,b)=>b.price - a.price);
  else if(sort === 'name-asc') list.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
  else list.sort((a,b)=> (b.id || 0) - (a.id || 0)); // default: terbaru berdasarkan id timestamp (admin added)

  renderProductsGrid(list, '#products-all');
  $('#no-results').classList.toggle('hidden', list.length > 0);
}

// Product modal
function openProductModal(p){
  const body = $('#prod-modal-body');
  if(!body) return;
  body.innerHTML = `
    <div class="prod-modal-content">
      <div class="prod-media"><img src="${p.image}" alt="${p.name}" /></div>
      <div class="prod-info">
        <h3>${p.name}</h3>
        <div class="muted">${p.category || ''}</div>
        <div class="price">${formatIDR(p.price)}</div>
        <p style="margin-top:8px">${p.long || p.short || ''}</p>
        <div class="qty-controls">
          <label style="margin-right:8px">Jumlah</label>
          <button class="btn" id="qty-dec">-</button>
          <span id="qty-val" style="min-width:28px;display:inline-block;text-align:center">1</span>
          <button class="btn" id="qty-inc">+</button>
        </div>
        <div style="margin-top:12px">
          <button id="modal-add" class="btn primary">Tambah ke Keranjang</button>
          <button id="modal-close" class="btn" style="margin-left:8px">Tutup</button>
        </div>
      </div>
    </div>
  `;
  $('#prod-modal').classList.remove('hidden');
  $('#prod-modal').setAttribute('aria-hidden','false');

  let qty = 1;
  const setQty = (v) => { qty = Math.max(1, v); $('#qty-val').textContent = qty; };

  $('#qty-dec').addEventListener('click', ()=> setQty(qty - 1));
  $('#qty-inc').addEventListener('click', ()=> setQty(qty + 1));
  $('#modal-add').addEventListener('click', ()=> {
    addToCart(p.id, qty);
    closeProductModal();
  });
  $('#modal-close').addEventListener('click', closeProductModal);
  $('#close-prod-modal').addEventListener('click', closeProductModal);
}

function closeProductModal(){
  $('#prod-modal').classList.add('hidden');
  $('#prod-modal').setAttribute('aria-hidden','true');
  $('#prod-modal-body').innerHTML = '';
}

// Cart operations
function addToCart(id, qty=1){
  cart[id] = (cart[id]||0) + qty;
  saveCart();
  toast('Produk ditambahkan ke keranjang');
  renderCheckoutMini();
}
function changeQty(id, delta){
  const cur = cart[id] || 0;
  const next = cur + delta;
  if(next <= 0) delete cart[id];
  else cart[id] = next;
  saveCart();
  renderCheckoutMini();
}
function removeFromCart(id){
  delete cart[id];
  saveCart();
  renderCheckoutMini();
}

// Render checkout mini on homepage
function renderCheckoutMini(){
  const el = $('#checkout-mini');
  if(!el) return;
  const ids = Object.keys(cart);
  if(ids.length === 0){
    el.innerHTML = '<p>Keranjang kosong.</p>';
    updateCartCount();
    return;
  }
  let total = 0;
  const rows = ids.map(id => {
    const p = NASA_PRODUCTS.find(x=>x.id===id) || {name:id,price:0,image:''};
    const qty = cart[id];
    total += (p.price||0) * qty;
    return `
      <div class="cart-item">
        <img src="${p.image||''}" alt="${p.name}" />
        <div style="flex:1">
          <strong>${p.name}</strong>
          <div class="muted">${formatIDR(p.price)} x ${qty}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div>${formatIDR((p.price||0)*qty)}</div>
          <div>
            <button class="btn" data-action="dec-mini" data-id="${id}">-</button>
            <button class="btn" data-action="inc-mini" data-id="${id}">+</button>
            <button class="btn" data-action="remove-mini" data-id="${id}">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  el.innerHTML = `
    ${rows}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
      <div><strong>Total:</strong> ${formatIDR(total)}</div>
      <div>
        <button id="clear-cart-mini" class="btn">Kosongkan</button>
        <a href="checkout.html" class="btn primary">Lanjut ke Checkout</a>
      </div>
    </div>
  `;
  updateCartCount();
  // attach events for mini cart
  el.querySelectorAll('[data-action="dec-mini"]').forEach(btn => btn.addEventListener('click', () => changeQty(btn.getAttribute('data-id'), -1)));
  el.querySelectorAll('[data-action="inc-mini"]').forEach(btn => btn.addEventListener('click', () => changeQty(btn.getAttribute('data-id'), 1)));
  el.querySelectorAll('[data-action="remove-mini"]').forEach(btn => btn.addEventListener('click', (e)=> {
    if(confirm('Hapus item?')) removeFromCart(e.currentTarget.getAttribute('data-id'));
  }));
  const clearBtn = document.getElementById('clear-cart-mini');
  if(clearBtn) clearBtn.addEventListener('click', ()=> {
    if(confirm('Kosongkan keranjang?')) {
      cart = {};
      saveCart();
      renderCheckoutMini();
    }
  });
}

// Generic event delegation for product actions
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if(action === 'add') addToCart(id,1);
  else if(action === 'detail') {
    const p = NASA_PRODUCTS.find(x=>x.id===id);
    if(p) openProductModal(p);
  } else if(action === 'dec-mini') changeQty(id, -1);
  else if(action === 'inc-mini') changeQty(id, 1);
  else if(action === 'remove-mini') {
    if(confirm('Hapus item?')) removeFromCart(id);
  }
});

// Initialization
window.addEventListener('load', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadProducts();
  loadCart();

  // categories render
  const cats = Array.from(new Set(NASA_PRODUCTS.map(p=>p.category || 'Umum')));
  const container = document.getElementById('categories');
  if(container){
    container.innerHTML = cats.map(c=>`<div class="category-card" data-cat="${c}">${c}</div>`).join('');
    container.addEventListener('click', (ev) => {
      const card = ev.target.closest('[data-cat]');
      if(!card) return;
      const cat = card.getAttribute('data-cat');
      const items = NASA_PRODUCTS.filter(p => (p.category||'Umum') === cat);
      // scroll to products area and show filtered results
      renderProductsGrid(items, '#products-all');
      document.getElementById('products-all').scrollIntoView({behavior:'smooth'});
    });
  }

  // initial render
  renderProductsGrid(NASA_PRODUCTS, '#products-all');
  showProductsByFilter(p => p.bestseller === true, '#products-bestseller');
  showProductsByFilter(p => p.promo === true, '#products-promo');

  // search & sort events
  const searchInput = $('#search-input');
  const sortSelect = $('#sort-select');
  if(searchInput) searchInput.addEventListener('input', () => applySearchAndSort());
  if(sortSelect) sortSelect.addEventListener('change', () => applySearchAndSort());

  // contact form
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      contactForm.reset();
      toast('Pesan terkirim (demo). Terima kasih!');
    });
  }

  // checkout mini
  renderCheckoutMini();

  // modal close when clicking backdrop
  const prodModal = $('#prod-modal');
  if(prodModal){
    prodModal.addEventListener('click', (ev) => {
      if(ev.target === prodModal) closeProductModal();
    });
  }

  // mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  if(navToggle){
    navToggle.addEventListener('click', () => {
      const nav = document.getElementById('main-nav');
      if(nav.style.display === 'flex') nav.style.display = '';
      else nav.style.display = 'flex';
    });
  }

  // set active nav by hash
  function setActiveFromHash(){
    const hash = location.hash || '#home';
    $$('.nav-link').forEach(a => {
      const href = a.getAttribute('href');
      if(href === hash) a.classList.add('active');
      else a.classList.remove('active');
    });
  }
  setActiveFromHash();
  window.addEventListener('hashchange', setActiveFromHash);
});