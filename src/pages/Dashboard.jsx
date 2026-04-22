import { useState, useEffect, useRef } from 'react'
import { useHub } from '../context/HubContext'
import { getSetting, updateSetting, subscribeSettings } from '../lib/settings'
import SportsCarousel from '../components/SportsCarousel'
import { getClimate, getScenes, triggerScene, isReady } from '../lib/ha'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import CalendarWidget from '../components/CalendarWidget'

const DEFAULT_LAYOUT = [
  { i: 'clock',   x: 0, y: 0,  w: 12, h: 2 },
  { i: 'weather', x: 0, y: 4,  w: 6,  h: 4 },
  { i: 'home',    x: 6, y: 4,  w: 6,  h: 4 },
  { i: 'movein',  x: 0, y: 10, w: 6,  h: 4 },
  { i: 'links',   x: 6, y: 10, w: 6,  h: 4 },
  { i: 'sports',  x: 0, y: 16, w: 12, h: 4 },
  { i: 'calendar', x: 0, y: 22, w: 6, h: 6 },
]


const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function weatherLabel(code) {
  if (code === 0)  return { label: 'Clear',         icon: '☀️' }
  if (code <= 2)   return { label: 'Partly cloudy', icon: '⛅' }
  if (code === 3)  return { label: 'Overcast',      icon: '☁️' }
  if (code <= 49)  return { label: 'Foggy',         icon: '🌫️' }
  if (code <= 59)  return { label: 'Drizzle',       icon: '🌦️' }
  if (code <= 69)  return { label: 'Rain',          icon: '🌧️' }
  if (code <= 79)  return { label: 'Snow',          icon: '❄️' }
  if (code <= 82)  return { label: 'Showers',       icon: '🌧️' }
  if (code <= 84)  return { label: 'Snow showers',  icon: '🌨️' }
  if (code <= 99)  return { label: 'Thunderstorm',  icon: '⛈️' }
  return { label: 'Unknown', icon: '🌡️' }
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="dash-widget dash-clock">
      <div id="dash-time">{timeStr}</div>
      <div id="dash-date">{dateStr}</div>
    </div>
  )
}

