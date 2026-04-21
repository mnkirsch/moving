// ─────────────────────────────────────────
// Data layer — all Supabase interaction
// ─────────────────────────────────────────

async function fetchAll() {
  const [{ data: itemData, error: iErr }, { data: purchaseData, error: pErr }] = await Promise.all([
    db.from('items').select('*, item_options(*)').order('id'),
    db.from('purchases').select('*').order('created_at'),
  ]);
  if (iErr) throw iErr;
  if (pErr) throw pErr;
  items     = itemData;
  purchases = purchaseData;
}

async function refreshItems() {
  const { data, error } = await db.from('items').select('*, item_options(*)').order('id');
  if (error) return;
  items = data;
  renderStats();
  renderRooms();
}

async function refreshPurchases() {
  const { data, error } = await db.from('purchases').select('*').order('created_at');
  if (error) return;
  purchases = data;
  renderStats();
  const pView = document.getElementById('view-purchases');
  if (pView && pView.classList.contains('active')) renderPurchases();
}

function subscribeRealtime() {
  db.channel('househub')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' },        refreshItems)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'item_options' }, refreshItems)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' },    refreshPurchases)
    .subscribe();
}

// ── Items ──
async function dbUpdateStatus(id, val) {
  const { error } = await db.from('items').update({ status: val }).eq('id', id);
  if (error) showError('Failed to save status.');
}

async function dbUpdateOwner(id, val) {
  const { error } = await db.from('items').update({ owner: val }).eq('id', id);
  if (error) showError('Failed to save owner.');
}

async function dbUpdateNotes(id, val) {
  const { error } = await db.from('items').update({ notes: val }).eq('id', id);
  if (error) showError('Failed to save notes.');
}

async function dbAddItem(name, room, status, owner) {
  const { data, error } = await db
    .from('items')
    .insert({ name, room, status, owner, notes: '' })
    .select('*, item_options(*)')
    .single();
  if (error) throw error;
  return data;
}

// ── Options ──
async function dbAddOption(itemId, name, price, store, link) {
  const { data, error } = await db
    .from('item_options')
    .insert({ item_id: itemId, name, price, store, link })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteOption(optionId) {
  const { error } = await db.from('item_options').delete().eq('id', optionId);
  if (error) throw error;
}

// ── Purchases ──
async function dbAddPurchase(item, price, who) {
  const { data, error } = await db
    .from('purchases')
    .insert({ item, price, who })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeletePurchase(id) {
  const { error } = await db.from('purchases').delete().eq('id', id);
  if (error) throw error;
}
