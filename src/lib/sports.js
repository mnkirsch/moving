import { getSetting } from './settings'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports'

export const LEAGUES = {
  nfl:     { url: `${ESPN}/football/nfl/scoreboard`,                         teams: ['Giants'],                                        soccer: false },
  nba:     { url: `${ESPN}/basketball/nba/scoreboard`,                       teams: ['Celtics'],                                       soccer: false },
  nhl:     { url: `${ESPN}/hockey/nhl/scoreboard`,                           teams: ['Bruins', 'Stars'],                               soccer: false },
  mlb:     { url: `${ESPN}/baseball/mlb/scoreboard`,                         teams: ['Red Sox'],                                       soccer: false },
  epl:     { url: `${ESPN}/soccer/eng.1/scoreboard`,                         teams: ['Manchester United', 'Man United', 'Aston Villa'], soccer: true  },
  league2: { url: `${ESPN}/soccer/eng.4/scoreboard`,                         teams: ['Notts County'],                                  soccer: true  },
  f1:      { url: `${ESPN}/racing/f1/scoreboard`,                            teams: null,                                              soccer: false },
  cfb:     { url: `${ESPN}/football/college-football/scoreboard`,            teams: ['Indiana', 'Texas'],                              soccer: false },
  cbb:     { url: `${ESPN}/basketball/mens-college-basketball/scoreboard`,    teams: ['Indiana', 'Texas'],                              soccer: false },
  wcbb:    { url: `${ESPN}/basketball/womens-college-basketball/scoreboard`,  teams: ['Texas Longhorns'],                               soccer: false },
  cbase:   { url: `${ESPN}/baseball/college-baseball/scoreboard`,            teams: ['Texas Longhorns'],                               soccer: false },
}

function teamMatches(name, teamList) {
  if (!teamList) return true
  return teamList.some(t => name.toLowerCase().includes(t.toLowerCase()))
}

function parseEvent(event) {
  const comp        = event.competitions?.[0]
  const competitors = comp?.competitors || []
  const home        = competitors.find(c => c.homeAway === 'home')
  const away        = competitors.find(c => c.homeAway === 'away')
  const status      = comp?.status?.type
  return {
    id:        event.id,
    name:      event.name,
    shortName: event.shortName,
    date:      event.date,
    state:     status?.state,
    detail:    status?.shortDetail,
    home: home ? { name: home.team.shortDisplayName, logo: home.team.logo, score: home.score, winner: home.winner } : null,
    away: away ? { name: away.team.shortDisplayName, logo: away.team.logo, score: away.score, winner: away.winner } : null,
  }
}

function fmt(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${dd}`
}

function futureDateRange(daysAhead) {
  const start = new Date()
  const end   = new Date()
  end.setDate(end.getDate() + daysAhead)
  return `${fmt(start)}-${fmt(end)}`
}

async function fetchEvents(url, dateParam) {
  const sep     = url.includes('?') ? '&' : '?'
  const fullUrl = dateParam ? `${url}${sep}dates=${dateParam}&limit=100` : `${url}?limit=100`
  const res     = await fetch(fullUrl)
  const data    = await res.json()
  return data.events || []
}

function filterToMyTeams(events, teams) {
  if (!teams) return events
  return events.filter(e =>
    (e.competitions?.[0]?.competitors || []).some(c =>
      teamMatches(c.team.displayName, teams)
    )
  )
}

function getNextGamePerTeam(events, teams) {
  const cutoff   = new Date()
  cutoff.setHours(0, 0, 0, 0)
  const upcoming = events.filter(e => new Date(e.date) >= cutoff)
  const seen     = new Set()
  const result   = []

  for (const team of teams) {
    const next = upcoming
      .filter(e =>
        (e.competitions?.[0]?.competitors || []).some(c =>
          c.team.displayName.toLowerCase().includes(team.toLowerCase())
        )
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

    if (next && !seen.has(next.id)) {
      seen.add(next.id)
      result.push(next)
    }
  }

  return result
}

export async function fetchLeague(key) {
  const base = LEAGUES[key]

  // Try to load teams from settings, fall back to hardcoded defaults
  let teams = base.teams
  try {
    const sportSettings = await getSetting('sports')
    if (sportSettings?.teams?.[key] && sportSettings.teams[key].length > 0) {
      teams = sportSettings.teams[key]
    }
  } catch { /* use defaults */ }

  const league = { ...base, teams }

  try {
    const todayEvents  = await fetchEvents(league.url)
    const myGamesToday = filterToMyTeams(todayEvents, league.teams)

    if (myGamesToday.length > 0) {
      return { games: myGamesToday.map(parseEvent), status: 'today' }
    }

    const lookahead    = league.soccer ? 45 : 14
    const futureEvents = await fetchEvents(league.url, futureDateRange(lookahead))
    const myFuture     = filterToMyTeams(futureEvents, league.teams)

    if (myFuture.length > 0) {
      const nextGames = league.teams
        ? getNextGamePerTeam(myFuture, league.teams)
        : myFuture.filter(e => new Date(e.date) >= new Date()).slice(0, 3)

      if (nextGames.length > 0) {
        return { games: nextGames.map(parseEvent), status: 'upcoming' }
      }
    }

    return { games: [], status: 'none' }

  } catch (e) {
    console.error(`fetchLeague error for ${key}:`, e)
    return { games: [], status: 'error' }
  }
}