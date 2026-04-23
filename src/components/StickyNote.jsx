import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSetting } from '../lib/settings'

export default function StickyNote() {
  const [notes,   setNotes]   = useState([])
  const [message, setMessage] = useState('')
  const [author,  setAuthor]  = useState('Marc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load author name from settings
    getSetting('general').then(v => {
      if (v?.names?.person1) setAuthor(v.names.person1)
    })

    // Load recent notes
    async function load() {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setNotes(data)
      setLoading(false)
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel('notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function sendNote() {
    const msg = message.trim()
    if (!msg) return
    await supabase.from('notes').insert({ message: msg, author })
    setMessage('')
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendNote()
    }
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1)  return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="dash-widget sticky-note-widget">
      <div className="dash-stats-title">Notes</div>

      <div className="sticky-notes-list">
        {loading && <div className="sticky-empty">Loading...</div>}
        {!loading && notes.length === 0 && (
          <div className="sticky-empty">No notes yet</div>
        )}
        {notes.map(note => (
          <div key={note.id} className="sticky-note">
            <div className="sticky-note-message">{note.message}</div>
            <div className="sticky-note-meta">
              <span className="sticky-note-author">{note.author}</span>
              <span className="sticky-note-time">{formatTime(note.created_at)}</span>
              <button className="sticky-delete" onClick={() => deleteNote(note.id)}>×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky-input-row">
        <select
          className="sticky-author-select"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        >
          <option value="Marc">Marc</option>
          <option value="Shelby">Shelby</option>
        </select>
        <input
          className="sticky-input"
          placeholder="Leave a note..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="sticky-send" onClick={sendNote}>→</button>
      </div>
    </div>
  )
}