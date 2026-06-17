'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  trend?: number
  color?: 'purple' | 'pink' | 'green' | 'blue'
  loading?: boolean
}

const colorMap = {
  purple: {
    bg: 'rgba(167,139,250,0.15)',
    icon: '#a78bfa',
    border: 'rgba(167,139,250,0.3)',
    glow: 'rgba(167,139,250,0.2)',
  },
  pink: {
    bg: 'rgba(236,72,153,0.15)',
    icon: '#ec4899',
    border: 'rgba(236,72,153,0.3)',
    glow: 'rgba(236,72,153,0.2)',
  },
  green: {
    bg: 'rgba(16,185,129,0.15)',
    icon: '#10b981',
    border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.2)',
  },
  blue: {
    bg: 'rgba(59,130,246,0.15)',
    icon: '#3b82f6',
    border: 'rgba(59,130,246,0.3)',
    glow: 'rgba(59,130,246,0.2)',
  },
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'purple',
  loading = false,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number>(0)
  const colors = colorMap[color]

  useEffect(() => {
    if (loading) return
    const start = performance.now()
    const duration = 1200

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * value))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, loading])

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${colors.glow}` }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(26,26,46,0.9)',
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: 'default',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} color={colors.icon} />
        </div>

        {trend !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: trend >= 0 ? '#10b981' : '#ef4444',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '32px', width: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '14px', width: '120px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {displayValue.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px' }}>{label}</div>
          </>
        )}
      </div>
    </motion.div>
  )
}
