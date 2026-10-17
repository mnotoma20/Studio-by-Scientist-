'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import ParticleBackground from '@/components/ParticleBackground'

export default function BillingSuccessPage() {
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={40} color="#fff" strokeWidth={2.5} />
        </motion.div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 10px' }}>You're upgraded!</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Your subscription is active. Head back to Studio by Scientist — your new plan will unlock automatically within a minute.
        </p>
        <div style={{ fontSize: 12, color: '#6b7280' }}>You can close this tab now.</div>
      </motion.div>
    </div>
  )
}