function Weather() {
  const [weather, setWeather] = useState(null)
  const [error, setError]     = useState(false)
  const [city, setCity]       = useState('Austin, TX')

  useEffect(() => {
    async function fetch_() {
      try {
        // Load location from settings
        const general = await getSetting('general')
        const lat     = general?.location?.lat  || 30.2672
        const lon     = general?.location?.lon  || -97.7431
        const cityName = general?.location?.city || 'Austin, TX'
        setCity(cityName)

        const url =
          'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${lat}&longitude=${lon}` +
          '&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature' +
          '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
          '&temperature_unit=fahrenheit&windspeed_unit=mph' +
          '&timezone=America%2FChicago&forecast_days=5'

        const res  = await fetch(url)
        const data = await res.json()
        setWeather(data)
      } catch { setError(true) }
    }
    fetch_()
    const t = setInterval(fetch_, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  if (error)    return <div className="dash-widget"><p className="widget-error">Weather unavailable</p></div>
  if (!weather) return <div className="dash-widget"><p className="widget-error">Loading...</p></div>

  const c   = weather.current
  const d   = weather.daily
  const now = weatherLabel(c.weathercode)

  return (
    <div className="dash-widget dash-weather">
      <div className="dash-stats-title">{city}</div>
      <div className="weather-current">
        <div className="weather-icon">{now.icon}</div>
        <div className="weather-temp">{Math.round(c.temperature_2m)}&deg;</div>
        <div className="weather-meta">
          <span className="weather-label">{now.label}</span>
          <span className="weather-feels">Feels {Math.round(c.apparent_temperature)}&deg;</span>
          <span className="weather-detail">{c.relativehumidity_2m}% humidity &middot; {Math.round(c.windspeed_10m)} mph</span>
        </div>
      </div>
      <div className="weather-forecast">
        {d.time.map((dateStr, i) => {
          const day = i === 0 ? 'Today' : DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()]
          const w   = weatherLabel(d.weathercode[i])
          const pop = d.precipitation_probability_max[i]
          return (
            <div className="forecast-day" key={dateStr}>
              <span className="forecast-name">{day}</span>
              <span className="forecast-icon">{w.icon}</span>
              <span className="forecast-range">{Math.round(d.temperature_2m_max[i])}&deg; / {Math.round(d.temperature_2m_min[i])}&deg;</span>
              <span className="forecast-pop">{pop > 20 ? `💧${pop}%` : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stats() {
  const { items, purchases } = useHub()
  const need  = items.filter(i => i.status === 'Need to Buy').length
  const tbd   = items.filter(i => !i.status).length
  const spent = purchases.reduce((a, b) => a + parseFloat(b.price), 0)
  let marc = 0, shelby = 0
  purchases.forEach(p => {
    const v = parseFloat(p.price)
    if      (p.who === 'Marc')   marc   += v
    else if (p.who === 'Shelby') shelby += v
    else                         { marc += v / 2; shelby += v / 2 }
  })
  const diff = Math.abs(marc - shelby)
  const owes = marc < shelby
    ? `Marc owes Shelby $${diff.toFixed(0)}`
    : shelby < marc
    ? `Shelby owes Marc $${diff.toFixed(0)}`
    : 'All even!'

  return (
    <div className="dash-widget dash-stats-widget">
      <div className="dash-stats-title">Move-in tracker</div>
      <div id="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-num">{need}</div>
          <div className="dash-stat-lbl">Still to buy</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num">{tbd}</div>
          <div className="dash-stat-lbl">TBD</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-num">${Math.round(spent).toLocaleString()}</div>
          <div className="dash-stat-lbl">Spent so far</div>
        </div>
        <div className="dash-stat dash-stat-balance">
          <div className="dash-stat-num dash-stat-balance-label">{owes}</div>
          <div className="dash-stat-lbl">Balance</div>
        </div>
      </div>
    </div>
  )
}

function QuickLinks({ setView }) {
  const links = [
    { id: 'rooms',     label: 'Rooms' },
    { id: 'shopping',  label: 'Shopping list' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'sports',    label: 'Sports' },
    { id: 'home',      label: 'Controls' },
  ]
  return (
    <div className="dash-widget">
      <div className="dash-links-title">Quick links</div>
      <div className="dash-links">
        {links.map(l => (
          <button key={l.id} className="dash-link-btn" onClick={() => setView(l.id)}>
            {l.label} <span>&#8594;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function HomeWidget({ setView }) {
  const [climate, setClimate] = useState(null)
  const [active, setActive]   = useState(null)
  const scenes = getScenes()

  useEffect(() => {
    async function load() {
      const data = await getClimate()
      setClimate(data)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  async function trigger(scene) {
    setActive(scene.id)
    await triggerScene(scene.id)
    setTimeout(() => setActive(null), 3000)
  }

  return (
    <div className="dash-widget dash-home-widget">
      <div className="dash-stats-title">
        Home {!isReady() && <span style={{ opacity: 0.4 }}>(mock)</span>}
      </div>
      {climate && (
        <div className="dash-home-climate">
          <span className="dash-home-temp">{climate.current}&deg;</span>
          <span className="dash-home-target">Set {climate.target}&deg; &middot; {climate.mode}</span>
        </div>
      )}
      <div className="dash-home-scenes">
        {scenes.map(s => (
          <button
            key={s.id}
            className={`dash-scene-btn ${active === s.id ? 'active' : ''}`}
            onClick={() => trigger(s)}
            title={s.label}
          >
            {s.icon}
          </button>
        ))}
      </div>
      <button className="dash-link-btn" style={{ marginTop: '8px' }} onClick={() => setView('home')}>
        All controls <span>&#8594;</span>
      </button>
    </div>
  )
}

// ── Widget wrapper — handles edit mode visuals ──
function WidgetCell({ editMode, children }) {
  return (
    <div className={`dash-cell ${editMode ? 'edit' : ''}`}>
      {editMode && (
        <div className="drag-handle">
          <span className="drag-dots">&#8942;&#8942;</span>
        </div>
      )}
      <div className="dash-cell-content">
        {children}
      </div>
    </div>
  )
}

export default function Dashboard({ setView, editMode }) {
  const [layout, setLayout]   = useState(DEFAULT_LAYOUT)
  const [widgets, setWidgets] = useState({
    clock:   { visible: true },
    weather: { visible: true },
    sports:  { visible: true },
    movein:  { visible: true },
    home:    { visible: true },
    links:   { visible: true },
    calendar: { visible: true },
  })
  const containerRef          = useRef(null)
  const [gridWidth, setGridWidth] = useState(window.innerWidth)

  useEffect(() => {
    getSetting('dashboard_layout').then(v => { if (v?.layout) setLayout(v.layout) })
    getSetting('dashboard').then(v => { if (v?.widgets) setWidgets(v.widgets) })
    const ch1 = subscribeSettings('dashboard_layout', v => { if (v?.layout) setLayout(v.layout) })
    const ch2 = subscribeSettings('dashboard', v => { if (v?.widgets) setWidgets(v.widgets) })
    return () => { ch1.unsubscribe(); ch2.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      setGridWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  async function onLayoutChange(newLayout) {
    if (!editMode) return
    setLayout(newLayout)
    await updateSetting('dashboard_layout', { layout: newLayout })
  }

  const show = key => widgets[key]?.visible !== false

  const WIDGETS = {
    clock:   <Clock />,
    weather: <Weather />,
    home:    <HomeWidget setView={setView} />,
    movein:  <Stats />,
    links:   <QuickLinks setView={setView} />,
    sports:  <div className="dash-widget"><SportsCarousel /></div>,
    calendar: <CalendarWidget />,
  }

  const visibleLayout = layout
    .filter(l => show(l.i))
    .map(l => ({ ...l, static: !editMode }))

  return (
    <div id="view-dashboard" className="view active">
      {editMode && (
        <div className="dash-edit-banner">
          Drag and resize widgets — click Lock when done
        </div>
      )}
      <div ref={containerRef}>
        <GridLayout
          layout={visibleLayout}
          cols={12}
          rowHeight={40}
          width={gridWidth}
          onLayoutChange={onLayoutChange}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".drag-handle"
          margin={[12, 12]}
          compactType="vertical"
        >
          {visibleLayout.map(l => (
            <div key={l.i}>
              <WidgetCell editMode={editMode}>
                {WIDGETS[l.i]}
              </WidgetCell>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  )
}