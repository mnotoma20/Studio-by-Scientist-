'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Download } from 'lucide-react'
import Image from 'next/image'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/5 backdrop-blur-xl bg-[#050508]/80'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)' }}>
              <Image src="/logo.png" alt="Studio" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-bold text-base tracking-widest text-white uppercase"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em' }}>
              STUDIO
            </span>
          </a>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm text-[#9ca3af] hover:text-white transition-colors duration-200 font-medium">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#download"
              className="btn-gradient relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Download size={14} />
                Download
              </span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(v => !v)}
            className="md:hidden text-white/70 hover:text-white p-2 rounded-lg transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 backdrop-blur-xl border-b border-white/5 md:hidden"
            style={{ background: 'rgba(5,5,8,0.96)' }}>
            <div className="px-6 py-6 flex flex-col gap-5">
              {links.map(l => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                  className="text-base font-medium text-white/80 hover:text-white transition-colors">
                  {l.label}
                </a>
              ))}
              <a href="#download" onClick={() => setOpen(false)}
                className="btn-gradient relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white mt-2 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2"><Download size={14} /> Download Free</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
