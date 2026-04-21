// ─────────────────────────────────────────
// Shared state
// ─────────────────────────────────────────
let items     = [];
let purchases = [];

const ROOMS = ['Primary Bedroom', 'Bathroom', 'Kitchen', 'Living Room'];

// ── Sync indicator ──
function setSyncState(state) {
  const dot   = document.getElementById('sync-dot');
  const label = document.getElementById('sync-label');
  if (!dot || !label) return;
  dot.className = 'sync-dot ' + state;
  label.textContent = state === 'live' ? 'Live' : state === 'saving' ? 'Saving…' : 'Connecting…';
}

// ── Error banner ──
function showError(msg, persistent = false) {
  const el = document.getElementById('error-banner');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (!persistent) setTimeout(() => el.classList.remove('show'), 5000);
}

// ── Debounce helper ──
const debounceTimers = {};
function debounce(key, fn, delay = 600) {
  clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, delay);
}
