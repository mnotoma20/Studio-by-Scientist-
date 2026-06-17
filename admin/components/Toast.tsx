'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
      case 'error': return <XCircle size={18} className="text-red-400 flex-shrink-0" />
      case 'info': return <Info size={18} className="text-purple-400 flex-shrink-0" />
    }
  }

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success': return '#10b981'
      case 'error': return '#ef4444'
      case 'info': return '#a78bfa'
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
          width: '100%',
        }}
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, y: 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                background: 'rgba(26,26,46,0.98)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderLeft: `4px solid ${getBorderColor(t.type)}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {getIcon(t.type)}
              <span style={{ color: '#fff', fontSize: '14px', flex: 1 }}>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
