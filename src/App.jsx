import { useState, useEffect } from 'react'
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

  const updateSong = (song) => {
    setSongs(songs.map(item => item.id === song.id ? song : item))
    setEditingSong(null)
  }

  const showSong = (songId) => {
    setSelectedSongId(songId)
    setCurrentView('songs')
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
        <button className="secondary" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Modo Día' : 'Modo Noche'}
        </button>
      </nav>
      {currentView === 'songs' && <SongList songs={songs} onTranspose={transposeSong} onAddToPlaylist={addToPlaylist} playlists={playlists} selectedSongId={selectedSongId} onEdit={(song) => { setEditingSong(song); setCurrentView('add') }} />}
      {currentView === 'add' && <AddSong onAdd={addSong} initialSong={editingSong} onUpdate={updateSong} onCancel={() => setEditingSong(null)} />}
      {currentView === 'playlists' && <PlaylistView playlists={playlists} songs={songs} onSelectSong={showSong} />}
    </div>
  )
}

function SongList({ songs, onTranspose, onAddToPlaylist, playlists, selectedSongId, onEdit }) {
  const visibleSongs = selectedSongId ? songs.filter(song => song.id === selectedSongId) : songs

  return (
    <div>
      <h2>Canciones</h2>
      {selectedSongId && visibleSongs.length === 1 && <p>Mostrando canción seleccionada</p>}
      {visibleSongs.map(song => (
        <SongCard
          key={song.id}
          song={song}
          onTranspose={onTranspose}
          onAddToPlaylist={onAddToPlaylist}
          playlists={playlists}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

function SongCard({ song, onTranspose, onAddToPlaylist, playlists, onEdit }) {
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

  return (
    <div className="song">
      <div className="song-header">
        <div>
          <h3>{song.title}</h3>
          <p className="song-key">Tono: <strong>{song.key}</strong></p>
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

function PlaylistView({ playlists, songs, onSelectSong }) {
  return (
    <div>
      <h2>Listas de Reproducción</h2>
      {playlists.map(playlist => (
        <div key={playlist.name} className="playlist-card">
          <h3>{playlist.name}</h3>
          <ul>
            {playlist.songs.map(id => {
              const song = songs.find(s => s.id === id)
              return song ? (
                <li key={id}>
                  <button className="playlist-song" type="button" onClick={() => onSelectSong(song.id)}>
                    {song.title}
                  </button>
                </li>
              ) : null
            })}
          </ul>
        </div>
      ))}
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