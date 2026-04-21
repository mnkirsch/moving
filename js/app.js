// ─────────────────────────────────────────
// App bootstrap
// ─────────────────────────────────────────

async function init() {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    document.getElementById('rooms-loading').style.display = 'none';
    document.getElementById('rooms-content').style.display = 'block';
    showError('Add your Supabase URL and key to js/config.js to get started.', true);
    setSyncState('');
    return;
  }

  try {
    await fetchAll();
    setSyncState('live');
    renderStats();
    renderRooms();
    subscribeRealtime();
    document.getElementById('rooms-loading').style.display = 'none';
    document.getElementById('rooms-content').style.display = 'block';
  } catch (e) {
    showError('Could not connect to Supabase — check js/config.js.', true);
    setSyncState('');
    console.error(e);
  }
}

// ── View switching ──
function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  const names = ['rooms', 'shopping', 'purchases'];
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    if (names[i] === v) t.classList.add('active');
  });
  if (v === 'purchases') renderPurchases();
  if (v === 'shopping')  renderShopping();
}

// ── Stats ──
function renderStats() {
  const have  = items.filter(i => i.status === 'Have It').length;
  const need  = items.filter(i => i.status === 'Need to Buy').length;
  const tbd   = items.filter(i => !i.status).length;
  const spent = purchases.reduce((a, b) => a + parseFloat(b.price), 0);
  document.getElementById('hero-stats').innerHTML = `
    <div class="stat-pill green"><div class="num">${have}</div><div class="lbl">Have it</div></div>
    <div class="stat-pill amber"><div class="num">${need}</div><div class="lbl">Need to buy</div></div>
    <div class="stat-pill">      <div class="num">${tbd}</div> <div class="lbl">TBD</div></div>
    <div class="stat-pill red">  <div class="num">$${Math.round(spent).toLocaleString()}</div><div class="lbl">Spent</div></div>`;
}

// ── Start ──
document.addEventListener('DOMContentLoaded', init);
