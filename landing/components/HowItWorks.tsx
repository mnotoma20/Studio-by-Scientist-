'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Mic, Zap, Monitor } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: Mic,
    title: 'Pastor Preaches',
    description: "Studio's AI listens through your sound system or microphone in real time — capturing every word as it's spoken.",
    color: '#a78bfa',
  },
  {
    num: '02',
    icon: Zap,
    title: 'Instant Detection',
    description: 'Bible references, quotes, and stories are recognized automatically — even without chapter and verse being mentioned.',
    color: '#ec4899',
  },
  {
    num: '03',
    icon: Monitor,
    title: 'Verse Appears',
    description: "The scripture displays on your projector instantly. Your congregation follows along without missing a single word.",
    color: '#f59e0b',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.82) 0%, rgba(8,8,16,0.55) 50%, rgba(5,5,8,0.82) 100%)' }}>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#ec4899' }}>
            Simple as 1-2-3
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            How It Works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px"
            style={{ background: 'linear-gradient(to right, rgba(167,139,250,0) 0%, rgba(167,139,250,0.3) 30%, rgba(236,72,153,0.3) 70%, rgba(236,72,153,0) 100%)' }} />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px origin-left"
            style={{ background: 'linear-gradient(to right, #a78bfa, #ec4899)', boxShadow: '0 0 10px rgba(167,139,250,0.5)' }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.2 + 0.3 }}
                  className="flex flex-col items-center text-center relative group">

                  {/* Big faded number */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-playfair font-black select-none pointer-events-none"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '120px',
                      lineHeight: 1,
                      background: `linear-gradient(180deg, ${step.color}15 0%, transparent 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                    {step.num}
                  </div>

                  {/* Icon circle */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`,
                      border: `1px solid ${step.color}30`,
                      boxShadow: `0 0 30px ${step.color}20`,
                    }}>
                    <Icon size={26} style={{ color: step.color }} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280', maxWidth: '280px' }}>
                    {step.description}
                  </p>

                  {/* Step dot for connecting line */}
                  <div className="hidden md:block absolute top-[60px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                    style={{ background: step.color, boxShadow: `0 0 12px ${step.color}` }} />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
