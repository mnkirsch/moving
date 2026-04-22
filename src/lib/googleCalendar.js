const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES     = 'https://www.googleapis.com/auth/calendar.readonly'

let tokenClient = null
let accessToken = null

export function isSignedIn() {
  return !!accessToken
}

export function initGoogle() {
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src   = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope:     SCOPES,
        callback:  response => {
          if (response.access_token) {
            accessToken = response.access_token
          }
        },
      })
      resolve()
    }
    document.head.appendChild(script)
  })
}

export function signIn() {
  return new Promise(resolve => {
    tokenClient.callback = response => {
      if (response.access_token) {
        accessToken = response.access_token
        resolve(true)
      } else {
        resolve(false)
      }
    }
    tokenClient.requestAccessToken()
  })
}

export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken)
    accessToken = null
  }
}

export async function getTodaysEvents() {
  if (!accessToken) return []

  const now       = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay   = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${startOfDay.toISOString()}` +
      `&timeMax=${endOfDay.toISOString()}` +
      `&singleEvents=true` +
      `&orderBy=startTime` +
      `&maxResults=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    return (data.items || []).map(event => ({
      id:      event.id,
      title:   event.summary || 'Untitled',
      start:   event.start?.dateTime || event.start?.date,
      end:     event.end?.dateTime   || event.end?.date,
      allDay:  !event.start?.dateTime,
      color:   event.colorId,
    }))
  } catch {
    return []
  }
}

export function formatEventTime(start, allDay) {
  if (allDay) return 'All day'
  return new Date(start).toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  })
}