import { useState, useEffect } from 'react'
import { getSetting, updateSetting, patchSetting } from '../lib/settings'

const LEAGUE_LABELS = {
  nfl: 'NFL', nba: 'NBA', nhl: 'NHL', mlb: 'MLB',
  epl: 'Premier League', league2: 'League Two', f1: 'Formula 1',
  cfb: 'College Football', cbb: 'College Basketball',
  wcbb: "Women's Basketball", cbase: 'College Baseball',
}

const WIDGET_LABELS = {
  clock:   'Clock & date',
  weather: 'Weather',
  sports:  'Sports carousel',
  movein:  'Move-in tracker',
  home:    'Home controls',
  links:   'Quick links',
}

// ── Section wrapper ──
function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {children}
    </div>
  )
}

// ── General settings ──
function GeneralSettings() {
  const [values, setValues] = useState({ names: { person1: 'Marc', person2: 'Shelby' }, location: { city: 'Austin, TX', lat: 30.2672, lon: -97.7431 } })
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    getSetting('general').then(v => { if (v) setValues(v) })
  }, [])

  async function save() {
    await updateSetting('general', values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="General">
      <div className="settings-row">
        <label className="settings-label">Person 1 name</label>
        <input
          className="settings-input"
          value={values.names.person1}
          onChange={e => setValues(v => ({ ...v, names: { ...v.names, person1: e.target.value } }))}
        />
      </div>
      <div className="settings-row">
        <label className="settings-label">Person 2 name</label>
        <input
          className="settings-input"
          value={values.names.person2}
          onChange={e => setValues(v => ({ ...v, names: { ...v.names, person2: e.target.value } }))}
        />
      </div>
      <div className="settings-row">
        <label className="settings-label">City</label>
        <input
          className="settings-input"
          value={values.location.city}
          onChange={e => setValues(v => ({ ...v, location: { ...v.location, city: e.target.value } }))}
        />
      </div>
      <div className="settings-row">
        <label className="settings-label">Latitude</label>
        <input
          className="settings-input"
          type="number"
          value={values.location.lat}
          onChange={e => setValues(v => ({ ...v, location: { ...v.location, lat: parseFloat(e.target.value) } }))}
        />
      </div>
      <div className="settings-row">
        <label className="settings-label">Longitude</label>
        <input
          className="settings-input"
          type="number"
          value={values.location.lon}
          onChange={e => setValues(v => ({ ...v, location: { ...v.location, lon: parseFloat(e.target.value) } }))}
        />
      </div>
      <button className={`settings-save ${saved ? 'saved' : ''}`} onClick={save}>
        {saved ? 'Saved!' : 'Save'}
      </button>
    </Section>
  )
}

// ── Dashboard widget visibility ──
function DashboardSettings() {
  const [widgets, setWidgets] = useState({})
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    getSetting('dashboard').then(v => { if (v?.widgets) setWidgets(v.widgets) })
  }, [])

  async function toggle(key) {
    const next = { ...widgets, [key]: { ...widgets[key], visible: !widgets[key]?.visible } }
    setWidgets(next)
    await updateSetting('dashboard', { widgets: next })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="Dashboard widgets">
      {Object.entries(WIDGET_LABELS).map(([key, label]) => (
        <div className="settings-row" key={key}>
          <label className="settings-label">{label}</label>
          <button
            className={`settings-toggle ${widgets[key]?.visible ? 'on' : ''}`}
            onClick={() => toggle(key)}
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>
      ))}
      {saved && <div className="settings-saved-inline">Saved!</div>}
    </Section>
  )
}

// ── Sports teams ──
function SportsSettings() {
  const [teams, setTeams] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSetting('sports').then(v => { if (v?.teams) setTeams(v.teams) })
  }, [])

  function updateTeams(league, value) {
    setTeams(t => ({ ...t, [league]: value.split(',').map(s => s.trim()).filter(Boolean) }))
  }

  async function save() {
    await patchSetting('sports', { teams })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="Sports teams">
      <p className="settings-hint">Comma-separated team names per league.</p>
      {Object.entries(LEAGUE_LABELS).map(([key, label]) => (
        <div className="settings-row" key={key}>
          <label className="settings-label">{label}</label>
          <input
            className="settings-input"
            value={(teams[key] || []).join(', ')}
            onChange={e => updateTeams(key, e.target.value)}
            placeholder="No filter — shows all"
          />
        </div>
      ))}
      <button className={`settings-save ${saved ? 'saved' : ''}`} onClick={save}>
        {saved ? 'Saved!' : 'Save teams'}
      </button>
    </Section>
  )
}

// ── Home Assistant ──
function HASettings() {
  const [values, setValues] = useState({ url: '', token: '' })
  const [saved,  setSaved]  = useState(false)
  const [tested, setTested] = useState(null)

  useEffect(() => {
    getSetting('ha').then(v => { if (v) setValues(v) })
  }, [])

  async function save() {
    await updateSetting('ha', values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function test() {
    setTested(null)
    try {
      const res = await fetch(`${values.url}/api/`, {
        headers: { Authorization: `Bearer ${values.token}` }
      })
      setTested(res.ok ? 'success' : 'fail')
    } catch {
      setTested('fail')
    }
  }

  return (
    <Section title="Home Assistant">
      <p className="settings-hint">
        Find your token in HA under Profile → Long-lived access tokens.
        URL should be your local IP, e.g. http://192.168.1.x:8123
      </p>
      <div className="settings-row">
        <label className="settings-label">HA URL</label>
        <input
          className="settings-input"
          value={values.url}
          onChange={e => setValues(v => ({ ...v, url: e.target.value }))}
          placeholder="http://192.168.1.x:8123"
        />
      </div>
      <div className="settings-row">
        <label className="settings-label">Access token</label>
        <input
          className="settings-input"
          type="password"
          value={values.token}
          onChange={e => setValues(v => ({ ...v, token: e.target.value }))}
          placeholder="Long-lived access token"
        />
      </div>
      <div className="settings-actions">
        <button className="settings-test" onClick={test}>Test connection</button>
        <button className={`settings-save ${saved ? 'saved' : ''}`} onClick={save}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
      {tested === 'success' && <div className="settings-status success">Connected successfully</div>}
      {tested === 'fail'    && <div className="settings-status fail">Connection failed — check URL and token</div>}
    </Section>
  )
}

// ── Main page ──
export default function Settings() {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-grid">
        <GeneralSettings />
        <DashboardSettings />
        <SportsSettings />
        <HASettings />
      </div>
    </div>
  )
}
