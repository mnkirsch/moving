import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Shopping from './pages/Shopping'
import Purchases from './pages/Purchases'
import SportsDashboard from './pages/SportsDashboard'
import HomeAssistant from './pages/HomeAssistant'
import Settings from './pages/Settings'
import { loadHAConfig } from './lib/ha'
import { supabase } from './lib/supabase'


export default function App() {
  const [view, setView]         = useState('dashboard')
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadHAConfig()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dash-mode', view === 'dashboard')
    if (view !== 'dashboard') setEditMode(false)
  }, [view])

  const pages = {
    dashboard: <Dashboard setView={setView} editMode={editMode} setEditMode={setEditMode} />,
    rooms:     <Rooms />,
    shopping:  <Shopping />,
    purchases: <Purchases />,
    sports:    <SportsDashboard />,
    home:      <HomeAssistant />,
    settings:  <Settings />,
  }

  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const channel = supabase
      .channel('notes-notify')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, payload => {
        setNotification(payload.new)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])


  return (
  <>
    <Nav view={view} setView={setView} editMode={editMode} setEditMode={setEditMode} />
    {notification && (
      <div className="note-notification" onClick={() => setNotification(null)}>
        <span className="note-notification-author">{notification.author}</span>
        <span className="note-notification-message">{notification.message}</span>
        <span className="note-notification-close">×</span>
      </div>
    )}
    {pages[view]}
  </>
)
}