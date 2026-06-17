'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const VERSE_TEXT = 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
const VERSE_REF = 'JOHN 3:16 · KJV'

function useCountUp(target: number | string, inView: boolean) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!inView || done || typeof target !== 'number') return
    setDone(true)
    let start = 0
    const duration = 1800
    const step = 16
    const increment = target / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, target, done])

  return count
}

function StatCard({ value, label, suffix = '', inView }: { value: number | string; label: string; suffix?: string; inView: boolean }) {
  const num = useCountUp(typeof value === 'number' ? value : 0, inView)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center p-8 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="font-playfair text-5xl font-bold gradient-text mb-3"
        style={{ fontFamily: 'Playfair Display, serif' }}>
        {typeof value === 'string' ? value : num.toLocaleString()}{suffix}
      </span>
      <span className="text-sm font-medium tracking-wide" style={{ color: '#6b7280' }}>{label}</span>
    </motion.div>
  )
}

export default function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [typed, setTyped] = useState('')
  const [refTyped, setRefTyped] = useState('')
  const [verseStarted, setVerseStarted] = useState(false)

  useEffect(() => {
    if (!inView || verseStarted) return
    setVerseStarted(true)
    let i = 0
    const timer = setInterval(() => {
      i++
      setTyped(VERSE_TEXT.slice(0, i))
      if (i >= VERSE_TEXT.length) {
        clearInterval(timer)
        let j = 0
        const refTimer = setInterval(() => {
          j++
          setRefTyped(VERSE_REF.slice(0, j))
          if (j >= VERSE_REF.length) clearInterval(refTimer)
        }, 40)
      }
    }, 18)
    return () => clearInterval(timer)
  }, [inView, verseStarted])

  return (
    <section id="showcase" className="py-32 px-6 relative overflow-hidden" ref={ref}>
      {/* Subtle bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#a78bfa' }}>
            Live Demo
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            See It In Action
          </h2>
        </motion.div>

        {/* MacBook Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mb-20"
          style={{ maxWidth: '900px' }}>

          {/* MacBook shell */}
          <div className="relative rounded-t-[18px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
              padding: '10px 10px 0',
              boxShadow: '0 0 80px rgba(167,139,250,0.15), 0 40px 120px rgba(0,0,0,0.8)',
            }}>
            {/* Camera dot */}
            <div className="flex justify-center mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#333' }} />
            </div>

            {/* Screen */}
            <div className="rounded-t-[8px] overflow-hidden" style={{ background: '#0d0d18', minHeight: '400px' }}>
              <div className="flex h-full" style={{ minHeight: '400px' }}>

                {/* Left — Control panel */}
                <div className="w-1/2 p-4 border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="ml-3 text-xs font-bold tracking-widest" style={{ color: '#a78bfa' }}>STUDIO CONTROL</span>
                  </div>

                  {/* Schedule items */}
                  {['📖 John 3:16', '🎵 Amazing Grace', '🙏 Opening Prayer', '📖 Psalm 23:1'].map((item, i) => (
                    <div key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5 text-xs"
                      style={{
                        background: i === 0 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                        border: i === 0 ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        color: i === 0 ? '#c4b5fd' : '#6b7280',
                      }}>
                      {item}
                      {i === 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>LIVE</span>}
                    </div>
                  ))}

                  {/* AI indicator */}
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                      <span className="text-xs font-semibold" style={{ color: '#ec4899' }}>AI LISTENING</span>
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280' }}>"...for God so loved the world..."</p>
                    <p className="text-xs mt-1 font-semibold" style={{ color: '#a78bfa' }}>→ John 3:16 detected</p>
                  </div>
                </div>

                {/* Right — Projector preview */}
                <div className="w-1/2 flex flex-col items-center justify-center p-8 text-center"
                  style={{ background: 'linear-gradient(180deg, #06060f 0%, #0a0a1a 100%)' }}>
                  <div className="text-xs font-bold tracking-widest mb-6 px-3 py-1 rounded-full"
                    style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.05)' }}>
                    JOHN 3:16 · KJV
                  </div>
                  <p className="leading-relaxed text-white font-bold"
                    style={{ fontFamily: 'Playfair Display, serif', fontSize: '13px', lineHeight: 1.6 }}>
                    {typed}<span className="cursor-blink opacity-70">|</span>
                  </p>
                  {refTyped && (
                    <div className="mt-4 text-xs tracking-widest font-semibold"
                      style={{ color: '#FFD700' }}>
                      — {refTyped}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MacBook base */}
          <div className="h-4 rounded-b-sm mx-4"
            style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #252525 100%)' }} />
          <div className="h-1.5 rounded-b-xl mx-0"
            style={{ background: 'linear-gradient(180deg, #333 0%, #222 100%)' }} />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard value={66} label="Books Supported" suffix="" inView={inView} />
          <StatCard value={31102} label="Verses in Library" suffix="" inView={inView} />
          <StatCard value={'∞'} label="Stories Recognized" suffix="" inView={inView} />
        </div>
      </div>
    </section>
  )
}
