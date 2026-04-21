// ─────────────────────────────────────────
// Shopping list view
// ─────────────────────────────────────────

function renderShopping() {
  const needItems = items.filter(i => i.status === 'Need to Buy' || !i.status);
  const withOpts  = needItems.filter(i => (i.item_options || []).length > 0);
  const noOpts    = needItems.filter(i => !(i.item_options || []).length);

  const card = item => `
    <div class="shop-card">
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-room">${item.room}</div>
      ${(item.item_options || []).length
        ? (item.item_options || []).map(o => `
          <div class="shop-option">
            <div>
              <div class="shop-option-name">${o.name || o.store || 'Option'}</div>
              <div class="shop-option-store">${o.store || ''}</div>
            </div>
            <div class="shop-option-right">
              <div class="shop-option-price">${o.price || '—'}</div>
              ${o.link ? `<div class="shop-option-link"><a href="${o.link}" target="_blank">View ↗</a></div>` : ''}
            </div>
          </div>`).join('')
        : '<div class="no-shop-options">No options yet</div>'}
    </div>`;

  document.getElementById('shopping-grid').innerHTML =
    (withOpts.length
      ? `<div class="shop-section-title">With options (${withOpts.length})</div>` + withOpts.map(card).join('')
      : '') +
    (noOpts.length
      ? `<div class="shop-section-title">Still need options (${noOpts.length})</div>` + noOpts.map(card).join('')
      : '');
}
