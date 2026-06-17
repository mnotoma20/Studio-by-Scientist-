'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Music,
  Building2,
  BarChart2,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Music, label: 'Songs', href: '/songs' },
  { icon: Building2, label: 'Churches', href: '/churches' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
  { icon: Megaphone, label: 'Announcements', href: '/announcements' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        height: '100vh',
        background: 'rgba(12,12,24,0.98)',
        borderRight: '1px solid rgba(167,139,250,0.15)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(167,139,250,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '72px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          S
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                fontSize: '15px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Studio Admin
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: isActive ? 'rgba(167,139,250,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
                color: isActive ? '#a78bfa' : '#9ca3af',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(167,139,250,0.08)'
                  el.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'transparent'
                  el.style.color = '#9ca3af'
                }
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(167,139,250,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* User info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Admin</div>
                <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                  studio@scientist.com
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid transparent',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'rgba(239,68,68,0.1)'
            el.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'transparent'
            el.style.color = '#6b7280'
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ fontSize: '14px' }}
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.15)',
            color: '#a78bfa',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.15)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.08)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.div>
  )
}
