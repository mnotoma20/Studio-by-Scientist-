'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { ToastProvider } from './Toast'

interface DashboardLayoutProps {
  title: string
  children: React.ReactNode
}

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setCollapsed(stored === 'true')
    }
  }, [])

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const sidebarWidth = collapsed ? 64 : 240

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        <div
          style={{
            flex: 1,
            marginLeft: sidebarWidth,
            transition: 'margin-left 0.3s ease',
            minWidth: 0,
          }}
        >
          <TopBar title={title} collapsed={collapsed} />
          <main
            style={{
              paddingTop: '64px',
              minHeight: '100vh',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{ padding: '32px' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
