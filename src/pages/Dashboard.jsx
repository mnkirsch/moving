import { useEffect, useState } from 'react'
import { useHub } from '../context/HubContext'
import SportsCarousel from '../components/SportsCarousel'

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=30.2672&longitude=-97.7431' +
  '&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature' +
  '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&temperature_unit=fahrenheit&windspeed_unit=mph' +
  '&timezone=America%2FChicago&forecast_days=5'

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

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch(WEATHER_URL)
        const data = await res.json()
        setWeather(data)
      } catch {
        setError(true)
      }
    }
    fetch_()
    const t = setInterval(fetch_, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  if (error) return <div className="dash-widget dash-weather"><p className="widget-error">Weather unavailable</p></div>
  if (!weather) return <div className="dash-widget dash-weather"><p className="widget-error">Loading...</p></div>

  const c   = weather.current
  const d   = weather.daily
  const now = weatherLabel(c.weathercode)

  return (
    <div className="dash-widget dash-weather">
      <div className="dash-stats-title">Austin, TX</div>
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

export default function Dashboard({ setView }) {
  return (
    <div id="view-dashboard" className="view active">
      <Clock />
      <Weather />
      <Stats />
      <QuickLinks setView={setView} />
      <div className="dash-widget">
        <SportsCarousel />
      </div>
    </div>
  )
}