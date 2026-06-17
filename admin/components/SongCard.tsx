'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Pause, Download, Edit2, Trash2 } from 'lucide-react'
import Image from 'next/image'

export interface SharedSong {
  id: string
  title: string
  artist: string
  voiced_by?: string
  language?: string
  category?: string
  cover_url?: string
  audio_url?: string
  play_count?: number
  import_count?: number
  price_tier?: 'free' | 'premium'
  is_published?: boolean
  created_at?: string
}

export interface SharedSongFull extends SharedSong {
  lyrics?: Array<{ type: string; lyrics: string }>
  published?: boolean
}

interface SongCardProps {
  song: SharedSongFull
  onEdit: (song: SharedSongFull) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string, published: boolean) => void
}

export default function SongCard({ song, onEdit, onDelete, onTogglePublish }: SongCardProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const songFull = song as SharedSongFull

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!song.audio_url) return
    if (!audioRef.current) {
      audioRef.current = new Audio(song.audio_url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(167,139,250,0.2)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(26,26,46,0.9)',
        border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover art */}
      <div
        style={{
          height: '160px',
          position: 'relative',
          background: song.cover_url
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(236,72,153,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {song.cover_url ? (
          <Image
            src={song.cover_url}
            alt={song.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Music size={48} color="rgba(167,139,250,0.5)" />
        )}

        {/* Published indicator */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: song.is_published ? '#10b981' : '#6b7280' }} />

        {/* Play preview button — shown if audio_url exists */}
        {song.audio_url && (
          <button
            onClick={togglePlay}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: playing ? 'rgba(236,72,153,0.9)' : 'rgba(167,139,250,0.9)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              transition: 'all 0.2s',
              color: '#fff',
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {song.language && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              {song.language}
            </span>
          )}
          {song.category && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: 'rgba(167,139,250,0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.2)',
              }}
            >
              {song.category}
            </span>
          )}
        </div>

        {/* Title & Artist */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
            {song.title}
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>{song.artist}</div>
          {song.voiced_by && (
            <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px' }}>
              🎤 Voiced by {song.voiced_by}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280' }}>
            <Play size={13} />
            {(song.play_count ?? 0).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280' }}>
            <Download size={13} />
            {(song.import_count ?? 0).toLocaleString()}
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(167,139,250,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Price tier */}
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: song.price_tier === 'premium' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                color: song.price_tier === 'premium' ? '#f59e0b' : '#9ca3af',
                border: `1px solid ${song.price_tier === 'premium' ? 'rgba(245,158,11,0.3)' : 'rgba(107,114,128,0.2)'}`,
                fontWeight: 600,
              }}
            >
              {song.price_tier === 'premium' ? 'Premium' : 'Free'}
            </span>

            {/* Published toggle */}
            <button
              onClick={() => onTogglePublish(song.id, !song.is_published)}
              style={{
                width: '32px',
                height: '18px',
                borderRadius: '9px',
                background: song.is_published ? '#10b981' : 'rgba(107,114,128,0.3)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: song.is_published ? '14px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {/* Edit / Delete */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => onEdit(song)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#a78bfa',
              }}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(song.id)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ef4444',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
