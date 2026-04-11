import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [currentView, setCurrentView] = useState('songs')
  const [selectedSongId, setSelectedSongId] = useState(null)
  const [editingSong, setEditingSong] = useState(null)
  const [scrollToSongId, setScrollToSongId] = useState(null)
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
    const id = Date.now()
    setSongs(prevSongs => [...prevSongs, { ...song, id }])
    setCurrentView('songs')
    setScrollToSongId(id)
  }

  const movePlaylistSong = (playlistName, fromIndex, toIndex) => {
    setPlaylists(prevPlaylists => prevPlaylists.map(p => {
      if (p.name !== playlistName) return p
      const nextSongs = [...p.songs]
      const [moved] = nextSongs.splice(fromIndex, 1)
      nextSongs.splice(toIndex, 0, moved)
      return { ...p, songs: nextSongs }
    }))
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
      // remove only the playlist, keep all songs in the main collection
      setPlaylists(playlists.filter(p => p.name !== deleteTarget.playlistName))
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
    setCurrentView('songs')
    setScrollToSongId(song.id)
  }

  useEffect(() => {
    if (scrollToSongId !== null) {
      const timer = setTimeout(() => setScrollToSongId(null), 800)
      return () => clearTimeout(timer)
    }
  }, [scrollToSongId])

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
      <header className="app-bar">
        <div className="brand-bar">
          <h1>App de Canciones</h1>
        </div>
        <div className="header-actions">
          <nav>
            <button onClick={() => { setCurrentView('songs'); setSelectedSongId(null); setEditingSong(null) }}>Canciones</button>
            <button onClick={() => { setCurrentView('add'); setEditingSong(null); setSelectedSongId(null) }}>Agregar Canción</button>
            <button onClick={() => { setCurrentView('playlists'); setSelectedSongId(null); setEditingSong(null) }}>Listas</button>
          </nav>
          <button className="secondary mode-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? (
              <>
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 4.5a1 1 0 0 1 1 1V8a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Z" fill="currentColor"/>
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="currentColor"/>
                  <path d="M12 19.5a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Z" fill="currentColor"/>
                  <path d="M5.22 6.22a1 1 0 0 1 1.414 0l.353.353a1 1 0 1 1-1.414 1.414L5.22 7.636a1 1 0 0 1 0-1.414Z" fill="currentColor"/>
                  <path d="M17.01 17.01a1 1 0 0 1 1.414 0l.353.354a1 1 0 0 1-1.414 1.414l-.353-.353a1 1 0 0 1 0-1.415Z" fill="currentColor"/>
                  <path d="M4.5 12a1 1 0 0 1 1-1H7a1 1 0 1 1 0 2H5.5a1 1 0 0 1-1-1Z" fill="currentColor"/>
                  <path d="M17 12a1 1 0 0 1 1-1h1.5a1 1 0 1 1 0 2H18a1 1 0 0 1-1-1Z" fill="currentColor"/>
                  <path d="M5.22 17.78a1 1 0 0 1 0 1.414l-.353.353a1 1 0 1 1-1.414-1.414l.353-.353a1 1 0 0 1 1.414 0Z" fill="currentColor"/>
                  <path d="M17.01 6.99a1 1 0 0 1 0 1.414l-.353.353a1 1 0 0 1-1.414-1.414l.353-.353a1 1 0 0 1 1.414 0Z" fill="currentColor"/>
                </svg>
                Modo Día
              </>
            ) : (
              <>
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 3a1 1 0 0 1 .993.883L13 4a8 8 0 1 0 8 8 1 1 0 0 1 0 2 10 10 0 1 1-10-10Z" fill="currentColor"/>
                  <path d="M12 5.5a6.5 6.5 0 0 0 0 13 6.5 6.5 0 0 1 0-13Z" fill="currentColor" opacity="0.4"/>
                </svg>
                Modo Noche
              </>
            )}
          </button>
        </div>
      </header>
      <main className="app-content">
        {currentView === 'songs' && <SongList songs={songs} onTranspose={transposeSong} onAddToPlaylist={addToPlaylist} playlists={playlists} onEdit={(song) => { setEditingSong(song); setCurrentView('add') }} onDelete={deleteSong} onRequestDelete={requestDeleteSong} highlightSongId={scrollToSongId} />}
        {currentView === 'add' && <AddSong onAdd={addSong} initialSong={editingSong} onUpdate={updateSong} onCancel={() => setEditingSong(null)} />}
        {currentView === 'playlists' && <PlaylistView playlists={playlists} songs={songs} selectedSongId={selectedSongId} onSelectSong={showSong} onRequestDelete={requestDeleteSong} onRequestDeletePlaylist={requestDeletePlaylist} onTranspose={transposeSong} onMoveSong={movePlaylistSong} />}
      </main>

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
                ? `¿Estás seguro que quieres eliminar la lista "${deleteTarget.playlistName}"? Esto solo eliminará la lista y no las canciones.`
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

