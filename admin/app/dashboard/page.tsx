'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Building2, Crown, Music, TrendingUp, MapPin } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import StatCard from '@/components/StatCard'
import { timeAgo } from '@/lib/utils'

interface Church {
  id: string
  name: string
  location?: string
  plan?: string
  created_at: string
}

interface Song {
  id: string
  title: string
  import_count?: number
}

interface DayData {
  day: string
  count: number
}

const planBadge: Record<string, { color: string; bg: string }> = {
  free: { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' },
  pro: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  studio: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
}

function CustomLineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(26,26,46,0.98)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#fff',
      }}>
        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#a78bfa', fontWeight: 600 }}>{payload[0].value} signups</div>
      </div>
    )
  }
  return null
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(26,26,46,0.98)',
        border: '1px solid rgba(236,72,153,0.2)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#fff',
      }}>
        <div style={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}>{label}</div>
        <div style={{ color: '#ec4899', fontWeight: 600 }}>{payload[0].value} imports</div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [churches, setChurches] = useState<Church[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [signupData, setSignupData] = useState<DayData[]>([])
  const [totalSongs, setTotalSongs] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/dashboard')
      const { churches: churchData, songCount } = await res.json()

      if (churchData) {
        setChurches(churchData)
        const now = new Date()
        const days: DayData[] = []
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          const dayStr = d.toISOString().slice(0, 10)
          const count = churchData.filter((c: Church) => c.created_at?.slice(0, 10) === dayStr).length
          days.push({ day: dayStr.slice(5), count })
        }
        setSignupData(days)
      }

      setTotalSongs(songCount || 0)
      setLoading(false)
    }

    fetchData()
  }, [])

  const activeSubscriptions = churches.filter(c => c.plan && c.plan !== 'free').length
  const recentChurches = churches.slice(0, 10)

  return (
    <DashboardLayout title="Dashboard">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <StatCard icon={Building2} label="Total Churches" value={churches.length} trend={12} color="purple" loading={loading} />
        <StatCard icon={Crown} label="Active Subscriptions" value={activeSubscriptions} trend={8} color="pink" loading={loading} />
        <StatCard icon={Music} label="Songs in Library" value={totalSongs} trend={5} color="green" loading={loading} />
        <StatCard icon={TrendingUp} label="Imports This Month" value={0} trend={0} color="blue" loading={loading} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Signups chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(26,26,46,0.9)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>
            Church Signups (30 days)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.08)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top songs chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'rgba(26,26,46,0.9)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>
            Top Songs This Week
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={songs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,72,153,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="title"
                width={100}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="import_count" fill="#ec4899" radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent churches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(26,26,46,0.9)',
          border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: '14px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>
          Recent Activity
        </h3>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '52px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : recentChurches.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>No churches yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recentChurches.map(church => {
              const plan = (church.plan ?? 'free').toLowerCase()
              const badge = planBadge[plan] ?? planBadge.free
              return (
                <div
                  key={church.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.4), rgba(236,72,153,0.4))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {church.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{church.name}</div>
                    {church.location && (
                      <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={11} />
                        {church.location}
                      </div>
                    )}
                  </div>

                  {/* Plan badge */}
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 600,
                      border: `1px solid ${badge.color}40`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(church.plan ?? 'free').charAt(0).toUpperCase() + (church.plan ?? 'free').slice(1)}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>
                    {timeAgo(church.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
