// ─────────────────────────────────────────
// Rooms view
// ─────────────────────────────────────────

function renderRooms() {
  const openCards  = new Set([...document.querySelectorAll('.item-card.open')].map(el => el.dataset.id));
  const activeRoom = document.querySelector('.room-section.active')
    ?.id?.replace('room-', '').replace(/-/g, ' ') || ROOMS[0];

  document.getElementById('room-nav').innerHTML = ROOMS.map(r =>
    `<button class="room-btn ${r === activeRoom ? 'active' : ''}"
       onclick="switchRoom('${r.replace(/'/g, "\\'")}', this)">${r}</button>`
  ).join('');

  document.getElementById('room-sections').innerHTML = ROOMS.map(room => {
    const roomItems = items.filter(i => i.room === room);
    const have      = roomItems.filter(i => i.status === 'Have It').length;
    const need      = roomItems.filter(i => i.status === 'Need to Buy').length;
    const roomId    = room.replace(/\s+/g, '-');
    return `
    <div class="room-section ${room === activeRoom ? 'active' : ''}" id="room-${roomId}">
      <div class="room-header">
        <h2>${room}</h2>
        <span class="room-meta">${have} have · ${need} to buy · ${roomItems.length} total</span>
      </div>
      <div class="col-headers">
        <span>Item</span><span>Status</span><span>Assigned to</span><span>Notes</span><span></span>
      </div>
      <div>
        ${roomItems.map(item => renderItemCard(item, openCards.has(String(item.id)))).join('')}
      </div>
      <div class="add-item-row">
        <input type="text" placeholder="New item name…" id="new-item-name-${roomId}" />
        <select id="new-item-status-${roomId}">
          <option value="">TBD</option>
          <option value="Have It">Have it</option>
          <option value="Need to Buy">Need to buy</option>
        </select>
        <select id="new-item-owner-${roomId}">
          <option value="">— unassigned</option>
          <option value="Marc">Marc</option>
          <option value="Shelby">Shelby</option>
          <option value="Both">Both</option>
        </select>
        <div></div>
        <button class="btn-add-item" onclick="addItem('${room.replace(/'/g, "\\'")}')" title="Add item">+</button>
      </div>
    </div>`;
  }).join('');
}

function renderItemCard(item, isOpen) {
  const bc   = item.status === 'Have It' ? 'badge-have' : item.status === 'Need to Buy' ? 'badge-buy' : 'badge-tbd';
  const bl   = item.status === 'Have It' ? 'Have it'   : item.status === 'Need to Buy' ? 'Need to buy' : 'TBD';
  const opts = (item.item_options || []).map(o => `
    <div class="option-row">
      <span class="option-name">${o.name  || '—'}</span>
      <span class="option-price">${o.price || '—'}</span>
      <span class="option-store">${o.store || '—'}</span>
      <span class="option-link">${o.link ? `<a href="${o.link}" target="_blank">View ↗</a>` : '—'}</span>
      <button class="btn-del" onclick="deleteOption(${o.id}, ${item.id})">×</button>
    </div>`).join('');

  return `
  <div class="item-card ${isOpen ? 'open' : ''}" id="card-${item.id}" data-id="${item.id}">
    <div class="item-main" onclick="toggleCard(${item.id})">
      <div class="item-name-text">${item.name}</div>
      <div><span class="badge ${bc}" id="badge-${item.id}">${bl}</span></div>
      <div>
        <select class="item-select" onchange="updateStatus(${item.id}, this.value)" onclick="event.stopPropagation()">
          <option value=""         ${!item.status                ? 'selected' : ''}>TBD</option>
          <option value="Have It"  ${item.status === 'Have It'   ? 'selected' : ''}>Have it</option>
          <option value="Need to Buy" ${item.status === 'Need to Buy' ? 'selected' : ''}>Need to buy</option>
        </select>
      </div>
      <div>
        <select class="item-select" onchange="updateOwner(${item.id}, this.value)" onclick="event.stopPropagation()">
          <option value=""       ${!item.owner              ? 'selected' : ''}>— unassigned</option>
          <option value="Marc"   ${item.owner === 'Marc'    ? 'selected' : ''}>Marc</option>
          <option value="Shelby" ${item.owner === 'Shelby'  ? 'selected' : ''}>Shelby</option>
          <option value="Both"   ${item.owner === 'Both'    ? 'selected' : ''}>Both</option>
        </select>
      </div>
      <div class="chevron">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="item-expand">
      <div class="options-header">Purchase options</div>
      <div id="options-${item.id}">${opts || '<div class="no-options">No options added yet.</div>'}</div>
      <div class="add-option-row">
        <input type="text" placeholder="Option name"  id="opt-name-${item.id}" />
        <input type="text" placeholder="Price"        id="opt-price-${item.id}" />
        <input type="text" placeholder="Store"        id="opt-store-${item.id}" />
        <input type="url"  placeholder="https://…"    id="opt-link-${item.id}" />
        <button class="btn-add-option" onclick="addOption(${item.id})">+ Add</button>
      </div>
      <textarea class="notes-area" placeholder="Notes…"
        onchange="updateNotes(${item.id}, this.value)">${item.notes || ''}</textarea>
    </div>
  </div>`;
}

