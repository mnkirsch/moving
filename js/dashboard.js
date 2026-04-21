// ─────────────────────────────────────────
// Dashboard view
// Austin, TX — lat 30.2672, lon -97.7431
// ─────────────────────────────────────────

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=30.2672&longitude=-97.7431' +
  '&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature' +
  '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&temperature_unit=fahrenheit&windspeed_unit=mph' +
  '&timezone=America%2FChicago&forecast_days=5';

// WMO weather code → label + emoji
function weatherLabel(code) {
  if (code === 0)               return { label: 'Clear',         icon: '☀️' };
  if (code <= 2)                return { label: 'Partly cloudy', icon: '⛅' };
  if (code === 3)               return { label: 'Overcast',      icon: '☁️' };
  if (code <= 49)               return { label: 'Foggy',         icon: '🌫️' };
  if (code <= 59)               return { label: 'Drizzle',       icon: '🌦️' };
  if (code <= 69)               return { label: 'Rain',          icon: '🌧️' };
  if (code <= 79)               return { label: 'Snow',          icon: '❄️' };
  if (code <= 82)               return { label: 'Showers',       icon: '🌧️' };
  if (code <= 84)               return { label: 'Snow showers',  icon: '🌨️' };
  if (code <= 99)               return { label: 'Thunderstorm',  icon: '⛈️' };
  return { label: 'Unknown', icon: '🌡️' };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Clock ──
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const clockEl = document.getElementById('dash-time');
  const dateEl  = document.getElementById('dash-date');
  if (clockEl) clockEl.textContent = time;
  if (dateEl)  dateEl.textContent  = date;
}

// ── Weather ──
async function fetchWeather() {
  try {
    const res  = await fetch(WEATHER_URL);
    const data = await res.json();
    renderWeather(data);
  } catch {
    const el = document.getElementById('weather-widget');
    if (el) el.innerHTML = '<p class="widget-error">Weather unavailable</p>';
  }
}

function renderWeather(data) {
  const c   = data.current;
  const d   = data.daily;
  const now = weatherLabel(c.weathercode);

  const currentEl = document.getElementById('weather-current');
  if (currentEl) {
    currentEl.innerHTML = `
      <div class="weather-icon">${now.icon}</div>
      <div class="weather-temp">${Math.round(c.temperature_2m)}°</div>
      <div class="weather-meta">
        <span class="weather-label">${now.label}</span>
        <span class="weather-feels">Feels ${Math.round(c.apparent_temperature)}°</span>
        <span class="weather-detail">${c.relativehumidity_2m}% humidity · ${Math.round(c.windspeed_10m)} mph</span>
      </div>`;
  }

  const forecastEl = document.getElementById('weather-forecast');
  if (forecastEl) {
    forecastEl.innerHTML = d.time.map((dateStr, i) => {
      const day  = i === 0 ? 'Today' : DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];
      const w    = weatherLabel(d.weathercode[i]);
      const pop  = d.precipitation_probability_max[i];
      return `
        <div class="forecast-day">
          <span class="forecast-name">${day}</span>
          <span class="forecast-icon">${w.icon}</span>
          <span class="forecast-range">${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°</span>
          ${pop > 20 ? `<span class="forecast-pop">💧${pop}%</span>` : '<span class="forecast-pop"></span>'}
        </div>`;
    }).join('');
  }
}

// ── Quick stats from Supabase state ──
function renderDashStats() {
  const need    = items.filter(i => i.status === 'Need to Buy').length;
  const tbd     = items.filter(i => !i.status).length;
  const spent   = purchases.reduce((a, b) => a + parseFloat(b.price), 0);
  const marc    = purchases.filter(p => p.who === 'Marc').reduce((a, b) => a + parseFloat(b.price), 0);
  const shelby  = purchases.filter(p => p.who === 'Shelby').reduce((a, b) => a + parseFloat(b.price), 0);
  const diff    = Math.abs(marc - shelby);
  const owes    = marc < shelby ? `Marc owes Shelby $${diff.toFixed(0)}` : shelby < marc ? `Shelby owes Marc $${diff.toFixed(0)}` : "All even!";

  const el = document.getElementById('dash-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="dash-stat">
      <div class="dash-stat-num">${need}</div>
      <div class="dash-stat-lbl">Still to buy</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-num">${tbd}</div>
      <div class="dash-stat-lbl">TBD</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-num">$${Math.round(spent).toLocaleString()}</div>
      <div class="dash-stat-lbl">Spent so far</div>
    </div>
    <div class="dash-stat dash-stat-balance">
      <div class="dash-stat-num dash-stat-balance-label">${owes}</div>
      <div class="dash-stat-lbl">Balance</div>
    </div>`;
}

// ── Init dashboard ──
function initDashboard() {
  updateClock();
  setInterval(updateClock, 10000);
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
}
