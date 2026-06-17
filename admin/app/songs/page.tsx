'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, X, Play, Pause, Music, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import SongCard, { type SharedSong, type SharedSongFull } from '@/components/SongCard'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase'

interface LyricsSection {
  type: string
  lyrics: string
}

export default function SongsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [voicedBy, setVoicedBy] = useState('')
  const [language, setLanguage] = useState('English')
  const [category, setCategory] = useState('Worship')
  const [priceTier, setPriceTier] = useState<'free' | 'premium'>('free')
  const [lyricsSections, setLyricsSections] = useState<LyricsSection[]>([
    { type: 'Verse 1', lyrics: '' },
    { type: 'Chorus', lyrics: '' },
  ])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [audioDragOver, setAudioDragOver] = useState(false)
  const [coverDragOver, setCoverDragOver] = useState(false)

  // Songs list
  const [songs, setSongs] = useState<SharedSongFull[]>([])
  const [loadingSongs, setLoadingSongs] = useState(true)

  // Edit modal
  const [editSong, setEditSong] = useState<SharedSongFull | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editVoicedBy, setEditVoicedBy] = useState('')
  const [editLanguage, setEditLanguage] = useState('English')
  const [editCategory, setEditCategory] = useState('Worship')
  const [editPriceTier, setEditPriceTier] = useState<'free' | 'premium'>('free')
  const [editSections, setEditSections] = useState<LyricsSection[]>([])
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // WaveSurfer
  const waveRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<{ play: () => void; pause: () => void; destroy: () => void; isPlaying: () => boolean; load: (url: string) => void } | null>(null)

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    setLoadingSongs(true)
    const res = await fetch('/api/songs')
    const json = await res.json()
    if (json.error) toast(`Songs fetch error: ${json.error}`, 'error')
    if (json.songs) setSongs(json.songs.map((s: SharedSongFull) => ({ ...s, is_published: s.published ?? s.is_published })))
    setLoadingSongs(false)
  }

  // WaveSurfer setup
  useEffect(() => {
    if (!audioFile || !waveRef.current) return
    if (wsRef.current) wsRef.current.destroy()
    setIsPlaying(false)

    const url = URL.createObjectURL(audioFile)
    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      wsRef.current = WaveSurfer.create({
        container: waveRef.current!,
        waveColor: '#a78bfa',
        progressColor: '#ec4899',
        height: 60,
        barWidth: 2,
      })
      wsRef.current.load(url)
    })
    return () => {
      wsRef.current?.destroy()
    }
  }, [audioFile])

  const handleCoverFile = (file: File) => {
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = e => setCoverPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const addSection = () => {
    setLyricsSections(prev => [...prev, { type: `Section ${prev.length + 1}`, lyrics: '' }])
  }

  const updateSection = (idx: number, field: 'type' | 'lyrics', value: string) => {
    setLyricsSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const removeSection = (idx: number) => {
    setLyricsSections(prev => prev.filter((_, i) => i !== idx))
  }

  const handlePublish = async () => {
    if (!title || !artist) {
      toast('Title and artist are required', 'error')
      return
    }
    setPublishing(true)
    try {
      let audioUrl = ''
      let coverUrl = ''

      if (audioFile) {
        const fd = new FormData()
        fd.append('file', audioFile)
        fd.append('title', title)
        const uploadRes = await fetch('/api/songs/upload-audio', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok || uploadData.error) {
          toast(`Audio upload failed: ${uploadData.error}`, 'error')
          setPublishing(false)
          return
        }
        audioUrl = uploadData.url
      }

      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${Date.now()}_${title.replace(/\s+/g, '_')}.${ext}`
        const { error: coverErr } = await supabase.storage
          .from('song-covers')
          .upload(path, coverFile, { upsert: true })
        if (!coverErr) {
          const { data: urlData } = supabase.storage.from('song-covers').getPublicUrl(path)
          coverUrl = urlData.publicUrl
        }
      }

      const res = await fetch('/api/songs/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, artist, language, category,
          voiced_by: voicedBy || null,
          price_tier: priceTier,
          lyrics: lyricsSections,
          audio_url: audioUrl || null,
          thumbnail_url: coverUrl || null,
          published: true,
          play_count: 0,
          import_count: 0,
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to publish')

      toast('Song published successfully!', 'success')
      setTitle('')
      setArtist('')
      setVoicedBy('')
      setLyricsSections([{ type: 'Verse 1', lyrics: '' }, { type: 'Chorus', lyrics: '' }])
      setAudioFile(null)
      setCoverFile(null)
      setCoverPreview(null)
      fetchSongs()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to publish song', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const openEdit = (song: SharedSongFull) => {
    setEditSong(song)
    setEditTitle(song.title)
    setEditArtist(song.artist || '')
    setEditVoicedBy(song.voiced_by || '')
    setEditLanguage(song.language || 'English')
    setEditCategory(song.category || 'Worship')
    setEditPriceTier((song.price_tier as 'free' | 'premium') || 'free')
    setEditSections(Array.isArray(song.lyrics) && song.lyrics.length
      ? song.lyrics
      : [{ type: 'Verse 1', lyrics: '' }])
    setEditAudioFile(null)
  }

  const saveEdit = async () => {
    if (!editSong) return
    setSaving(true)
    try {
      let audioUrl = editSong.audio_url || ''
      if (editAudioFile) {
        const fd = new FormData()
        fd.append('file', editAudioFile)
        fd.append('title', editTitle)
        const uploadRes = await fetch('/api/songs/upload-audio', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok || uploadData.error) {
          toast(`Audio upload failed: ${uploadData.error}`, 'error')
          setSaving(false)
          return
        }
        audioUrl = uploadData.url
      }
      const res = await fetch(`/api/songs/${editSong.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          artist: editArtist,
          voiced_by: editVoicedBy || null,
          language: editLanguage,
          category: editCategory,
          price_tier: editPriceTier,
          lyrics: editSections,
          audio_url: audioUrl || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast('Song updated!', 'success')
      setEditSong(null)
      fetchSongs()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this song?')) return
    await fetch(`/api/songs/${id}`, { method: 'DELETE' })
    setSongs(prev => prev.filter(s => s.id !== id))
    toast('Song deleted', 'info')
  }

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    await fetch(`/api/songs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !currentlyPublished }) })
    setSongs(prev => prev.map(s => s.id === id ? { ...s, is_published: !currentlyPublished } : s))
  }

  const togglePlay = () => {
    if (!wsRef.current) return
    if (wsRef.current.isPlaying()) {
      wsRef.current.pause()
      setIsPlaying(false)
    } else {
      wsRef.current.play()
      setIsPlaying(true)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(15,15,30,0.8)',
    border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <DashboardLayout title="Songs Library">
      {/* Upload form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(26,26,46,0.9)',
          border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '28px',
        }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} color="#a78bfa" />
          Upload New Song
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Title *</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Artist *</label>
              <input style={inputStyle} value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Voiced by <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input style={inputStyle} value={voicedBy} onChange={e => setVoicedBy(e.target.value)} placeholder="e.g. Choir member name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Language</label>
                <select style={{ ...inputStyle }} value={language} onChange={e => setLanguage(e.target.value)}>
                  {['English', 'Yoruba', 'Igbo', 'Pidgin', 'French'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Category</label>
                <select style={{ ...inputStyle }} value={category} onChange={e => setCategory(e.target.value)}>
                  {['Worship', 'Praise', 'Hymn', 'Nigerian Gospel', 'Winners Chapel'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price tier */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Price Tier</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['free', 'premium'] as const).map(tier => (
                  <button
                    key={tier}
                    onClick={() => setPriceTier(tier)}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '8px',
                      border: priceTier === tier
                        ? `1px solid ${tier === 'premium' ? '#f59e0b' : '#a78bfa'}`
                        : '1px solid rgba(167,139,250,0.15)',
                      background: priceTier === tier
                        ? tier === 'premium' ? 'rgba(245,158,11,0.15)' : 'rgba(167,139,250,0.15)'
                        : 'transparent',
                      color: priceTier === tier
                        ? tier === 'premium' ? '#f59e0b' : '#a78bfa'
                        : '#6b7280',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — cover + audio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Cover art upload */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Cover Art</label>
              <div
                onDragOver={e => { e.preventDefault(); setCoverDragOver(true) }}
                onDragLeave={() => setCoverDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setCoverDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) handleCoverFile(file)
                }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = e => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleCoverFile(file)
                  }
                  input.click()
                }}
                style={{
                  height: '120px',
                  border: `2px dashed ${coverDragOver ? '#a78bfa' : 'rgba(167,139,250,0.25)'}`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: coverDragOver ? 'rgba(167,139,250,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <Upload size={24} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '12px' }}>Drop image or click</div>
                  </div>
                )}
              </div>
            </div>

            {/* Audio upload */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Audio File (MP3/M4A)</label>
              <div
                onDragOver={e => { e.preventDefault(); setAudioDragOver(true) }}
                onDragLeave={() => setAudioDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setAudioDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) setAudioFile(file)
                }}
                onClick={() => {
                  if (audioFile) return
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'audio/mp3,audio/m4a,audio/mpeg,audio/*'
                  input.onchange = e => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) setAudioFile(file)
                  }
                  input.click()
                }}
                style={{
                  border: `2px dashed ${audioDragOver ? '#ec4899' : 'rgba(236,72,153,0.25)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: audioFile ? 'default' : 'pointer',
                  background: audioDragOver ? 'rgba(236,72,153,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {audioFile ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{audioFile.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={e => { e.stopPropagation(); togglePlay() }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                          }}
                        >
                          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setAudioFile(null); wsRef.current?.destroy() }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div ref={waveRef} style={{ borderRadius: '4px', overflow: 'hidden' }} />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <Music size={22} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '12px' }}>Drop MP3/M4A or click</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics sections */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Lyrics Sections</label>
            <button
              onClick={addSection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                color: '#a78bfa',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Add Section
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {lyricsSections.map((section, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15,15,30,0.8)',
                  border: '1px solid rgba(167,139,250,0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    value={section.type}
                    onChange={e => updateSection(idx, 'type', e.target.value)}
                    style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    placeholder="Section name"
                  />
                  {lyricsSections.length > 1 && (
                    <button
                      onClick={() => removeSection(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  value={section.lyrics}
                  onChange={e => updateSection(idx, 'lyrics', e.target.value)}
                  placeholder="Lyrics..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{
            marginTop: '20px',
            padding: '12px 28px',
            borderRadius: '10px',
            background: publishing ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg, #ec4899, #a78bfa)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            cursor: publishing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: publishing ? 'none' : '0 4px 20px rgba(236,72,153,0.3)',
          }}
        >
          {publishing ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Publishing...</> : '🚀 Publish to Library'}
        </button>
      </motion.div>

      {/* Songs grid */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '18px' }}>
          All Songs {!loadingSongs && `(${songs.length})`}
        </h3>

        {loadingSongs ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '320px', borderRadius: '14px', background: 'rgba(26,26,46,0.5)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <Music size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No songs in the library yet. Upload your first song above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {songs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ───────────────────────────── */}
      {editSong && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setEditSong(null) }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ background: '#0d0d18', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Edit Song</h2>
              <button onClick={() => setEditSong(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Title</label>
                <input style={inputStyle} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Artist</label>
                <input style={inputStyle} value={editArtist} onChange={e => setEditArtist(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Voiced by <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <input style={inputStyle} value={editVoicedBy} onChange={e => setEditVoicedBy(e.target.value)} placeholder="e.g. Choir member name" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Language</label>
                <select style={{ ...inputStyle }} value={editLanguage} onChange={e => setEditLanguage(e.target.value)}>
                  {['English','Yoruba','Igbo','Pidgin','French'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Category</label>
                <select style={{ ...inputStyle }} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  {['Worship','Praise','Hymn','Nigerian Gospel','Winners Chapel'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price tier */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {(['free','premium'] as const).map(tier => (
                <button key={tier} onClick={() => setEditPriceTier(tier)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: editPriceTier === tier ? `1px solid ${tier === 'premium' ? '#f59e0b' : '#a78bfa'}` : '1px solid rgba(167,139,250,0.15)', background: editPriceTier === tier ? tier === 'premium' ? 'rgba(245,158,11,0.15)' : 'rgba(167,139,250,0.15)' : 'transparent', color: editPriceTier === tier ? tier === 'premium' ? '#f59e0b' : '#a78bfa' : '#6b7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {tier}
                </button>
              ))}
            </div>

            {/* Replace audio */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>
                Replace Audio {editSong.audio_url && <span style={{ color: '#10b981' }}>— current recording exists ✓</span>}
              </label>
              <div onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='audio/*'; i.onchange=e=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) setEditAudioFile(f); }; i.click(); }}
                style={{ border: '2px dashed rgba(236,72,153,0.3)', borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', color: editAudioFile ? '#10b981' : '#6b7280', fontSize: '13px' }}>
                {editAudioFile ? `✓ ${editAudioFile.name}` : 'Click to upload new audio (leave empty to keep current)'}
              </div>
            </div>

            {/* Lyrics sections */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Lyrics Sections</label>
                <button onClick={() => setEditSections(p => [...p, { type: `Section ${p.length+1}`, lyrics: '' }])} style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', cursor: 'pointer' }}>
                  + Add Section
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {editSections.map((sec, idx) => (
                  <div key={idx} style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input value={sec.type} onChange={e => setEditSections(p => p.map((s,i) => i===idx ? {...s,type:e.target.value} : s))} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px' }} placeholder="Section name" />
                      {editSections.length > 1 && (
                        <button onClick={() => setEditSections(p => p.filter((_,i) => i!==idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>
                      )}
                    </div>
                    <textarea value={sec.lyrics} onChange={e => setEditSections(p => p.map((s,i) => i===idx ? {...s,lyrics:e.target.value} : s))} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} placeholder="Lyrics..." />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditSong(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(167,139,250,0.2)', color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: saving ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg,#a78bfa,#ec4899)', border: 'none', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </DashboardLayout>
  )
}