function toggleCard(id) {
  document.getElementById('card-' + id).classList.toggle('open');
}

function switchRoom(room, btn) {
  document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.room-section').forEach(s => s.classList.remove('active'));
  document.getElementById('room-' + room.replace(/\s+/g, '-')).classList.add('active');
}

// ── Mutations ──
async function updateStatus(id, val) {
  const item = items.find(i => i.id === id);
  item.status = val;
  const badge = document.getElementById('badge-' + id);
  if (badge) {
    badge.className = 'badge ' + (val === 'Have It' ? 'badge-have' : val === 'Need to Buy' ? 'badge-buy' : 'badge-tbd');
    badge.textContent = val === 'Have It' ? 'Have it' : val === 'Need to Buy' ? 'Need to buy' : 'TBD';
  }
  renderStats();
  setSyncState('saving');
  await dbUpdateStatus(id, val);
  setSyncState('live');
}

async function updateOwner(id, val) {
  items.find(i => i.id === id).owner = val;
  setSyncState('saving');
  await dbUpdateOwner(id, val);
  setSyncState('live');
}

async function updateNotes(id, val) {
  items.find(i => i.id === id).notes = val;
  debounce('notes-' + id, async () => {
    setSyncState('saving');
    await dbUpdateNotes(id, val);
    setSyncState('live');
  });
}

async function addItem(room) {
  const roomKey  = room.replace(/\s+/g, '-');
  const nameEl   = document.getElementById('new-item-name-'   + roomKey);
  const statusEl = document.getElementById('new-item-status-' + roomKey);
  const ownerEl  = document.getElementById('new-item-owner-'  + roomKey);
  const name     = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  setSyncState('saving');
  try {
    const data = await dbAddItem(name, room, statusEl.value, ownerEl.value);
    items.push(data);
    nameEl.value   = '';
    statusEl.value = '';
    ownerEl.value  = '';
    renderStats();
    renderRooms();
  } catch {
    showError('Failed to add item.');
  }
  setSyncState('live');
}

async function addOption(itemId) {
  const name  = document.getElementById('opt-name-'  + itemId).value.trim();
  const price = document.getElementById('opt-price-' + itemId).value.trim();
  const store = document.getElementById('opt-store-' + itemId).value.trim();
  const link  = document.getElementById('opt-link-'  + itemId).value.trim();
  if (!name && !store) return;
  setSyncState('saving');
  try {
    const data = await dbAddOption(itemId, name, price, store, link);
    const item = items.find(i => i.id === itemId);
    item.item_options = [...(item.item_options || []), data];
    const container = document.getElementById('options-' + itemId);
    const hint = container.querySelector('.no-options');
    if (hint) hint.remove();
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <span class="option-name">${data.name  || '—'}</span>
      <span class="option-price">${data.price || '—'}</span>
      <span class="option-store">${data.store || '—'}</span>
      <span class="option-link">${data.link ? `<a href="${data.link}" target="_blank">View ↗</a>` : '—'}</span>
      <button class="btn-del" onclick="deleteOption(${data.id}, ${itemId})">×</button>`;
    container.appendChild(row);
    ['opt-name-', 'opt-price-', 'opt-store-', 'opt-link-'].forEach(p => {
      document.getElementById(p + itemId).value = '';
    });
  } catch {
    showError('Failed to add option.');
  }
  setSyncState('live');
}

async function deleteOption(optionId, itemId) {
  setSyncState('saving');
  try {
    await dbDeleteOption(optionId);
    const item = items.find(i => i.id === itemId);
    item.item_options = item.item_options.filter(o => o.id !== optionId);
    const container = document.getElementById('options-' + itemId);
    container.querySelectorAll('.option-row').forEach(row => {
      if (row.querySelector('.btn-del')?.getAttribute('onclick')?.includes('deleteOption(' + optionId)) {
        row.remove();
      }
    });
    if (!container.querySelector('.option-row')) {
      container.innerHTML = '<div class="no-options">No options added yet.</div>';
    }
  } catch {
    showError('Failed to delete option.');
  }
  setSyncState('live');
}
