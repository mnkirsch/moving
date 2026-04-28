import { useState } from 'react'

// Mock data — replace with real Ring/HA calls when hardware is installed
const MOCK = {
  lastRing: new Date(Date.now() - 1000 * 60 * 23), // 23 minutes ago
  lastMotion: new Date(Date.now() - 1000 * 60 * 8), // 8 minutes ago
  status: 'online',
  batteryLevel: 84,
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - date) / 60000)
  if (mins < 1)    return 'Just now'
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function DoorbellWidget() {
  const [alert, setAlert] = useState(null)

  // Simulate a ring for testing
  function simulateRing() {
    setAlert('ring')
    setTimeout(() => setAlert(null), 4000)
  }

  function simulateMotion() {
    setAlert('motion')
    setTimeout(() => setAlert(null), 4000)
  }

  return (
    <div className="dash-widget doorbell-widget">
      <div className="doorbell-header">
        <div className="dash-stats-title">Front door</div>
        <div className={`doorbell-status ${MOCK.status}`}>
          <span className="doorbell-status-dot" />
          {MOCK.status}
        </div>
      </div>

      {/* Mock camera placeholder */}
      <div className="doorbell-camera">
        {alert === 'ring' && (
          <div className="doorbell-alert ring">
            🔔 Someone at the door
          </div>
        )}
        {alert === 'motion' && (
          <div className="doorbell-alert motion">
            👤 Motion detected
          </div>
        )}
        {!alert && (
          <div className="doorbell-placeholder">
            <span className="doorbell-cam-icon">📷</span>
            <span className="doorbell-cam-label">Live view</span>
            <span className="doorbell-cam-sub">Connect Ring to enable</span>
          </div>
        )}
      </div>

      {/* Last events */}
      <div className="doorbell-events">
        <div className="doorbell-event">
          <span className="doorbell-event-icon">🔔</span>
          <span className="doorbell-event-label">Last ring</span>
          <span className="doorbell-event-time">{timeAgo(MOCK.lastRing)}</span>
        </div>
        <div className="doorbell-event">
          <span className="doorbell-event-icon">👤</span>
          <span className="doorbell-event-label">Last motion</span>
          <span className="doorbell-event-time">{timeAgo(MOCK.lastMotion)}</span>
        </div>
        <div className="doorbell-event">
          <span className="doorbell-event-icon">🔋</span>
          <span className="doorbell-event-label">Battery</span>
          <span className="doorbell-event-time">{MOCK.batteryLevel}%</span>
        </div>
      </div>

      {/* Test buttons — remove when real Ring is connected */}
      <div className="doorbell-test-row">
        <button className="doorbell-test-btn" onClick={simulateRing}>Test ring</button>
        <button className="doorbell-test-btn" onClick={simulateMotion}>Test motion</button>
      </div>
    </div>
  )
}