'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import ChurchCard, { type Church } from '@/components/ChurchCard'
import SlideOutPanel from '@/components/SlideOutPanel'
import { createClient } from '@/lib/supabase'

const PLAN_FILTERS = ['All', 'Free', 'Pro', 'Studio']

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All')
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const fetchChurches = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('churches')
        .select('id, name, location, pastor, plan, created_at, email')
        .order('created_at', { ascending: false })

      if (data) setChurches(data)
      setLoading(false)
    }
    fetchChurches()
  }, [])

  const filtered = churches.filter(c => {
    const matchesSearch =
      search.trim() === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.location ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesPlan =
      planFilter === 'All' ||
      (c.plan ?? 'free').toLowerCase() === planFilter.toLowerCase()

    return matchesSearch && matchesPlan
  })

  const openPanel = (church: Church) => {
    setSelectedChurch(church)
    setPanelOpen(true)
  }

  return (
    <DashboardLayout title="Churches">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search churches..."
              style={{
                width: '100%',
                background: 'rgba(26,26,46,0.9)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '10px',
                padding: '10px 14px 10px 36px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#a78bfa' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)' }}
            />
          </div>

          {/* Plan filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {PLAN_FILTERS.map(plan => (
              <button
                key={plan}
                onClick={() => setPlanFilter(plan)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: planFilter === plan ? '1px solid #a78bfa' : '1px solid rgba(167,139,250,0.15)',
                  background: planFilter === plan ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: planFilter === plan ? '#a78bfa' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: planFilter === plan ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {plan}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
            {filtered.length} church{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '200px',
                  borderRadius: '14px',
                  background: 'rgba(26,26,46,0.5)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <p>No churches found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map(church => (
              <ChurchCard key={church.id} church={church} onClick={() => openPanel(church)} />
            ))}
          </div>
        )}
      </motion.div>

      <SlideOutPanel open={panelOpen} onClose={() => setPanelOpen(false)} church={selectedChurch} />

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </DashboardLayout>
  )
}
