// ─────────────────────────────────────────
// Home Assistant API
// Set VITE_HA_URL and VITE_HA_TOKEN in .env
// when HA is running. Until then, mock data
// is returned automatically.
// ─────────────────────────────────────────

const HA_URL   = import.meta.env.VITE_HA_URL
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN
const READY    = !!(HA_URL && HA_TOKEN)

// ── Mock state ──
const MOCK_STATE = {
  climate: {
    current:  72,
    target:   70,
    mode:     'cool',
    humidity: 45,
  },
  rooms: [
    {
      id:      'living_room',
      label:   'Living Room',
      lights: [
        { id: 'light.living_room_main',  label: 'Main',    on: true,  brightness: 80 },
        { id: 'light.living_room_lamp',  label: 'Lamp',    on: false, brightness: 60 },
      ],
      plugs: [
        { id: 'switch.tv_plug',          label: 'TV',      on: true  },
      ],
    },
    {
      id:      'dining_kitchen',
      label:   'Dining / Kitchen',
      lights: [
        { id: 'light.dining_main',       label: 'Dining',  on: true,  brightness: 100 },
        { id: 'light.kitchen_main',      label: 'Kitchen', on: true,  brightness: 90  },
        { id: 'light.kitchen_under',     label: 'Under cabinet', on: false, brightness: 50 },
      ],
      plugs: [],
    },
    {
      id:      'primary_bedroom',
      label:   'Primary Bedroom',
      lights: [
        { id: 'light.bedroom_main',      label: 'Main',    on: false, brightness: 50 },
        { id: 'light.bedroom_lamp_left', label: 'Left lamp', on: false, brightness: 30 },
        { id: 'light.bedroom_lamp_right',label: 'Right lamp', on: false, brightness: 30 },
      ],
      plugs: [],
    },
    {
      id:      'guest_bedroom',
      label:   'Guest Bedroom',
      lights: [
        { id: 'light.guest_main',        label: 'Main',    on: false, brightness: 50 },
      ],
      plugs: [],
    },
    {
      id:      'garage',
      label:   'Garage',
      lights: [
        { id: 'light.garage_main',       label: 'Main',    on: false, brightness: 100 },
      ],
      plugs: [
        { id: 'switch.garage_door',      label: 'Garage door', on: false },
      ],
    },
    {
      id:      'backyard',
      label:   'Backyard',
      lights: [
        { id: 'light.backyard_main',     label: 'Patio',   on: false, brightness: 100 },
      ],
      plugs: [],
    },
  ],
  scenes: [
    { id: 'scene.good_morning', label: 'Good Morning', icon: '🌅' },
    { id: 'scene.good_night',   label: 'Good Night',   icon: '🌙' },
    { id: 'scene.movie',        label: 'Movie Mode',   icon: '🎬' },
    { id: 'scene.dinner',       label: 'Dinner',       icon: '🍽️' },
    { id: 'scene.away',         label: 'Away',         icon: '🔒' },
  ],
}

// ── API helpers ──
async function haGet(path) {
  const res = await fetch(`${HA_URL}/api/${path}`, {
    headers: { Authorization: `Bearer ${HA_TOKEN}` }
  })
  return res.json()
}

async function haPost(path, body) {
  const res = await fetch(`${HA_URL}/api/${path}`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ── Public API ──
export function isReady() { return READY }

export function getRooms()  { return MOCK_STATE.rooms }
export function getScenes() { return MOCK_STATE.scenes }

export async function getClimate() {
  if (!READY) return MOCK_STATE.climate
  try {
    const state = await haGet('states/climate.ecobee')
    return {
      current:  parseFloat(state.attributes.current_temperature),
      target:   parseFloat(state.attributes.temperature),
      mode:     state.state,
      humidity: parseFloat(state.attributes.current_humidity),
    }
  } catch { return MOCK_STATE.climate }
}

export async function setClimateTemp(temp) {
  if (!READY) return
  await haPost('services/climate/set_temperature', {
    entity_id:   'climate.ecobee',
    temperature: temp,
  })
}

export async function setClimateMode(mode) {
  if (!READY) return
  await haPost('services/climate/set_hvac_mode', {
    entity_id: 'climate.ecobee',
    hvac_mode: mode,
  })
}

export async function toggleLight(entityId, on, brightness) {
  if (!READY) return
  const service = on ? 'turn_on' : 'turn_off'
  const body    = { entity_id: entityId }
  if (on && brightness !== undefined) body.brightness_pct = brightness
  await haPost(`services/light/${service}`, body)
}

export async function setBrightness(entityId, brightness) {
  if (!READY) return
  await haPost('services/light/turn_on', {
    entity_id:      entityId,
    brightness_pct: brightness,
  })
}

export async function togglePlug(entityId, on) {
  if (!READY) return
  await haPost(`services/switch/${on ? 'turn_on' : 'turn_off'}`, {
    entity_id: entityId,
  })
}

export async function triggerScene(sceneId) {
  if (!READY) return
  await haPost('services/scene/turn_on', {
    entity_id: sceneId,
  })
}
