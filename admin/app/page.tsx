'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import ParticleBackground from '@/components/ParticleBackground'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Signing in...')
  const [error, setError] = useState('')

  // Prefetch dashboard so navigation is instant after login
  useEffect(() => { router.prefetch('/dashboard') }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLoadingMsg('Signing in...')

    try {
      const supabase = createClient()

      // Fire auth + admin check in parallel once we have the user id
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Authentication failed.')
        setLoading(false)
        return
      }

      setLoadingMsg('Checking access...')

      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .single()

      if (churchError) {
        await supabase.auth.signOut()
        setError(`DB error: ${churchError.message}`)
        setLoading(false)
        return
      }

      if (!church) {
        await supabase.auth.signOut()
        setError('No church record found for this account.')
        setLoading(false)
        return
      }

      if (!church.is_admin) {
        await supabase.auth.signOut()
        setError('Access denied — is_admin is not set. Run the SQL in Supabase.')
        setLoading(false)
        return
      }

      setLoadingMsg('Opening dashboard...')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ParticleBackground />

      {/* Glow blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            background: 'rgba(26,26,46,0.92)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '24px',
                color: '#fff',
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(167,139,250,0.3)',
              }}
            >
              S
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 6px',
                letterSpacing: '-0.5px',
              }}
            >
              Studio by Scientist
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Admin Panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@studio.com"
                required
                style={{
                  width: '100%',
                  background: 'rgba(15,15,30,0.8)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15,15,30,0.8)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '10px',
                    padding: '12px 44px 12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: loading ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg, #a78bfa, #ec4899)',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                marginTop: '4px',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(167,139,250,0.3)',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  {loadingMsg}
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in as Admin
                </>
              )}

            </motion.button>
          </form>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
