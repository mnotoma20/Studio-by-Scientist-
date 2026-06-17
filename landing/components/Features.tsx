'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mic, BookOpen, Timer, MonitorPlay, Radio, Sparkles, Layers, Calendar } from 'lucide-react'

const FEATURES = [
  {
    icon: Mic, emoji: '🎙️',
    title: 'AI Voice Detection',
    description: 'Pastor says "for God so loved the world" — Studio recognizes John 3:16 and displays it. No reference needed. Understands quotes, paraphrases, and full Bible story narrations.',
    span: 'lg:col-span-2',
    color: '#a78bfa',
    size: 'large',
  },
  {
    icon: BookOpen, emoji: '📖',
    title: '66 Books. Every Verse.',
    description: 'Complete KJV Bible library built in. Always offline. Always instant.',
    span: 'lg:col-span-1',
    color: '#ec4899',
    size: 'small',
  },
  {
    icon: Timer, emoji: '⏱️',
    title: 'Prayer Timer',
    description: 'Countdown displayed on the projector so speakers know their time.',
    span: 'lg:col-span-1',
    color: '#f59e0b',
    size: 'small',
  },
  {
    icon: MonitorPlay, emoji: '🎭',
    title: 'Stage Monitor',
    description: "Pastors see the current verse, what's coming next, and the real clock — on their own screen. Congregation sees only the content.",
    span: 'lg:col-span-1',
    color: '#34d399',
    size: 'medium',
  },
  {
    icon: Radio, emoji: '📡',
    title: 'NDI Streaming',
    description: 'Feed directly into vMix, OBS, or Wirecast over your local network. No HDMI cables needed.',
    span: 'lg:col-span-1',
    color: '#60a5fa',
    size: 'medium',
  },
  {
    icon: Sparkles, emoji: '✨',
    title: 'AI Sermon Notes',
    description: 'Upload your monthly teaching document. Claude extracts this week\'s points, scriptures, and key insights — displayed as slides or lower-thirds in seconds.',
    span: 'lg:col-span-2',
    color: '#f472b6',
    size: 'large',
  },
  {
    icon: Layers, emoji: '🖥️',
    title: 'Multi-Screen',
    description: 'Up to 4 independent output screens, each with its own content profile.',
    span: 'lg:col-span-1',
    color: '#a78bfa',
    size: 'small',
  },
  {
    icon: Calendar, emoji: '📅',
    title: 'Service Schedule',
    description: 'Build your full service order. Navigate with keyboard shortcuts.',
    span: 'lg:col-span-1',
    color: '#ec4899',
    size: 'small',
  },
]

export default function Features() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)' }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#a78bfa' }}>
            Built for Sunday
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Everything your media team needs.
          </h2>
          <p className="text-xl font-light" style={{ color: '#6b7280' }}>Nothing they don't.</p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            const isLarge = f.size === 'large'
            const isMedium = f.size === 'medium'

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                whileHover={{ scale: 1.02, y: -3 }}
                className={`group relative rounded-2xl p-6 cursor-default transition-all duration-300 ${f.span} ${
                  isLarge ? 'md:col-span-2' : ''
                }`}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  minHeight: isLarge ? '180px' : isMedium ? '160px' : '140px',
                }}>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 30px ${f.color}08, 0 0 30px ${f.color}10` }} />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ border: `1px solid ${f.color}25` }} />

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}20` }}>
                  <Icon size={18} style={{ color: f.color }} />
                </div>

                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{f.description}</p>

                {/* Large card extra — feature highlight line */}
                {isLarge && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-px flex-1"
                      style={{ background: `linear-gradient(to right, ${f.color}40, transparent)` }} />
                    <span className="text-xs font-semibold tracking-widest" style={{ color: f.color }}>
                      POWERED BY AI
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
