'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'

const TYPEWRITER_WORDS = ['Powered by AI', 'Effortlessly', 'In Real Time', 'Automatically']

const CHURCHES = [
  'Grace Community', 'The Redeemed', 'Living Faith', 'Christ Embassy',
  'Hillsong', 'Elevation', 'Covenant Church', 'House of Prayer',
  'Victory Outreach', 'New Covenant', 'Faith Alive', 'The Sanctuary',
]

function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [display, setDisplay] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const timeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const current = words[wordIndex]
    if (!deleting && display === current) {
      timeout.current = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && display === '') {
      setDeleting(false)
      setWordIndex(i => (i + 1) % words.length)
    } else {
      timeout.current = setTimeout(() => {
        setDisplay(prev => deleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1))
      }, deleting ? speed / 2 : speed)
    }
    return () => clearTimeout(timeout.current)
  }, [display, deleting, wordIndex, words, speed, pause])

  return display
}

export default function Hero() {
  const typed = useTypewriter(TYPEWRITER_WORDS)

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Radial glow centers — the living particle field itself is now global (see page.tsx) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full min-w-0">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              border: '1px solid rgba(167,139,250,0.4)',
              background: 'rgba(167,139,250,0.08)',
              color: '#c4b5fd',
              boxShadow: '0 0 20px rgba(167,139,250,0.15)',
            }}>
            <Sparkles size={10} className="text-purple-400" />
            AI-Powered Church Presentation
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}>
          <h1 className="font-playfair leading-[1.08] tracking-tight mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            <span className="block text-white"
              style={{ fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 800 }}>
              Bring Scripture to Life,
            </span>
            <span className="block italic mt-2" style={{ fontSize: 'clamp(44px, 6.5vw, 88px)', fontWeight: 700 }}>
              <span className="gradient-text">{typed}</span>
              <span className="cursor-blink gradient-text">|</span>
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl"
          style={{ color: '#9ca3af', fontWeight: 300 }}>
          Studio listens as your pastor preaches.<br />
          <span className="text-white/80 font-medium">Bible verses appear on screen — automatically.</span><br />
          No typing. No delays. Just the Word.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <a href="#download"
            className="btn-gradient relative inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white overflow-hidden shadow-2xl">
            <span className="relative z-10">Download Free</span>
            <span className="relative z-10 text-white/70 text-sm">— no credit card</span>
          </a>
          <a href="#showcase"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb' }}>
            <span>Watch Demo</span>
            <span className="text-lg">→</span>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="mt-16 w-full max-w-3xl">
          <p className="text-xs font-medium tracking-widest uppercase mb-6"
            style={{ color: '#4b5563' }}>
            Trusted by churches in Houston, Lagos, London and beyond
          </p>
          <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              {[...CHURCHES, ...CHURCHES].map((name, i) => (
                <div key={i} className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: 'white' }}>
                    {name[0]}
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#6b7280' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: '#374151' }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown size={18} style={{ color: '#4b5563' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
