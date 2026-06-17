'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import DashboardLayout from '@/components/DashboardLayout'

const COLORS = ['#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

function Card({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '14px', padding: '24px' }}
    >
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>{title}</h3>
      {children}
    </motion.div>
  )
}

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(26,26,46,0.98)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
      {label && <div style={{ color: '#9ca3af', marginBottom: '4px' }}>{label}</div>}
      {payload.map((p, i) => <div key={i} style={{ color: '#a78bfa', fontWeight: 600 }}>{p.name ? `${p.name}: ` : ''}{p.value}</div>)}
    </div>
  )
}

interface AnalyticsData {
  dailyActiveData: { day: string; count: number }[]
  featureUsage: { name: string; value: number }[]
  aiData: { day: string; count: number }[]
  topVerses: { verse: string; count: number }[]
  totals: { totalVerses: number; totalSongs: number; totalAI: number; totalSessions: number }
}

const Empty = ({ icon, text }: { icon: string; text: string }) => (
  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
    <div style={{ fontSize: 36 }}>{icon}</div>
    <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{text}</div>
  </div>
)

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const skeleton = () => <div style={{ height: 260, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />

  return (
    <DashboardLayout title="Analytics">
      {/* Totals row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Verses Displayed', value: data?.totals.totalVerses ?? '—', color: '#a78bfa' },
          { label: 'Songs Displayed', value: data?.totals.totalSongs ?? '—', color: '#ec4899' },
          { label: 'AI Detections', value: data?.totals.totalAI ?? '—', color: '#10b981' },
          { label: 'Sessions (30d)', value: data?.totals.totalSessions ?? '—', color: '#f59e0b' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <Card title="Daily Active Churches (30 days)" delay={0.05}>
          {loading ? skeleton() : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.dailyActiveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Feature Usage Breakdown" delay={0.1}>
          {loading ? skeleton() : !data?.featureUsage.length ? (
            <Empty icon="📊" text="Use the app at church to populate this" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.featureUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {data.featureUsage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <Card title="AI Bible Detections Per Day (14 days)" delay={0.15}>
          {loading ? skeleton() : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.aiData}>
                <defs>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,72,153,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} fill="url(#aiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Top Displayed Bible Verses (30 days)" delay={0.2}>
          {loading ? skeleton() : !data?.topVerses.length ? (
            <Empty icon="📖" text="Display Bible verses in the app to see them here" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topVerses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="verse" width={90} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Revenue Over Time" delay={0.25}>
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 40 }}>💰</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Connect Stripe to see revenue data</div>
        </div>
      </Card>

      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </DashboardLayout>
  )
}
