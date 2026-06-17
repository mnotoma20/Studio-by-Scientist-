'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINES = [
  { text: 'And we know that all things work together for good...', scripture: null, delay: 0 },
  { text: '...to them that love God, to them who are the called', scripture: null, delay: 800 },
  { text: 'according to his purpose. Romans 8:28.', scripture: { ref: 'Romans 8:28', verse: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }, delay: 1600 },
  { text: '', scripture: null, delay: 3200 },
  { text: 'Now the Lord said, I am the way, the truth, and the life.', scripture: null, delay: 4000 },
  { text: 'No man cometh unto the Father, but by me.', scripture: { ref: 'John 14:6', verse: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.' }, delay: 4800 },
  { text: '', scripture: null, delay: 6400 },
  { text: 'Think about what David said when he stood before Goliath...', scripture: null, delay: 7200 },
  { text: '"I come to thee in the name of the LORD of hosts"', scripture: { ref: '1 Samuel 17:45', verse: 'Then said David to the Philistine, Thou comest to me with a sword, and with a spear, and with a shield: but I come to thee in the name of the LORD of hosts...' }, delay: 8000 },
]

interface VerseCard {
  ref: string
  verse: string
  id: number
}

export default function AnimatedTranscript({ active }: { active: boolean }) {
  const [visibleLines, setVisibleLines] = useState<typeof LINES>([])
  const [verseCard, setVerseCard] = useState<VerseCard | null>(null)
  const [cardId, setCardId] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true

    LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        if (line.scripture) {
          setCardId(id => id + 1)
          setVerseCard({ ...line.scripture, id: cardId + 1 })
          setTimeout(() => setVerseCard(null), 3000)
        }
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, line.delay)
    })

    // Loop after all done
    const totalTime = LINES[LINES.length - 1].delay + 4000
    setTimeout(() => {
      setVisibleLines([])
      started.current = false
    }, totalTime)
  }, [active, cardId])

  return (
    <div className="relative">
      <div ref={containerRef}
        className="h-80 overflow-hidden rounded-xl p-5 space-y-2 relative"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest" style={{ color: '#ec4899' }}>LIVE TRANSCRIPTION</span>
        </div>

        {/* Fade top mask */}
        <div className="absolute top-12 left-0 right-0 h-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(13,13,24,0.8), transparent)' }} />

        {/* Lines */}
        {visibleLines.map((line, i) => {
          if (!line.text) return <div key={i} className="h-2" />
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`text-sm leading-relaxed px-1 rounded ${line.scripture ? 'font-semibold' : ''}`}
              style={{
                color: line.scripture ? '#c4b5fd' : '#9ca3af',
                background: line.scripture ? 'rgba(167,139,250,0.08)' : 'transparent',
                padding: line.scripture ? '2px 6px' : '0',
              }}>
              {line.text}
              {line.scripture && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                  → {line.scripture.ref}
                </span>
              )}
            </motion.div>
          )
        })}

        {/* Cursor */}
        <span className="inline-block w-0.5 h-4 bg-purple-400 cursor-blink" />
      </div>

      {/* Verse card popup */}
      <AnimatePresence>
        {verseCard && (
          <motion.div
            key={verseCard.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute -right-2 top-4 w-56 p-4 rounded-xl z-20"
            style={{
              background: 'rgba(13,13,24,0.97)',
              border: '1px solid rgba(167,139,250,0.4)',
              boxShadow: '0 0 30px rgba(167,139,250,0.2)',
            }}>
            <div className="text-xs font-bold tracking-widest mb-2" style={{ color: '#FFD700' }}>
              {verseCard.ref}
            </div>
            <p className="text-xs leading-relaxed text-white/80" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>
              "{verseCard.verse.slice(0, 80)}..."
            </p>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: '#6b7280' }}>Displayed on screen</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
