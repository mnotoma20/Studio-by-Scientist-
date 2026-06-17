'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote: "Before Studio, our media team was always scrambling — typing references, missing cues, stressing during the sermon. Now we just let it run. The AI catches everything. Our congregation follows along like never before.",
    name: 'Pastor Mike O.',
    church: 'Covenant Life Church',
    location: 'Houston, TX',
    initials: 'CO',
    color: '#a78bfa',
  },
  {
    quote: "We run three services every Sunday with a skeleton crew. Studio by Scientist turned our one-man media team into a full production department. The AI voice detection is genuinely miraculous. I cannot overstate how much time this saves.",
    name: 'Brother Emmanuel K.',
    church: 'Christ Embassy Lagos',
    location: 'Lagos, Nigeria',
    initials: 'CE',
    color: '#ec4899',
  },
  {
    quote: "The moment it detected 'David and Goliath' and put up 1 Samuel 17:45 without the pastor saying chapter or verse — I knew this was different. This is not just software. This is technology built by people who understand the church.",
    name: 'Elder Grace M.',
    church: 'Redeemed House',
    location: 'London, UK',
    initials: 'RH',
    color: '#f59e0b',
  },
]

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-32 px-6 relative noise-bg overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050508 0%, #0a0a14 50%, #050508 100%)' }}>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.15), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(236,72,153,0.15), transparent)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#a78bfa' }}>
            Testimonials
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Trusted by media teams<br />
            <span className="italic" style={{ color: '#9ca3af' }}>who take the Word seriously.</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.church}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative p-8 rounded-2xl cursor-default transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ border: `1px solid ${t.color}25`, boxShadow: `0 0 30px ${t.color}10` }} />

              {/* Quote mark */}
              <div className="text-6xl font-serif leading-none mb-4" style={{ color: `${t.color}30` }}>"</div>

              <p className="text-base leading-relaxed mb-8 font-light italic"
                style={{ color: '#d1d5db', fontFamily: 'Playfair Display, serif' }}>
                {t.quote}
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}80)` }}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>{t.church} · {t.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
