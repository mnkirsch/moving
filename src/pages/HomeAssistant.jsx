import { useState, useEffect } from 'react'
import {
  isReady, getRooms, getScenes, getClimate,
  setClimateTemp, setClimateMode,
  toggleLight, setBrightness, togglePlug,
  triggerScene,
} from '../lib/ha'

// ── Thermostat ──
function Thermostat() {
  const [climate, setClimate] = useState(null)

  useEffect(() => {
    async function load() {
      const data = await getClimate()
      setClimate(data)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  async function adjustTemp(delta) {
    const next = { ...climate, target: climate.target + delta }
    setClimate(next)
    await setClimateTemp(next.target)
  }

  async function changeMode(mode) {
    setClimate(c => ({ ...c, mode }))
    await setClimateMode(mode)
  }

  if (!climate) return <div className="ha-card"><div className="ha-loading">Loading...</div></div>

  const modes = ['heat', 'cool', 'auto', 'off']

  return (
    <div className="ha-card ha-thermostat">
      <div className="ha-card-header">
        <span className="ha-card-title">Thermostat</span>
        {!isReady() && <span className="ha-mock-badge">Mock</span>}
      </div>
      <div className="ha-thermo-body">
        <div className="ha-thermo-current">
          <span className="ha-thermo-current-num">{climate.current}&deg;</span>
          <span className="ha-thermo-current-lbl">Current</span>
        </div>
        <div className="ha-thermo-target">
          <button className="ha-thermo-btn" onClick={() => adjustTemp(1)}>+</button>
          <div className="ha-thermo-target-num">{climate.target}&deg;</div>
          <button className="ha-thermo-btn" onClick={() => adjustTemp(-1)}>−</button>
        </div>
        <div className="ha-thermo-meta">
          <span>{climate.humidity}% humidity</span>
        </div>
      </div>
      <div className="ha-thermo-modes">
        {modes.map(m => (
          <button
            key={m}
            className={`ha-mode-btn ${climate.mode === m ? 'active' : ''}`}
            onClick={() => changeMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Scenes ──
function Scenes() {
  const [active, setActive] = useState(null)
  const scenes = getScenes()

  async function trigger(scene) {
    setActive(scene.id)
    await triggerScene(scene.id)
    setTimeout(() => setActive(null), 3000)
  }

  return (
    <div className="ha-card">
      <div className="ha-card-header">
        <span className="ha-card-title">Scenes</span>
      </div>
      <div className="ha-scenes">
        {scenes.map(s => (
          <button
            key={s.id}
            className={`ha-scene-btn ${active === s.id ? 'active' : ''}`}
            onClick={() => trigger(s)}
          >
            <span className="ha-scene-icon">{s.icon}</span>
            <span className="ha-scene-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Light control ──
function LightControl({ light, onToggle, onBrightness }) {
  return (
    <div className={`ha-device ${light.on ? 'on' : ''}`}>
      <div className="ha-device-row">
        <span className="ha-device-label">{light.label}</span>
        <button
          className={`ha-toggle ${light.on ? 'on' : ''}`}
          onClick={() => onToggle(light.id, !light.on, light.brightness)}
        >
          <span className="ha-toggle-thumb" />
        </button>
      </div>
      {light.on && (
        <input
          type="range"
          min="1"
          max="100"
          value={light.brightness}
          className="ha-brightness"
          onChange={e => onBrightness(light.id, parseInt(e.target.value))}
        />
      )}
    </div>
  )
}

// ── Plug control ──
function PlugControl({ plug, onToggle }) {
  return (
    <div className={`ha-device ${plug.on ? 'on' : ''}`}>
      <div className="ha-device-row">
        <span className="ha-device-label">{plug.label}</span>
        <button
          className={`ha-toggle ${plug.on ? 'on' : ''}`}
          onClick={() => onToggle(plug.id, !plug.on)}
        >
          <span className="ha-toggle-thumb" />
        </button>
      </div>
    </div>
  )
}

// ── Room card ──
function RoomCard({ room }) {
  const [lights, setLights] = useState(room.lights)
  const [plugs,  setPlugs]  = useState(room.plugs)

  const allOn    = lights.every(l => l.on)
  const anyOn    = lights.some(l => l.on)

  async function handleToggleLight(id, on, brightness) {
    setLights(ls => ls.map(l => l.id === id ? { ...l, on } : l))
    await toggleLight(id, on, brightness)
  }

  async function handleBrightness(id, brightness) {
    setLights(ls => ls.map(l => l.id === id ? { ...l, brightness } : l))
    await setBrightness(id, brightness)
  }

  async function handleTogglePlug(id, on) {
    setPlugs(ps => ps.map(p => p.id === id ? { ...p, on } : p))
    await togglePlug(id, on)
  }

  async function toggleAll() {
    const next = !anyOn
    setLights(ls => ls.map(l => ({ ...l, on: next })))
    await Promise.all(lights.map(l => toggleLight(l.id, next, l.brightness)))
  }

  return (
    <div className="ha-card">
      <div className="ha-card-header">
        <span className="ha-card-title">{room.label}</span>
        <button
          className={`ha-all-toggle ${anyOn ? 'on' : ''}`}
          onClick={toggleAll}
        >
          {anyOn ? 'All off' : 'All on'}
        </button>
      </div>

      {lights.length > 0 && (
        <div className="ha-device-group">
          <div className="ha-device-group-label">Lights</div>
          {lights.map(l => (
            <LightControl
              key={l.id}
              light={l}
              onToggle={handleToggleLight}
              onBrightness={handleBrightness}
            />
          ))}
        </div>
      )}

      {plugs.length > 0 && (
        <div className="ha-device-group">
          <div className="ha-device-group-label">Plugs</div>
          {plugs.map(p => (
            <PlugControl
              key={p.id}
              plug={p}
              onToggle={handleTogglePlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ──
export default function HomeAssistant() {
  const rooms = getRooms()

  return (
    <div className="ha-page">
      <div className="ha-page-header">
        <h2>Home</h2>
        {!isReady() && (
          <div className="ha-offline-banner">
            Running on mock data — add HA credentials to .env to go live
          </div>
        )}
      </div>

      <div className="ha-top-row">
        <Thermostat />
        <Scenes />
      </div>

      <div className="ha-rooms-grid">
        {rooms.map(room => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  )
}
