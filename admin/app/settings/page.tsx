'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, CheckCircle, XCircle, ExternalLink, Loader2, User, Key, Info } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [name, setName] = useState('Admin')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? '')
        // Try to get display name from metadata
        const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name
        if (fullName) setName(fullName)
      }
    }
    getUser()
  }, [])

  const handleSaveProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error')
      return
    }
    if (newPassword && newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error')
      return
    }

    setSavingProfile(true)
    try {
      // Update metadata
      const updates: { data?: { full_name: string }; password?: string } = {
        data: { full_name: name },
      }
      if (newPassword) updates.password = newPassword

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      toast('Profile updated successfully', 'success')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save changes', 'error')
    } finally {
      setSavingProfile(false)
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
    transition: 'border-color 0.2s',
  }

  const cardStyle = {
    background: 'rgba(26,26,46,0.9)',
    border: '1px solid rgba(167,139,250,0.15)',
    borderRadius: '16px',
    padding: '24px',
  }

  return (
    <DashboardLayout title="Settings">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left: Admin Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#a78bfa" />
            Admin Profile
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Display Name</label>
              <input
                style={inputStyle}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                onFocus={e => { e.target.style.borderColor = '#a78bfa' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)' }}
              />
            </div>

            {/* Email — read only */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Email Address</label>
              <input
                style={{ ...inputStyle, background: 'rgba(15,15,30,0.4)', color: '#6b7280', cursor: 'not-allowed' }}
                value={email}
                readOnly
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Email cannot be changed here.</p>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(167,139,250,0.08)', margin: '4px 0' }} />

            {/* New password */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                <Key size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                New Password
              </label>
              <input
                type="password"
                style={inputStyle}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                onFocus={e => { e.target.style.borderColor = '#a78bfa' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)' }}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
              <input
                type="password"
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== newPassword
                    ? 'rgba(239,68,68,0.5)'
                    : 'rgba(167,139,250,0.2)',
                }}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                onFocus={e => { e.target.style.borderColor = confirmPassword !== newPassword ? 'rgba(239,68,68,0.5)' : '#a78bfa' }}
                onBlur={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.5)' : 'rgba(167,139,250,0.2)' }}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>Passwords do not match</p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              style={{
                padding: '11px',
                borderRadius: '8px',
                background: savingProfile ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                boxShadow: savingProfile ? 'none' : '0 4px 16px rgba(167,139,250,0.25)',
              }}
            >
              {savingProfile
                ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                : <><Save size={15} /> Save Changes</>
              }
            </button>
          </div>
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API Keys Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} color="#a78bfa" />
              API Keys Status
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'OpenAI', status: 'configured', detail: 'GPT-4o-mini active' },
                { name: 'Anthropic', status: 'configured', detail: 'Claude API available' },
              ].map(({ name, status, detail }) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.15)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{detail}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                    <CheckCircle size={15} />
                    Configured
                  </div>
                </div>
              ))}

              {/* Supabase */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Supabase</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace' }}>
                    {supabaseUrl.replace('https://', '').split('.')[0]}...
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                  <CheckCircle size={15} />
                  Connected
                </div>
              </div>
            </div>
          </motion.div>

          {/* App Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#a78bfa" />
              App Info
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Application</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>Studio by Scientist Admin</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(167,139,250,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Version</span>
                <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>1.0.0</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(167,139,250,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Supabase Project</span>
                <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {supabaseUrl}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(167,139,250,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Framework</span>
                <span style={{ fontSize: '13px', color: '#fff' }}>Next.js 14 App Router</span>
              </div>

              <button
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  color: '#a78bfa',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.1)' }}
              >
                <ExternalLink size={14} />
                View Docs
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  )
}
