import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Shopping from './pages/Shopping'
import Purchases from './pages/Purchases'

export default function App() {
  const [view, setView] = useState('dashboard')

  useEffect(() => {
    document.body.classList.toggle('dash-mode', view === 'dashboard')
  }, [view])

  const pages = {
    dashboard: <Dashboard setView={setView} />,
    rooms:     <Rooms />,
    shopping:  <Shopping />,
    purchases: <Purchases />,
  }

  return (
    <>
      <Nav view={view} setView={setView} />
      {pages[view]}
    </>
  )
}