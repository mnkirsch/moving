import { useState, useEffect, useCallback } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { fetchLeague } from '../lib/sports'

const DEFAULT_LAYOUT = [
  { i: 'nfl',     x: 0, y: 0,  w: 3, h: 3 },
  { i: 'nba',     x: 3, y: 0,  w: 3, h: 3 },
  { i: 'nhl',     x: 6, y: 0,  w: 3, h: 3 },
  { i: 'mlb',     x: 9, y: 0,  w: 3, h: 3 },
  { i: 'epl',     x: 0, y: 7,  w: 3, h: 3 },
  { i: 'league2', x: 3, y: 7,  w: 3, h: 3 },
  { i: 'f1',      x: 6, y: 7,  w: 3, h: 3 },
  { i: 'cfb',     x: 9, y: 7,  w: 3, h: 3 },
  { i: 'cbb',     x: 0, y: 14, w: 3, h: 3 },
  { i: 'wcbb',    x: 3, y: 14, w: 3, h: 3 },
  { i: 'cbase',   x: 6, y: 14, w: 3, h: 3 },
]

const LEAGUE_LABELS = {
  nfl:     'NFL',
  nba:     'NBA',
  nhl:     'NHL',
  mlb:     'MLB',
  epl:     'Premier League',
  league2: 'League Two',
  f1:      'Formula 1',
  cfb:     'College Football',
  cbb:     'College Basketball',
  wcbb:    "Women's Basketball",
  cbase:   'College Baseball',
}

function GameRow({ game }) {
  const isLive = game.state === 'in'
  const isDone = game.state === 'post'

  return (
    <div className="sport-game">
      <div className="sport-game-teams">
        {game.away && (
          <div className={`sport-team ${isDone && game.away.winner ? 'winner' : ''}`}>
            {game.away.logo && <img src={game.away.logo} alt="" className="sport-logo" />}
            <span className="sport-team-name">{game.away.name}</span>
            {(isLive || isDone) && <span className="sport-score">{game.away.score}</span>}
          </div>
        )}
        {game.home && (
          <div className={`sport-team ${isDone && game.home.winner ? 'winner' : ''}`}>
            {game.home.logo && <img src={game.home.logo} alt="" className="sport-logo" />}
            <span className="sport-team-name">{game.home.name}</span>
            {(isLive || isDone) && <span className="sport-score">{game.home.score}</span>}
          </div>
        )}
      </div>
      <div className={`sport-game-status ${isLive ? 'live' : ''}`}>
        {isLive && <span className="live-dot" />}
        {game.detail}
      </div>
    </div>
  )
}

function SportWidget({ leagueKey, onHide }) {
  const [result, setResult] = useState({ games: [], status: 'loading' })

  const load = useCallback(async () => {
    const data = await fetchLeague(leagueKey)
    setResult(data)
  }, [leagueKey])

  useEffect(() => {
    load()
    const t = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [load])

  const { games, status } = result

  function bodyContent() {
    if (status === 'loading') return <div className="sport-loading">Loading...</div>
    if (status === 'error')   return <div className="sport-empty">Unavailable</div>
    if (status === 'none')    return <div className="sport-empty">Off-season</div>
    if (games.length === 0)   return <div className="sport-empty">No games today</div>
    return (
      <>
        {status === 'upcoming' && (
          <div className="sport-next-label">Next game</div>
        )}
        {games.map(g => <GameRow key={g.id} game={g} />)}
      </>
    )
  }

  return (
    <div className="sport-widget">
      <div className="sport-widget-header">
        <span className="sport-widget-label">{LEAGUE_LABELS[leagueKey]}</span>
        <div className="sport-widget-actions">
          <button className="sport-refresh" onClick={load} title="Refresh">↻</button>
          <button className="sport-hide" onClick={() => onHide(leagueKey)} title="Hide">✕</button>
        </div>
      </div>
      <div className="sport-widget-body">
        {bodyContent()}
      </div>
    </div>
  )
}

export default function SportsDashboard() {
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('sports-layout')
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
  })

  const [hidden, setHidden] = useState(() => {
    const saved = localStorage.getItem('sports-hidden')
    return saved ? JSON.parse(saved) : []
  })

  function onLayoutChange(newLayout) {
    setLayout(newLayout)
    localStorage.setItem('sports-layout', JSON.stringify(newLayout))
  }

  function hideLeague(key) {
    const next = [...hidden, key]
    setHidden(next)
    localStorage.setItem('sports-hidden', JSON.stringify(next))
  }

  function showLeague(key) {
    const next = hidden.filter(k => k !== key)
    setHidden(next)
    localStorage.setItem('sports-hidden', JSON.stringify(next))
  }

  const visibleKeys = Object.keys(LEAGUE_LABELS).filter(k => !hidden.includes(k))
  const visibleLayout = layout.filter(l => visibleKeys.includes(l.i))

  return (
    <div className="sports-dashboard">
      <div className="sports-header">
        <h2>Sports</h2>
        <div className="sports-header-actions">
          {hidden.length > 0 && (
            <div className="hidden-leagues">
              {hidden.map(key => (
                <button key={key} className="btn-show-league" onClick={() => showLeague(key)}>
                  + {LEAGUE_LABELS[key]}
                </button>
              ))}
            </div>
          )}
          <button
            className="btn-reset-layout"
            onClick={() => {
              setLayout(DEFAULT_LAYOUT)
              setHidden([])
              localStorage.removeItem('sports-layout')
              localStorage.removeItem('sports-hidden')
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <GridLayout
        layout={visibleLayout}
        cols={12}
        rowHeight={30}
        width={window.innerWidth - 64}
        onLayoutChange={onLayoutChange}
        draggableHandle=".sport-widget-header"
        margin={[10, 10]}
        compactType="vertical"
      >
        {visibleKeys.map(key => (
          <div key={key} style={{ overflow: 'hidden' }}>
            <SportWidget leagueKey={key} onHide={hideLeague} />
          </div>
        ))}
      </GridLayout>
    </div>
  )
}