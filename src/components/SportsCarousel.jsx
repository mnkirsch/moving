import { useState, useEffect } from 'react'
import { fetchLeague, LEAGUES } from '../lib/sports'

const LEAGUE_LABELS = {
  nfl: 'NFL', nba: 'NBA', nhl: 'NHL', mlb: 'MLB',
  epl: 'Premier League', league2: 'League Two', f1: 'Formula 1',
  cfb: 'College Football', cbb: 'College Basketball',
  wcbb: "Women's Basketball", cbase: 'College Baseball',
}

export default function SportsCarousel() {
  const [cards, setCards]     = useState([])
  const [index, setIndex]     = useState(0)
  const [loading, setLoading] = useState(true)
  // Add these inside the SportsCarousel component, after the existing state declarations:
const [touchStart, setTouchStart] = useState(null)
const [touchEnd, setTouchEnd]     = useState(null)

const minSwipeDistance = 50

function onTouchStart(e) {
  setTouchStart(e.targetTouches[0].clientX)
  setTouchEnd(null)
}

function onTouchMove(e) {
  setTouchEnd(e.targetTouches[0].clientX)
}

function onTouchEnd() {
  if (!touchStart || !touchEnd) return
  const distance = touchStart - touchEnd
  if (Math.abs(distance) >= minSwipeDistance) {
    distance > 0 ? next() : prev()
  }
}

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        Object.keys(LEAGUES).map(async key => {
          try {
            const { games, status } = await fetchLeague(key)
            return games.map(g => ({ ...g, league: key, status }))
          } catch {
            return []
          }
        })
      )
      const allCards = results.flat().filter(g => g.home && g.away)
      setCards(allCards)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-advance — always called, cards.length check inside
  useEffect(() => {
    if (cards.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % cards.length), 8000)
    return () => clearInterval(t)
  }, [cards.length])

  const card   = cards[index] || null
  const isLive = card?.state === 'in'
  const isDone = card?.state === 'post'

  function prev() { setIndex(i => (i - 1 + cards.length) % cards.length) }
  function next() { setIndex(i => (i + 1) % cards.length) }

  if (loading) return (
    <div className="sports-carousel">
      <div className="carousel-label">Sports</div>
      <div className="carousel-loading">Loading...</div>
    </div>
  )

  if (!card) return (
    <div className="sports-carousel">
      <div className="carousel-label">Sports</div>
      <div className="carousel-empty">No upcoming games</div>
    </div>
  )

  return (
    <div className="sports-carousel">
      <div className="carousel-header">
        <span className="carousel-label">{LEAGUE_LABELS[card.league]}</span>
        <span className={`carousel-status ${isLive ? 'live' : ''}`}>
          {isLive && <span className="live-dot" />}
          {card.detail}
        </span>
      </div>

      <div
        className="carousel-game"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        >
        <div className={`carousel-team ${isDone && card.away?.winner ? 'winner' : ''}`}>
          {card.away?.logo && <img src={card.away.logo} alt="" className="carousel-logo" />}
          <span className="carousel-team-name">{card.away?.name}</span>
          {(isLive || isDone) && <span className="carousel-score">{card.away?.score}</span>}
        </div>
        <div className="carousel-vs">vs</div>
        <div className={`carousel-team ${isDone && card.home?.winner ? 'winner' : ''}`}>
          {card.home?.logo && <img src={card.home.logo} alt="" className="carousel-logo" />}
          <span className="carousel-team-name">{card.home?.name}</span>
          {(isLive || isDone) && <span className="carousel-score">{card.home?.score}</span>}
        </div>
      </div>

      <div className="carousel-footer">
        <button className="carousel-nav" onClick={prev}>&#8592;</button>
        <div className="carousel-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button className="carousel-nav" onClick={next}>&#8594;</button>
      </div>
    </div>
  )
}