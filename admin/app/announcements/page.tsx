'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Info, AlertTriangle, Sparkles, Send, Clock, CheckCircle, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

type AnnouncementType = 'info' | 'warning' | 'feature'
type TargetType = 'all' | 'free' | 'pro' | 'studio' | 'specific'
type StatusType = 'sent' | 'scheduled' | 'draft'

interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  target: TargetType
  status: StatusType
  scheduled_at?: string
  created_at: string
}

const typeConfig: Record<AnnouncementType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  info: { icon: Info, color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: 'Info' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Warning' },
  feature: { icon: Sparkles, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'New Feature' },
}

const statusConfig: Record<StatusType, { color: string; bg: string }> = {
  sent: { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  scheduled: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  draft: { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' },
}

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<AnnouncementType>('info')
  const [target, setTarget] = useState<TargetType>('all')
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [sending, setSending] = useState(false)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data as Announcement[])
    setLoadingAnnouncements(false)
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast('Title and body are required', 'error')
      return
    }
    setSending(true)
    try {
      const isScheduled = scheduleMode && scheduledAt
      const { error } = await supabase.from('announcements').insert({
        title,
        body,
        type,
        target,
        status: isScheduled ? 'scheduled' : 'sent',
        scheduled_at: isScheduled ? new Date(scheduledAt).toISOString() : null,
        sent_at: isScheduled ? null : new Date().toISOString(),
      })

      if (error) throw error

      toast(isScheduled ? 'Announcement scheduled!' : 'Announcement sent!', 'success')
      setTitle('')
      setBody('')
      setType('info')
      setTarget('all')
      setScheduleMode(false)
      setScheduledAt('')
      fetchAnnouncements()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to send announcement', 'error')
    } finally {
      setSending(false)
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
    fontFamily: 'inherit',
  }

  return (
    <DashboardLayout title="Announcements">
      {/* New Announcement */}
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
          <Megaphone size={18} color="#a78bfa" />
          New Announcement
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
          </div>

          {/* Body */}
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Message *</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Type */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Type</label>
              <select style={inputStyle} value={type} onChange={e => setType(e.target.value as AnnouncementType)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="feature">New Feature</option>
              </select>
            </div>

            {/* Target */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Target</label>
              <select style={inputStyle} value={target} onChange={e => setTarget(e.target.value as TargetType)}>
                <option value="all">All Churches</option>
                <option value="free">Free Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="studio">Studio Plan</option>
              </select>
            </div>
          </div>

          {/* Schedule toggle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: scheduleMode ? '10px' : 0 }}>
              <label style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div
                  onClick={() => setScheduleMode(p => !p)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: scheduleMode ? '#a78bfa' : 'rgba(107,114,128,0.3)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: scheduleMode ? '16px' : '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
                <span onClick={() => setScheduleMode(p => !p)} style={{ cursor: 'pointer' }}>
                  Schedule for later
                </span>
              </label>
            </div>

            {scheduleMode && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: sending ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'flex-start',
              boxShadow: sending ? 'none' : '0 4px 20px rgba(167,139,250,0.3)',
            }}
          >
            {sending ? (
              <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending...</>
            ) : scheduleMode ? (
              <><Clock size={16} /> Schedule Announcement</>
            ) : (
              <><Send size={16} /> Send Announcement</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Past Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'rgba(26,26,46,0.9)',
          border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: '16px',
          padding: '28px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
          Past Announcements
        </h3>

        {loadingAnnouncements ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '64px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px 0' }}>No announcements yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 2fr 120px 100px 100px', gap: '12px', padding: '8px 12px', borderBottom: '1px solid rgba(167,139,250,0.08)', marginBottom: '4px' }}>
              {['Type', 'Title', 'Message', 'Target', 'Status', 'Sent'].map(h => (
                <span key={h} style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  {h}
                </span>
              ))}
            </div>

            {announcements.map(ann => {
              const tc = typeConfig[ann.type] ?? typeConfig.info
              const sc = statusConfig[ann.status] ?? statusConfig.draft
              const TypeIcon = tc.icon
              const StatusIcon = ann.status === 'sent' ? CheckCircle : ann.status === 'scheduled' ? Clock : Info

              return (
                <div
                  key={ann.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 2fr 120px 100px 100px',
                    gap: '12px',
                    padding: '12px 12px',
                    borderRadius: '8px',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: tc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TypeIcon size={16} color={tc.color} />
                  </div>

                  {/* Title */}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ann.title}
                  </span>

                  {/* Body preview */}
                  <span style={{ fontSize: '13px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ann.body}
                  </span>

                  {/* Target */}
                  <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                    {ann.target === 'all' ? 'All Churches' : `${ann.target.charAt(0).toUpperCase() + ann.target.slice(1)} Plan`}
                  </span>

                  {/* Status badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: sc.bg,
                      color: sc.color,
                      fontWeight: 600,
                      width: 'fit-content',
                    }}
                  >
                    <StatusIcon size={11} />
                    {ann.status.charAt(0).toUpperCase() + ann.status.slice(1)}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {timeAgo(ann.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </DashboardLayout>
  )
}
