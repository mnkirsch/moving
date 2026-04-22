import { useState, useEffect } from 'react'
import {
  initGoogle, signIn, signOut,
  isSignedIn, getTodaysEvents, formatEventTime,
} from '../lib/googleCalendar'

export default function CalendarWidget() {
  const [events,  setEvents]  = useState([])
  const [signedIn, setSignedIn] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    initGoogle().then(() => {
      setReady(true)
      setLoading(false)
    })
  }, [])

  async function handleSignIn() {
    setLoading(true)
    const ok = await signIn()
    if (ok) {
      setSignedIn(true)
      const ev = await getTodaysEvents()
      setEvents(ev)
    }
    setLoading(false)
  }

  function handleSignOut() {
    signOut()
    setSignedIn(false)
    setEvents([])
  }

  async function refresh() {
    if (!isSignedIn()) return
    const ev = await getTodaysEvents()
    setEvents(ev)
  }

  useEffect(() => {
    if (!signedIn) return
    refresh()
    const t = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [signedIn])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <div className="dash-widget calendar-widget">
      <div className="calendar-header">
        <div>
          <div className="dash-stats-title">Calendar</div>
          <div className="calendar-date">{today}</div>
        </div>
        {signedIn && (
          <button className="calendar-signout" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </div>

      {!ready && (
        <div className="calendar-empty">Loading...</div>
      )}

      {ready && !signedIn && (
        <div className="calendar-signin-prompt">
          <p>Connect Google Calendar to see today's events</p>
          <button className="calendar-signin-btn" onClick={handleSignIn}>
            Sign in with Google
          </button>
        </div>
      )}

      {signedIn && loading && (
        <div className="calendar-empty">Loading events...</div>
      )}

      {signedIn && !loading && events.length === 0 && (
        <div className="calendar-empty">No events today</div>
      )}

      {signedIn && !loading && events.length > 0 && (
        <div className="calendar-events">
          {events.map(event => (
            <div className="calendar-event" key={event.id}>
              <div className="calendar-event-time">
                {formatEventTime(event.start, event.allDay)}
              </div>
              <div className="calendar-event-title">{event.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}