'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import AnimatedTranscript from './AnimatedTranscript'

export default function AIShowcase() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.82) 0%, rgba(7,7,15,0.55) 50%, rgba(5,5,8,0.82) 100%)' }}>

      {/* Diagonal accent line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(236,72,153,0.2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.2), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 60%)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Animated Transcript */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}>
            <AnimatedTranscript active={inView} />
          </motion.div>

          {/* Right — Copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}>

            <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: '#ec4899' }}>
              Contextual Intelligence
            </p>

            <h2 className="font-playfair font-bold text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.15 }}>
              The world's most intelligent
              <span className="block gradient-text italic">Bible presentation system.</span>
            </h2>

            <div className="space-y-4 mb-8">
              <p style={{ color: '#9ca3af', lineHeight: 1.8 }}>
                Studio doesn't just listen for "John 3:16."
                It understands <span className="text-white font-medium">context</span>. It recognizes when your pastor
                is retelling the story of David and Goliath and displays{' '}
                <span className="font-semibold" style={{ color: '#a78bfa' }}>1 Samuel 17:45</span> — at the exact moment of the confrontation.
              </p>

              <p style={{ color: '#6b7280', lineHeight: 1.8 }}>
                40+ Bible stories. Hundreds of narrative patterns.
                All recognized automatically — without the pastor saying a single verse reference.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['John 3:16 → Detected', 'David & Goliath → 1 Sam 17:45', 'Prodigal Son → Luke 15:11', 'Beatitudes → Matt 5:3'].map(tag => (
                <span key={tag}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* AI badge */}
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Powered by OpenAI Whisper + GPT-4o</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>Industry-leading speech recognition & NLP</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
