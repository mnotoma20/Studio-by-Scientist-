'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Crown, Calendar, Music, Radio } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { type Church } from './ChurchCard'

interface SlideOutPanelProps {
  open: boolean
  onClose: () => void
  church: Church | null
}

const planBadge: Record<string, { color: string; bg: string; label: string }> = {
  free: { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)', label: 'Free' },
  pro: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Pro' },
  studio: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Studio' },
}

type Tab = 'overview' | 'songs' | 'settings'

export default function SlideOutPanel({ open, onClose, church }: SlideOutPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  if (!church) return null

  const plan = (church.plan ?? 'free').toLowerCase()
  const badge = planBadge[plan] ?? planBadge.free

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '480px',
              height: '100vh',
              background: 'rgba(14,14,28,0.98)',
              borderLeft: '1px solid rgba(167,139,250,0.2)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid rgba(167,139,250,0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: '#fff',
                  }}
                >
                  {church.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                    {church.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 600,
                        border: `1px solid ${badge.color}40`,
                      }}
                    >
                      <Crown size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {badge.label}
                    </span>
                    {church.location && (
                      <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} />
                        {church.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(107,114,128,0.15)',
                  border: '1px solid rgba(107,114,128,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(167,139,250,0.1)', padding: '0 24px' }}>
              {(['overview', 'songs', 'settings'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #a78bfa' : '2px solid transparent',
                    color: activeTab === tab ? '#a78bfa' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    marginBottom: '-1px',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {activeTab === 'overview' && (
                <>
                  {/* Meta info */}
                  <div
                    style={{
                      background: 'rgba(26,26,46,0.8)',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: '1px solid rgba(167,139,250,0.1)',
                    }}
                  >
                    {church.pastor && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>Pastor</span>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{church.pastor}</span>
                      </div>
                    )}
                    {church.created_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>Member since</span>
                        <span style={{ fontSize: '13px', color: '#fff' }}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                          {timeAgo(church.created_at)}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Last active</span>
                      <span style={{ fontSize: '13px', color: '#10b981' }}>● Active now</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { icon: Music, label: 'Songs Imported', value: 0, color: '#a78bfa' },
                      { icon: Radio, label: 'Services Run', value: 0, color: '#ec4899' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div
                        key={label}
                        style={{
                          background: 'rgba(26,26,46,0.8)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(167,139,250,0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Icon size={20} color={color} style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{value}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Usage stats */}
                  <div
                    style={{
                      background: 'rgba(26,26,46,0.8)',
                      borderRadius: '12px',
                      padding: '18px',
                      border: '1px solid rgba(167,139,250,0.1)',
                    }}
                  >
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>
                      Feature Usage
                    </h4>
                    {[
                      { label: 'Songs', pct: 65, color: '#a78bfa' },
                      { label: 'Bible', pct: 42, color: '#3b82f6' },
                      { label: 'Schedule', pct: 28, color: '#10b981' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</span>
                          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: '3px',
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'songs' && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  <Music size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px' }}>No song import history yet</p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                      Church Name
                    </label>
                    <input
                      defaultValue={church.name}
                      style={{
                        width: '100%',
                        background: 'rgba(15,15,30,0.8)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                      Plan
                    </label>
                    <select
                      defaultValue={church.plan ?? 'free'}
                      style={{
                        width: '100%',
                        background: 'rgba(15,15,30,0.8)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                  <button
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
