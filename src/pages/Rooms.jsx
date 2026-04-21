import { useState } from 'react'
import { useHub } from '../context/HubContext'
import { supabase } from '../lib/supabase'

const ROOMS = ['Primary Bedroom', 'Bathroom', 'Kitchen', 'Living Room']

function OptionRow({ option, itemId, onDelete }) {
  return (
    <div className="option-row">
      <span className="option-name">{option.name || '—'}</span>
      <span className="option-price">{option.price || '—'}</span>
      <span className="option-store">{option.store || '—'}</span>
      <span className="option-link">
        {option.link ? <a href={option.link} target="_blank" rel="noreferrer">View ↗</a> : '—'}
      </span>
      <button className="btn-del" onClick={() => onDelete(option.id, itemId)}>×</button>
    </div>
  )
}

function AddOptionForm({ itemId, onAdd }) {
  const [form, setForm] = useState({ name: '', price: '', store: '', link: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleAdd() {
    if (!form.name && !form.store) return
    await onAdd(itemId, form)
    setForm({ name: '', price: '', store: '', link: '' })
  }

  return (
    <div className="add-option-row">
      <input placeholder="Option name"  value={form.name}  onChange={e => set('name', e.target.value)} />
      <input placeholder="Price"        value={form.price} onChange={e => set('price', e.target.value)} />
      <input placeholder="Store"        value={form.store} onChange={e => set('store', e.target.value)} />
      <input placeholder="https://..."  value={form.link}  onChange={e => set('link', e.target.value)} type="url" />
      <button className="btn-add-option" onClick={handleAdd}>+ Add</button>
    </div>
  )
}

function ItemCard({ item }) {
  const [open, setOpen]     = useState(false)
  const { setItems, setSyncState } = useHub()

  const bc = item.status === 'Have It' ? 'badge-have' : item.status === 'Need to Buy' ? 'badge-buy' : 'badge-tbd'
  const bl = item.status === 'Have It' ? 'Have it'   : item.status === 'Need to Buy' ? 'Need to buy' : 'TBD'

  async function updateField(field, value) {
    setSyncState('saving')
    const { error } = await supabase.from('items').update({ [field]: value }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, [field]: value } : i))
    setSyncState('live')
  }

  async function addOption(itemId, form) {
    setSyncState('saving')
    const { data, error } = await supabase.from('item_options').insert({ item_id: itemId, ...form }).select().single()
    if (!error) setItems(prev => prev.map(i => i.id === itemId ? { ...i, item_options: [...(i.item_options || []), data] } : i))
    setSyncState('live')
  }

  async function deleteOption(optionId, itemId) {
    setSyncState('saving')
    const { error } = await supabase.from('item_options').delete().eq('id', optionId)
    if (!error) setItems(prev => prev.map(i => i.id === itemId ? { ...i, item_options: i.item_options.filter(o => o.id !== optionId) } : i))
    setSyncState('live')
  }

  async function deleteItem() {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setSyncState('saving')
    await supabase.from('items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setSyncState('live')
  }

  return (
    <div className={`item-card ${open ? 'open' : ''}`}>
      <div className="item-main" onClick={() => setOpen(o => !o)}>
        <div className="item-name-text">{item.name}</div>
        <div><span className={`badge ${bc}`}>{bl}</span></div>
        <div>
          <select className="item-select" value={item.status} onChange={e => updateField('status', e.target.value)} onClick={e => e.stopPropagation()}>
            <option value="">TBD</option>
            <option value="Have It">Have it</option>
            <option value="Need to Buy">Need to buy</option>
          </select>
        </div>
        <div>
          <select className="item-select" value={item.owner} onChange={e => updateField('owner', e.target.value)} onClick={e => e.stopPropagation()}>
            <option value="">— unassigned</option>
            <option value="Marc">Marc</option>
            <option value="Shelby">Shelby</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div className="chevron">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="item-expand">
          <div className="options-header">Purchase options</div>
          <div>
            {(item.item_options || []).length === 0
              ? <div className="no-options">No options added yet.</div>
              : (item.item_options || []).map(o => (
                  <OptionRow key={o.id} option={o} itemId={item.id} onDelete={deleteOption} />
                ))
            }
          </div>
          <AddOptionForm itemId={item.id} onAdd={addOption} />
          <textarea
            className="notes-area"
            placeholder="Notes..."
            defaultValue={item.notes || ''}
            onChange={e => updateField('notes', e.target.value)}
          />
          <div className="item-delete-row">
            <button className="btn-delete-item" onClick={deleteItem}>Delete item</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddItemRow({ room }) {
  const [form, setForm] = useState({ name: '', status: '', owner: '' })
  const { setItems, setSyncState } = useHub()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleAdd() {
    if (!form.name.trim()) return
    setSyncState('saving')
    const { data, error } = await supabase
      .from('items')
      .insert({ name: form.name.trim(), room, status: form.status, owner: form.owner, notes: '' })
      .select('*, item_options(*)')
      .single()
    if (!error) {
      setItems(prev => [...prev, data])
      setForm({ name: '', status: '', owner: '' })
    }
    setSyncState('live')
  }

  return (
    <div className="add-item-row">
      <input placeholder="New item name..." value={form.name} onChange={e => set('name', e.target.value)} />
      <select value={form.status} onChange={e => set('status', e.target.value)}>
        <option value="">TBD</option>
        <option value="Have It">Have it</option>
        <option value="Need to Buy">Need to buy</option>
      </select>
      <select value={form.owner} onChange={e => set('owner', e.target.value)}>
        <option value="">— unassigned</option>
        <option value="Marc">Marc</option>
        <option value="Shelby">Shelby</option>
        <option value="Both">Both</option>
      </select>
      <div />
      <button className="btn-add-item" onClick={handleAdd}>+</button>
    </div>
  )
}

function RoomSection({ room, items }) {
  const roomItems = items.filter(i => i.room === room)
  const have = roomItems.filter(i => i.status === 'Have It').length
  const need = roomItems.filter(i => i.status === 'Need to Buy').length

  return (
    <div>
      <div className="room-header">
        <h2>{room}</h2>
        <span className="room-meta">{have} have &middot; {need} to buy &middot; {roomItems.length} total</span>
      </div>
      <div className="col-headers">
        <span>Item</span><span>Status</span><span>Assigned to</span><span>Notes</span><span></span>
      </div>
      <div>
        {roomItems.map(item => <ItemCard key={item.id} item={item} />)}
      </div>
      <AddItemRow room={room} />
    </div>
  )
}

export default function Rooms() {
  const { items, loading } = useHub()
  const [activeRoom, setActiveRoom] = useState(ROOMS[0])

  if (loading) return <div className="container"><div className="loading">Loading rooms</div></div>

  return (
    <div className="container">
      <div className="room-nav">
        {ROOMS.map(r => (
          <button key={r} className={`room-btn ${r === activeRoom ? 'active' : ''}`} onClick={() => setActiveRoom(r)}>
            {r}
          </button>
        ))}
      </div>
      <RoomSection room={activeRoom} items={items} />
    </div>
  )
}
