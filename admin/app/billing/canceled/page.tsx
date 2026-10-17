'use client'

import { motion } from 'framer-motion'
import { XCircle } from 'lucide-react'
import ParticleBackground from '@/components/ParticleBackground'

export default function BillingCanceledPage() {
  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <ParticleBackground />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 1, textAlign: 'center', padding: '48px 40px',
          background: 'rgba(26,26,46,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20,
          maxWidth: 420, boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(107,114,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <XCircle size={40} color="#9ca3af" strokeWidth={2.5} />
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 10px' }}>Checkout canceled</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          No charge was made. Head back to Studio by Scientist whenever you're ready to upgrade.
        </p>
        <div style={{ fontSize: 12, color: '#6b7280' }}>You can close this tab now.</div>
      </motion.div>
    </div>
  )
}
