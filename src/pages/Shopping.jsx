import { useHub } from '../context/HubContext'

export default function Shopping() {
  const { items, loading } = useHub()

  if (loading) return <div className="container"><div className="loading">Loading</div></div>

  const needItems = items.filter(i => i.status === 'Need to Buy' || !i.status)
  const withOpts  = needItems.filter(i => (i.item_options || []).length > 0)
  const noOpts    = needItems.filter(i => !(i.item_options || []).length)

  const ShopCard = ({ item }) => (
    <div className="shop-card">
      <div className="shop-item-name">{item.name}</div>
      <div className="shop-room">{item.room}</div>
      {(item.item_options || []).length > 0
        ? (item.item_options || []).map(o => (
            <div className="shop-option" key={o.id}>
              <div>
                <div className="shop-option-name">{o.name || o.store || 'Option'}</div>
                <div className="shop-option-store">{o.store || ''}</div>
              </div>
              <div className="shop-option-right">
                <div className="shop-option-price">{o.price || '—'}</div>
                {o.link && <div className="shop-option-link"><a href={o.link} target="_blank" rel="noreferrer">View ↗</a></div>}
              </div>
            </div>
          ))
        : <div className="no-shop-options">No options yet</div>
      }
    </div>
  )

  return (
    <div className="container">
      <div className="shopping-grid">
        {withOpts.length > 0 && <>
          <div className="shop-section-title">With options ({withOpts.length})</div>
          {withOpts.map(item => <ShopCard key={item.id} item={item} />)}
        </>}
        {noOpts.length > 0 && <>
          <div className="shop-section-title">Still need options ({noOpts.length})</div>
          {noOpts.map(item => <ShopCard key={item.id} item={item} />)}
        </>}
      </div>
    </div>
  )
}
