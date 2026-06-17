'use client'

import { motion } from 'framer-motion'
import { MapPin, Eye, ArrowUpCircle, ShieldOff } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export interface Church {
  id: string
  name: string
  location?: string
  pastor?: string
  plan?: string
  created_at?: string
  last_active?: string
  email?: string
}

interface ChurchCardProps {
  church: Church
  onClick: () => void
}

const planColors: Record<string, { bg: string; color: string; border: string; label: string }> = {
  free: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.2)', label: 'Free' },
  pro: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)', label: 'Pro' },
  studio: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Studio' },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const avatarColors = [
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]

export default function ChurchCard({ church, onClick }: ChurchCardProps) {
  const plan = (church.plan ?? 'free').toLowerCase()
  const planStyle = planColors[plan] ?? planColors.free
  const colorIdx = church.name.charCodeAt(0) % avatarColors.length

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 10px 32px rgba(167,139,250,0.18)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        background: 'rgba(26,26,46,0.9)',
        border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: '14px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top: avatar + info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: avatarColors[colorIdx],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {getInitials(church.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {church.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: planStyle.bg,
                color: planStyle.color,
                border: `1px solid ${planStyle.border}`,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {planStyle.label}
            </span>
          </div>

          {church.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#9ca3af' }}>
              <MapPin size={12} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {church.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Member since */}
      {church.created_at && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Joined {timeAgo(church.created_at)}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid rgba(167,139,250,0.08)' }}>
        <button
          onClick={e => { e.stopPropagation(); onClick() }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '7px 0',
            borderRadius: '8px',
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: '#a78bfa',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Eye size={13} /> View
        </button>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '7px 0',
            borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowUpCircle size={13} /> Upgrade
        </button>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '7px 0',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ShieldOff size={13} /> Suspend
        </button>
      </div>
    </motion.div>
  )
}
