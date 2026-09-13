'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// Fixed, version-free filenames published by .github/workflows/build-release.yml onto a
// rolling "latest" GitHub Release — every push to main overwrites what's behind these
// links, so they never need to change here on a version bump.
const RELEASES_BASE = 'https://github.com/mnotoma20/Studio-by-Scientist-/releases/latest/download'
const DOWNLOAD_URLS = {
  mac: `${RELEASES_BASE}/StudioByScientist-Mac-AppleSilicon.dmg`,
  macIntel: `${RELEASES_BASE}/StudioByScientist-Mac-Intel.dmg`,
  windows: `${RELEASES_BASE}/StudioByScientist-Windows-Setup.exe`,
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3 12V6.75l6-1.32v6.48L3 12m17-9v8.75l-10 .15V5.21L20 3M3 13l6 .09v6.81l-6-1.15V13m17 .25V22l-10-1.91V13.1L20 13.25z" />
    </svg>
  )
}

export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="download" ref={ref} className="py-40 px-6 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.12) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.2), transparent)' }} />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: '#a78bfa' }}>
          Get Started Today
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-playfair font-bold text-white mb-6"
          style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1.1 }}>
          Your congregation deserves<br />
          <span className="italic gradient-text">to follow every word.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg mb-12 max-w-xl mx-auto"
          style={{ color: '#6b7280', lineHeight: 1.8 }}>
          Join hundreds of churches already using Studio by Scientist.<br />
          Free to start. No credit card required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">

          <a href={DOWNLOAD_URLS.mac} target="_blank" rel="noopener noreferrer"
            className="btn-gradient relative inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-semibold text-white overflow-hidden shadow-2xl group">
            <span className="relative z-10 flex items-center gap-3">
              <AppleIcon />
              Download for Mac
            </span>
          </a>

          <a href={DOWNLOAD_URLS.windows} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-medium text-white transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <WindowsIcon />
            Download for Windows
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-xs" style={{ color: '#374151' }}>
          Intel Mac? <a href={DOWNLOAD_URLS.macIntel} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Download here</a> · Auto-updates built in · Free forever plan available
        </motion.p>
      </div>
    </section>
  )
}
