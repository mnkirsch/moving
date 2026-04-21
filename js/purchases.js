// ─────────────────────────────────────────
// Purchases view
// ─────────────────────────────────────────

function renderPurchases() {
  document.getElementById('purchase-tbody').innerHTML = purchases.map(p => `
    <tr>
      <td>${p.item}</td>
      <td>$${parseFloat(p.price).toFixed(2)}</td>
      <td class="who-${p.who.toLowerCase()}">${p.who}</td>
      <td class="date-col">${p.purchased_date || '—'}</td>
      <td><button class="btn-del" onclick="deletePurchase(${p.id})">×</button></td>
    </tr>`).join('');

  const total = purchases.reduce((a, b) => a + parseFloat(b.price), 0);
  let marc = 0, shelby = 0;
  purchases.forEach(p => {
    const v = parseFloat(p.price);
    if      (p.who === 'Marc')   marc   += v;
    else if (p.who === 'Shelby') shelby += v;
    else                         { marc += v / 2; shelby += v / 2; }
  });

  document.getElementById('purchase-tfoot').innerHTML = `
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>$${total.toFixed(2)}</strong></td>
      <td colspan="3" class="totals-meta">Marc $${marc.toFixed(2)} · Shelby $${shelby.toFixed(2)}</td>
    </tr>`;
  document.getElementById('purchase-count').textContent = `${purchases.length} items`;

  renderBalance(marc, shelby, total);
}

function renderBalance(marc, shelby, total) {
  const diff = Math.abs(marc - shelby);
  const owes = marc < shelby ? 'Marc owes Shelby' : shelby < marc ? 'Shelby owes Marc' : 'All even!';
  const pct  = total > 0 ? (marc / total * 100) : 50;

  document.getElementById('balance-card').innerHTML = `
    <div class="balance-person person-marc">
      <span class="person-name">Marc</span>
      <span class="person-amount">$${marc.toFixed(2)}</span>
    </div>
    <div class="balance-person person-shelby">
      <span class="person-name">Shelby</span>
      <span class="person-amount">$${shelby.toFixed(2)}</span>
    </div>
    <div class="balance-bar">
      <div class="balance-fill" style="width:${Math.min(100, Math.max(0, pct)).toFixed(1)}%"></div>
    </div>
    <div class="balance-owed">
      ${diff > 0.005 ? `<strong>$${diff.toFixed(2)}</strong>${owes}` : `<strong>All even!</strong>`}
    </div>`;
}

async function addPurchase() {
  const itemEl  = document.getElementById('p-item');
  const priceEl = document.getElementById('p-price');
  const whoEl   = document.getElementById('p-who');
  const item    = itemEl.value.trim();
  const price   = parseFloat(priceEl.value);
  const who     = whoEl.value;
  if (!item || isNaN(price)) return;
  setSyncState('saving');
  try {
    const data = await dbAddPurchase(item, price, who);
    purchases.push(data);
    itemEl.value  = '';
    priceEl.value = '';
    renderPurchases();
    renderStats();
  } catch {
    showError('Failed to add purchase.');
  }
  setSyncState('live');
}

async function deletePurchase(id) {
  setSyncState('saving');
  try {
    await dbDeletePurchase(id);
    purchases = purchases.filter(p => p.id !== id);
    renderPurchases();
    renderStats();
  } catch {
    showError('Failed to delete purchase.');
  }
  setSyncState('live');
}
