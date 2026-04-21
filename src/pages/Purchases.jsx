import { useState } from 'react'
import { useHub } from '../context/HubContext'
import { supabase } from '../lib/supabase'

export default function Purchases() {
  const { purchases, setPurchases, setSyncState } = useHub()
  const [form, setForm] = useState({ item: '', price: '', who: 'Marc' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const total  = purchases.reduce((a, b) => a + parseFloat(b.price), 0)
  let marc = 0, shelby = 0
  purchases.forEach(p => {
    const v = parseFloat(p.price)
    if      (p.who === 'Marc')   marc   += v
    else if (p.who === 'Shelby') shelby += v
    else                         { marc += v / 2; shelby += v / 2 }
  })
  const diff = Math.abs(marc - shelby)
  const owes = marc < shelby
    ? `Marc owes Shelby`
    : shelby < marc
    ? `Shelby owes Marc`
    : 'All even!'

  async function addPurchase() {
    const price = parseFloat(form.price)
    if (!form.item.trim() || isNaN(price)) return
    setSyncState('saving')
    const { data, error } = await supabase.from('purchases').insert({ item: form.item.trim(), price, who: form.who }).select().single()
    if (!error) {
      setPurchases(prev => [...prev, data])
      setForm({ item: '', price: '', who: 'Marc' })
    }
    setSyncState('live')
  }

  async function deletePurchase(id) {
    setSyncState('saving')
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (!error) setPurchases(prev => prev.filter(p => p.id !== id))
    setSyncState('live')
  }

  const pct = total > 0 ? (marc / total * 100) : 50

  return (
    <div className="container">
      <div className="purchases-layout">
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Purchase log</h3>
              <span>{purchases.length} items</span>
            </div>
            <table className="purchase-table">
              <thead>
                <tr><th>Item</th><th>Price</th><th>Who paid</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td>{p.item}</td>
                    <td>${parseFloat(p.price).toFixed(2)}</td>
                    <td className={`who-${p.who.toLowerCase()}`}>{p.who}</td>
                    <td className="date-col">{p.purchased_date || '—'}</td>
                    <td><button className="btn-del" onClick={() => deletePurchase(p.id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>${total.toFixed(2)}</strong></td>
                  <td colSpan="3" className="totals-meta">Marc ${marc.toFixed(2)} &middot; Shelby ${shelby.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="add-purchase">
              <input type="text"   placeholder="Item name" value={form.item}  onChange={e => set('item', e.target.value)} />
              <input type="number" placeholder="$0.00"     value={form.price} onChange={e => set('price', e.target.value)} step="0.01" />
              <select value={form.who} onChange={e => set('who', e.target.value)}>
                <option value="Marc">Marc</option>
                <option value="Shelby">Shelby</option>
                <option value="Both">Both</option>
              </select>
              <button className="btn-add-purchase" onClick={addPurchase}>Add</button>
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-header"><h3>Balance</h3></div>
            <div className="balance-card">
              <div className="balance-person person-marc">
                <span className="person-name">Marc</span>
                <span className="person-amount">${marc.toFixed(2)}</span>
              </div>
              <div className="balance-person person-shelby">
                <span className="person-name">Shelby</span>
                <span className="person-amount">${shelby.toFixed(2)}</span>
              </div>
              <div className="balance-bar">
                <div className="balance-fill" style={{ width: `${Math.min(100, Math.max(0, pct)).toFixed(1)}%` }} />
              </div>
              <div className="balance-owed">
                {diff > 0.005 ? <><strong>${diff.toFixed(2)}</strong>{owes}</> : <strong>All even!</strong>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
