import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [currentView, setCurrentView] = useState('songs')
  const [selectedSongId, setSelectedSongId] = useState(null)
  const [editingSong, setEditingSong] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    const savedSongs = localStorage.getItem('songs')
    const savedPlaylists = localStorage.getItem('playlists')
    if (savedSongs) setSongs(JSON.parse(savedSongs))
    if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists))
  }, [])

  useEffect(() => {
    localStorage.setItem('songs', JSON.stringify(songs))
  }, [songs])

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists))
  }, [playlists])

  const addSong = (song) => {
    setSongs([...songs, { ...song, id: Date.now() }])
  }

  const deleteSong = (id) => {
    setSongs(songs.filter(s => s.id !== id))
    setPlaylists(playlists.map(p => ({ ...p, songs: p.songs.filter(sid => sid !== id) })))
  }

  const [deleteTarget, setDeleteTarget] = useState(null)

  // requestDeleteSong accepts either (song) coming from songs view
  // or (song, { source: 'playlist', playlistName }) coming from PlaylistView
  const requestDeleteSong = (song, options = {}) => {
    setDeleteTarget({ song, source: options.source || 'songs', playlistName: options.playlistName || null })
  }

  const requestDeletePlaylist = (playlistName) => {
    const pl = playlists.find(p => p.name === playlistName)
    if (!pl) return
    setDeleteTarget({ kind: 'playlist', playlistName, songIds: [...pl.songs] })
  }

  const cancelDelete = () => setDeleteTarget(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'playlist' && deleteTarget.playlistName) {
      const idsToRemove = new Set(deleteTarget.songIds || [])
      // remove the playlist and remove the songs from collection and other playlists
      setPlaylists(playlists.filter(p => p.name !== deleteTarget.playlistName).map(p => ({ ...p, songs: p.songs.filter(sid => !idsToRemove.has(sid)) })))
      setSongs(songs.filter(s => !idsToRemove.has(s.id)))
    } else if (deleteTarget.source === 'playlist' && deleteTarget.playlistName) {
      // remove only from that playlist (single song)
      setPlaylists(playlists.map(p => p.name === deleteTarget.playlistName ? ({ ...p, songs: p.songs.filter(sid => sid !== deleteTarget.song.id) }) : p))
    } else {
      // delete from main songs list and remove from playlists
      deleteSong(deleteTarget.song.id)
    }
    setDeleteTarget(null)
  }

  useEffect(() => {
    if (!deleteTarget) return
    const onKey = (e) => {
      if (e.key === 'Escape') cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteTarget])

  const updateSong = (song) => {
    setSongs(songs.map(item => item.id === song.id ? song : item))
    setEditingSong(null)
  }

  const showSong = (songId) => {
    setSelectedSongId(songId)
  }

  const transposeSong = (id, newKey) => {
    setSongs(songs.map(song => 
      song.id === id ? { ...song, key: newKey, lyrics: transposeLyrics(song.lyrics, song.key, newKey) } : song
    ))
  }

  const addToPlaylist = (playlistName, songId) => {
    const playlist = playlists.find(p => p.name === playlistName)
    if (playlist) {
      if (!playlist.songs.includes(songId)) {
        setPlaylists(playlists.map(p => 
          p.name === playlistName ? { ...p, songs: [...p.songs, songId] } : p
        ))
      }
    } else {
      setPlaylists([...playlists, { name: playlistName, songs: [songId] }])
    }
  }

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <h1>App de Canciones</h1>
      <nav>
        <button onClick={() => { setCurrentView('songs'); setSelectedSongId(null); setEditingSong(null) }}>Canciones</button>
        <button onClick={() => { setCurrentView('add'); setEditingSong(null); setSelectedSongId(null) }}>Agregar Canción</button>
        <button onClick={() => { setCurrentView('playlists'); setSelectedSongId(null); setEditingSong(null) }}>Listas</button>
        <button className="secondary mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Modo Día' : 'Modo Noche'}
        </button>
      </nav>
      {currentView === 'songs' && <SongList songs={songs} onTranspose={transposeSong} onAddToPlaylist={addToPlaylist} playlists={playlists} onEdit={(song) => { setEditingSong(song); setCurrentView('add') }} onDelete={deleteSong} onRequestDelete={requestDeleteSong} />}
      {currentView === 'add' && <AddSong onAdd={addSong} initialSong={editingSong} onUpdate={updateSong} onCancel={() => setEditingSong(null)} />}
      {currentView === 'playlists' && <PlaylistView playlists={playlists} songs={songs} selectedSongId={selectedSongId} onSelectSong={showSong} onRequestDelete={requestDeleteSong} onRequestDeletePlaylist={requestDeletePlaylist} />}

      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {deleteTarget.kind === 'playlist' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <h3 style={{ margin: 0 }}>Confirmar eliminación</h3>
            </div>
            <p>
              {deleteTarget.kind === 'playlist' && deleteTarget.playlistName
                ? `¿Estás seguro que quieres eliminar la lista "${deleteTarget.playlistName}"? Esto eliminará todas las canciones que contiene de la colección.`
                : deleteTarget.source === 'playlist' && deleteTarget.playlistName
                ? `¿Estás seguro que quieres eliminar "${deleteTarget.song.title}" de la lista "${deleteTarget.playlistName}"?`
                : `¿Estás seguro que quieres eliminar "${deleteTarget.song.title}" de la colección de canciones? Esto también la eliminará de cualquier lista de reproducción.`}
            </p>
            <div className="modal-actions">
              <button className="secondary" onClick={cancelDelete}>Cancelar</button>
              <button className="delete-confirm" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SongList({ songs, onTranspose, onAddToPlaylist, playlists, onEdit, onDelete, onRequestDelete }) {
  return (
    <div>
      <h2>Canciones</h2>
      {songs.map(song => (
        <SongCard
          key={song.id}
          song={song}
          onTranspose={onTranspose}
          onAddToPlaylist={onAddToPlaylist}
          playlists={playlists}
          onEdit={onEdit}
          onDelete={onDelete}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  )
}

function SongCard({ song, onTranspose, onAddToPlaylist, playlists, onEdit, onDelete, onRequestDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const allKeys = [
    { key: 'C', label: 'DO=C' },
    { key: 'C#', label: 'DO#=C#' },
    { key: 'D', label: 'RE=D' },
    { key: 'D#', label: 'RE#=D#' },
    { key: 'E', label: 'MI=E' },
    { key: 'F', label: 'FA=F' },
    { key: 'F#', label: 'FA#=F#' },
    { key: 'G', label: 'SOL=G' },
    { key: 'G#', label: 'SOL#=G#' },
    { key: 'A', label: 'LA=A' },
    { key: 'A#', label: 'LA#=A#' },
    { key: 'B', label: 'SI=B' },
  ]

  const handleTranspose = (selectedKey) => {
    onTranspose(song.id, selectedKey)
    setIsOpen(false)
  }

  const handleNewPlaylist = () => {
    const trimmed = newListName.trim()
    if (!trimmed) return
    onAddToPlaylist(trimmed, song.id)
    setNewListName('')
  }

  const handleDelete = () => {
    if (onRequestDelete) onRequestDelete(song, { source: 'songs' })
    else {
      const ok = window.confirm('¿Estás seguro que quieres eliminar la canción de la lista?')
      if (ok && onDelete) onDelete(song.id)
    }
  }

  return (
    <div className="song">
      <div className="song-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="delete-btn" onClick={handleDelete} aria-label={`Eliminar ${song.title}`} title="Eliminar canción">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h3>{song.title}</h3>
            <p className="song-key">Tono: <strong>{song.key}</strong></p>
          </div>
        </div>
        <div className="song-actions">
          <button className="secondary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Cerrar tonos' : 'Transportar'}
          </button>
          <button className="secondary" onClick={() => onEdit(song)}>
            Editar
          </button>
        </div>
      </div>

      <div className="lyrics" dangerouslySetInnerHTML={{ __html: formatLyrics(song.lyrics) }} />

      {isOpen && (
        <div className="transpose-panel">
          {allKeys.map(item => (
            <button
              key={item.key}
              className={`tone-btn ${item.key === song.key ? 'active' : ''}`}
              onClick={() => handleTranspose(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="playlist-control">
        <select defaultValue="" onChange={(e) => { if (e.target.value) onAddToPlaylist(e.target.value, song.id) }}>
          <option value="">Agregar a lista</option>
          {playlists.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <input
          className="new-playlist-input"
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Nueva lista"
        />
        <button className="secondary" type="button" onClick={handleNewPlaylist}>
          Crear lista
        </button>
      </div>
    </div>
  )
}

function AddSong({ onAdd, initialSong, onUpdate, onCancel }) {
  const [title, setTitle] = useState('')
  const [key, setKey] = useState('')
  const [lyrics, setLyrics] = useState('')

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title)
      setKey(initialSong.key)
      setLyrics(initialSong.lyrics)
    } else {
      setTitle('')
      setKey('')
      setLyrics('')
    }
  }, [initialSong])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (initialSong) {
      onUpdate({ ...initialSong, title, key, lyrics })
      if (onCancel) onCancel()
    } else {
      onAdd({ title, key, lyrics })
    }
    setTitle('')
    setKey('')
    setLyrics('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{initialSong ? 'Editar Canción' : 'Agregar Canción'}</h2>
      <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input placeholder="Tono" value={key} onChange={(e) => setKey(e.target.value)} required />
      <textarea placeholder="Letras con acordes [C]Hola [D]mundo" value={lyrics} onChange={(e) => setLyrics(e.target.value)} required />
      <div className="form-actions">
        <button type="submit">{initialSong ? 'Guardar cambios' : 'Agregar'}</button>
        {initialSong && onCancel && (
          <button type="button" className="secondary" onClick={() => { onCancel(); setTitle(''); setKey(''); setLyrics('') }}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function PlaylistView({ playlists, songs, selectedSongId, onSelectSong, onRequestDelete, onRequestDeletePlaylist }) {
  const selectedSong = songs.find(s => s.id === selectedSongId)
  const [scrollMode, setScrollMode] = useState(null) // null, 'slow', 'fast'
  const scrollIntervalRef = useRef(null)

  useEffect(() => {
    if (scrollMode) {
      const speed = scrollMode === 'slow' ? 2 : 5
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, speed)
      }, 100)
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [scrollMode])

  const toggleScroll = () => {
    setScrollMode(scrollMode === null ? 'slow' : scrollMode === 'slow' ? 'fast' : null)
  }

  return (
    <div className="playlist-layout">
      <div className="playlist-sidebar">
        <h2>Listas de Reproducción</h2>
        {playlists.map(playlist => (
          <div key={playlist.name} className="playlist-card">
            <div className="playlist-card-header">
              <h3>{playlist.name}</h3>
              <button className="playlist-remove-btn" title="Eliminar lista" onClick={() => onRequestDeletePlaylist && onRequestDeletePlaylist(playlist.name)} aria-label={`Eliminar lista ${playlist.name}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <ul>
              {playlist.songs.map(id => {
                const song = songs.find(s => s.id === id)
                return song ? (
                  <li key={id} className="playlist-item">
                    <button className={`playlist-song ${selectedSongId === song.id ? 'selected' : ''}`} type="button" onClick={() => onSelectSong(song.id)}>
                      {song.title}
                    </button>
                    <button className="playlist-delete-btn" title="Eliminar canción" onClick={() => onRequestDelete && onRequestDelete(song, { source: 'playlist', playlistName: playlist.name })} aria-label={`Eliminar ${song.title}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </li>
                ) : null
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="playlist-detail">
        {selectedSong ? (
          <div className="song-detail-card">
            <h2>{selectedSong.title}</h2>
            <p className="song-key">Tono: <strong>{selectedSong.key}</strong></p>
            <button className="secondary auto-scroll-btn" onClick={toggleScroll}>
              Auto-scroll: {scrollMode === null ? 'Off' : scrollMode === 'slow' ? 'Slow' : 'Fast'}
            </button>
            <div className="lyrics" dangerouslySetInnerHTML={{ __html: formatLyrics(selectedSong.lyrics) }} />
          </div>
        ) : (
          <div className="song-detail-empty">
            <p>Selecciona una canción de la lista para verla aquí.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const chordNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const chordIndex = {
  C: 0, 'B#': 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4, Fb: 4, 'E#': 5,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11, Cb: 11,
}

function parseChord(chord) {
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/)
  if (!match) return null
  return { root: match[1], suffix: match[2] }
}

function getSemitoneIndex(note) {
  const parsed = parseChord(note.trim())
  if (!parsed) return null
  const index = chordIndex[parsed.root]
  return index !== undefined ? index : null
}

function transposeRoot(root, diff) {
  const index = chordIndex[root]
  if (index === undefined) return root
  return chordNames[(index + diff + 12) % 12]
}

function transposeLyrics(lyrics, oldKey, newKey) {
  const oldIndex = getSemitoneIndex(oldKey)
  const newIndex = getSemitoneIndex(newKey)
  if (oldIndex === null || newIndex === null) return lyrics
  const diff = newIndex - oldIndex
  return lyrics.replace(/\[([A-G](?:#|b)?[^\]\s]*)\]/g, (match, chord) => {
    const parsed = parseChord(chord)
    if (!parsed) return match
    const transposedRoot = transposeRoot(parsed.root, diff)
    return `[${transposedRoot}${parsed.suffix}]`
  })
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatLyrics(lyrics) {
  let result = ''
  let buffer = ''
  let i = 0

  const flushBuffer = () => {
    if (buffer.length) {
      result += escapeHtml(buffer)
      buffer = ''
    }
  }

  while (i < lyrics.length) {
    if (lyrics[i] === '[') {
      const end = lyrics.indexOf(']', i + 1)
      if (end !== -1) {
        const chord = lyrics.slice(i + 1, end).trim()
        if (/^[A-G](?:#|b)?.*$/.test(chord)) {
          const leftMatch = buffer.match(/([^\s\[\]]+)$/)
          const leftText = leftMatch ? leftMatch[1] : ''
          if (leftText) {
            buffer = buffer.slice(0, -leftText.length)
          }

          let rightEnd = end + 1
          let rightText = ''
          while (rightEnd < lyrics.length && !/\s/.test(lyrics[rightEnd]) && lyrics[rightEnd] !== '[' && lyrics[rightEnd] !== ']') {
            rightText += lyrics[rightEnd]
            rightEnd += 1
          }

          const combined = leftText + rightText
          if (combined.length > 0) {
            flushBuffer()
            let position = 'center'
            if (!leftText && rightText) {
              position = 'left'
            } else if (leftText && !rightText) {
              position = 'right'
            }
            result += `<span class="lyric-chord pos-${position}"><span class="chord">${escapeHtml(chord)}</span><span class="lyric-text">${escapeHtml(combined)}</span></span>`
            i = rightEnd
            continue
          }

          flushBuffer()
          result += `<sup class="chord">${escapeHtml(chord)}</sup>`
          i = end + 1
          continue
        }
      }
    }

    buffer += lyrics[i]
    i += 1
  }

  flushBuffer()
  return result
}

export default App