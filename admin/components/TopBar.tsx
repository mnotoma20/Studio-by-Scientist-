'use client'

import { Bell, Search } from 'lucide-react'

interface TopBarProps {
  title: string
  collapsed: boolean
}

export default function TopBar({ title, collapsed }: TopBarProps) {
  const sidebarWidth = collapsed ? 64 : 240

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: sidebarWidth,
        right: 0,
        height: '64px',
        background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid rgba(167,139,250,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 90,
        backdropFilter: 'blur(10px)',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Left: Page title */}
      <h1
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#fff',
          margin: 0,
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </h1>

      {/* Center: Search */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '340px',
        }}
      >
        <div style={{ position: 'relative' }}>
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
            placeholder="Search..."
            style={{
              width: '100%',
              background: 'rgba(26,26,46,0.8)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#9ca3af',
              fontSize: '14px',
              outline: 'none',
            }}
            readOnly
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26,26,46,0.8)',
            border: '1px solid rgba(167,139,250,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
            position: 'relative',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.4)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ec4899',
            }}
          />
        </button>

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          A
        </div>
      </div>
    </div>
  )
}
