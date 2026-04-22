import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Shopping from './pages/Shopping'
import Purchases from './pages/Purchases'
import SportsDashboard from './pages/SportsDashboard'
import HomeAssistant from './pages/HomeAssistant'
import Settings from './pages/Settings'

export default function App() {
  const [view, setView]         = useState('dashboard')
  const [editMode, setEditMode] = useState(false)

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

  return (
    <>
      <Nav view={view} setView={setView} editMode={editMode} setEditMode={setEditMode} />
      {pages[view]}
    </>
  )
}