function SongList({ songs, onTranspose, onAddToPlaylist, playlists, onEdit, onDelete, onRequestDelete, highlightSongId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const filteredSongs = songs.filter(song => song.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div className="view-header">
        <h2>Lista General de Canciones</h2>
        <input
          className="search-input"
          type="search"
          placeholder="Buscar canciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredSongs.length > 0 ? filteredSongs.map(song => (
        <SongCard
          key={song.id}
          song={song}
          onTranspose={onTranspose}
          onAddToPlaylist={onAddToPlaylist}
          playlists={playlists}
          onEdit={onEdit}
          onDelete={onDelete}
          onRequestDelete={onRequestDelete}
          highlightSongId={highlightSongId}
        />
      )) : <p className="empty-state">No se encontraron canciones.</p>}
    </div>
  )
}

function SongCard({ song, onTranspose, onAddToPlaylist, playlists, onEdit, onDelete, onRequestDelete, highlightSongId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [scrollMode, setScrollMode] = useState(null)
  const [showFullLyrics, setShowFullLyrics] = useState(false)
  const cardRef = useRef(null)
  const scrollIntervalRef = useRef(null)
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

  const toggleScroll = () => {
    const nextMode = scrollMode === null ? 'slow' : scrollMode === 'slow' ? 'fast' : null
    setScrollMode(nextMode)
    if (nextMode !== null) {
      setShowFullLyrics(true)
      if (cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  useEffect(() => {
    if (scrollMode) {
      const speed = scrollMode === 'slow' ? 2 : 5
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, speed)
      }, 100)
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
  }, [scrollMode])

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

  useEffect(() => {
    if (highlightSongId === song.id && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightSongId, song.id])

  const songPlaylists = playlists.filter(p => p.songs.includes(song.id)).map(p => p.name)

  return (
    <div ref={cardRef} className={`song ${highlightSongId === song.id ? 'highlighted' : ''}`}>
      <div className="song-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h3>{song.title}</h3>
            <p className="song-key">Tono: <strong>{song.key}</strong></p>
            {songPlaylists.length > 0 && (
              <div className="song-playlist-badges">
                <span className="playlist-badge-label">Agregada en la lista:</span>
                {songPlaylists.map(name => (
                  <span key={name} className="playlist-badge">{name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="song-actions">
          <button className="secondary auto-scroll-btn" type="button" onClick={toggleScroll}>
            Auto-scroll: {scrollMode === null ? 'Off' : scrollMode === 'slow' ? 'Slow' : 'Fast'}
          </button>
          <button className={`secondary transport-toggle ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Cerrar tonos' : 'Transportar'}
          </button>
          <button className="secondary" onClick={() => onEdit(song)}>
            Editar
          </button>
          <button className="delete-btn" onClick={handleDelete} aria-label={`Eliminar ${song.title}`} title="Eliminar canción">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={`transpose-panel ${isOpen ? 'open' : 'closed'}`}>
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

      <div className={`lyrics ${showFullLyrics || scrollMode !== null ? '' : 'collapsed'}`} dangerouslySetInnerHTML={{ __html: formatLyrics(song.lyrics) }} />
      <button className="secondary small" type="button" onClick={() => setShowFullLyrics(prev => !prev)}>
        {showFullLyrics ? 'Ver menos' : 'Ver más...'}
      </button>

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
    <div>
      <div className="view-header">
        <h2>{initialSong ? 'Editar Canción' : 'Agregar Canción'}</h2>
        <div className="view-header-filler" aria-hidden="true" />
      </div>
      <form onSubmit={handleSubmit}>
        <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select value={key} onChange={(e) => setKey(e.target.value)} required>
          <option value="" disabled>Selecciona un tono</option>
          {allKeys.map(item => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
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
    </div>
  )
}

function PlaylistView({ playlists, songs, selectedSongId, onSelectSong, onRequestDelete, onRequestDeletePlaylist, onTranspose, onMoveSong }) {
  const [playlistSearch, setPlaylistSearch] = useState('')
  const [dragSource, setDragSource] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)
  const selectedSong = songs.find(s => s.id === selectedSongId)
  const [scrollMode, setScrollMode] = useState(null) // null, 'slow', 'fast'
  const [transportOpen, setTransportOpen] = useState(false)
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

  const handleTranspose = (key) => {
    if (!selectedSong) return
    onTranspose(selectedSong.id, key)
    setTransportOpen(false)
  }

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

  return (
    <div className="playlist-layout">
      <div className="playlist-sidebar">
        <div className="view-header">
          <h2>Listas de Reproducción</h2>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar listas..."
            value={playlistSearch}
            onChange={(e) => setPlaylistSearch(e.target.value)}
          />
        </div>
        {playlists.filter(playlist => playlist.name.toLowerCase().includes(playlistSearch.toLowerCase())).length > 0 ? playlists.filter(playlist => playlist.name.toLowerCase().includes(playlistSearch.toLowerCase())).map(playlist => (
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
              {playlist.songs.map((id, index) => {
                const song = songs.find(s => s.id === id)
                return song ? (
                  <li
                    key={id}
                    className={`playlist-item ${dragTarget === index && dragSource !== null ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDragSource(index)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragTarget(index)
                    }}
                    onDragLeave={() => setDragTarget(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      const fromIndex = dragSource
                      const toIndex = index
                      if (fromIndex !== null && fromIndex !== toIndex) {
                        onMoveSong(playlist.name, fromIndex, toIndex)
                      }
                      setDragSource(null)
                      setDragTarget(null)
                    }}
                  >
                    <div className="playlist-item-left">
                      <span className="playlist-item-number">{index + 1}</span>
                      <button className={`playlist-song ${selectedSongId === song.id ? 'selected' : ''}`} type="button" onClick={() => onSelectSong(song.id)}>
                        {song.title}
                      </button>
                    </div>
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
        )) : <p className="empty-state">No se encontraron listas.</p>}
      </div>
      <div className="playlist-detail">
        {selectedSong ? (
          <div className="song-detail-card">
            <h2>{selectedSong.title}</h2>
            <div className="song-detail-meta">
              <p className="song-key">Tono: <strong>{selectedSong.key}</strong></p>
              <button className={`secondary transport-toggle ${transportOpen ? 'active' : ''}`} type="button" onClick={() => setTransportOpen(!transportOpen)}>
                {transportOpen ? 'Cerrar transportar' : 'Transportar'}
              </button>
            </div>
            <div className={`transpose-panel ${transportOpen ? 'open' : 'closed'}`}>
              {allKeys.map(item => (
                <button key={item.key} className={`tone-btn ${item.key === selectedSong.key ? 'active' : ''}`} type="button" onClick={() => handleTranspose(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
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