import { useHub } from '../context/HubContext'

export default function Nav({ view, setView, editMode, setEditMode }) {
  const { syncState } = useHub()

  const tabs = [
    { id: 'dashboard', label: 'Home' },
    { id: 'home',      label: 'Controls' },
    { id: 'rooms',     label: 'Rooms' },
    { id: 'shopping',  label: 'Shopping list' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'sports',    label: 'Sports' },
    { id: 'settings',  label: 'Settings' },
  ]

  return (
    <nav>
      <div className="nav-logo">Marc <span>&amp;</span> Shelby</div>
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${view === tab.id ? 'active' : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {view === 'dashboard' && (
          <button
            className={`dash-edit-btn ${editMode ? 'active' : ''}`}
            onClick={() => setEditMode(e => !e)}
          >
            {editMode ? '🔒 Lock' : '✏️ Edit'}
          </button>
        )}
        <span className={`sync-dot ${syncState}`} />
        <span>
          {syncState === 'live' ? 'Live' : syncState === 'error' ? 'Connection error' : 'Connecting...'}
        </span>
      </div>
    </nav>
  )
}