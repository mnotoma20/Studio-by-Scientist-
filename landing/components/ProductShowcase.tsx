'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

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
            The real app
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            See It In Action
          </h2>
        </motion.div>

        {/* Real recording of the app: the sermon is heard, the verse is found and shown */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mb-20"
          style={{ maxWidth: '1100px' }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(167,139,250,0.25)', background: '#0a0a14', boxShadow: '0 0 80px rgba(167,139,250,0.15), 0 30px 90px rgba(0,0,0,0.7)' }}>
            <video
              src="/demo/live.mp4"
              poster="/demo/live-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-auto block"
            />
          </div>
          <p className="text-center text-xs mt-4" style={{ color: '#4b5563' }}>
            A real recording of Studio. As the sermon is heard, the verse is found and shown. Sample sermon.
          </p>
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
