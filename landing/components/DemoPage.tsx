'use client'

import { useEffect, useState } from 'react'
import ScreenshotGallery from './ScreenshotGallery'
import ProjectorGallery from './ProjectorGallery'

// Personal demo page for one church. Opening it (and pressing its buttons) is recorded by the admin
// server so we can see which churches looked. Only the link is recorded, nothing about the visitor.
const API = 'https://admin-neon-three-38.vercel.app/api/demo/view'

const FEATURES = [
  { title: 'Listens to the preacher', body: 'The verse appears on the screen as it is read, and Studio follows the passage as the preacher moves through it. No typing, no delay.' },
  { title: 'Phone remote', body: 'Scan a QR code and any phone can go next or back, blank the screen, show the logo, or type in a verse. The phone can do the listening too.' },
  { title: 'Service recap', body: 'After the service, Studio writes up a summary of the message to keep or share.' },
  { title: 'Sermon library', body: 'Every message saved by series and month, with its scriptures, notes and recap.' },
  { title: 'Bibles that work offline', body: 'KJV and other translations are built in, so the screen never depends on church Wi-Fi.' },
  { title: 'Songs, videos and themes', body: 'Lyrics straight to the screen, videos on the projector, and still or moving backgrounds for Bible and song screens.' },
]

function track(slug: string, kind: 'view' | 'click', detail?: string) {
  return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, kind, detail }), keepalive: true })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
}

export default function DemoPage({ slug }: { slug: string }) {
  const [church, setChurch] = useState<string | null>(null)
  const [hasVideo, setHasVideo] = useState(false)

  useEffect(() => {
    track(slug, 'view').then((d) => { if (d && d.church_name) setChurch(d.church_name) })
    // Show the video only once /demo.mp4 has actually been added to the site
    fetch('/demo.mp4', { method: 'HEAD' }).then((r) => { if (r.ok && (r.headers.get('content-type') || '').startsWith('video')) setHasVideo(true) }).catch(() => {})
  }, [slug])

  return (
    <main className="min-h-screen bg-bg text-white font-inter" style={{ background: 'radial-gradient(ellipse at top, rgba(167,139,250,0.14), transparent 60%), #050508' }}>
      <div className="max-w-5xl mx-auto px-6 py-14 md:py-20">
        <img src="/logo.png" alt="Studio by Scientist" width={44} height={44} className="mb-10" />

        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#a78bfa' }}>
          {church ? `Prepared for ${church}` : 'Studio by Scientist'}
        </p>
        <h1 className="font-bold mb-5 max-w-3xl" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.1 }}>
          The screen runs itself while your team worships.
        </h1>
        <p className="text-lg mb-10 max-w-3xl" style={{ color: '#9ca3af', lineHeight: 1.6 }}>
          Studio is church presentation software that listens to the preacher and puts the Scripture on the screen as it is read.
        </p>

        <div className="mb-14"><ProjectorGallery /></div>
        <div className="mb-14"><p className="text-xs font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: '#a78bfa' }}>What your team sees</p><ScreenshotGallery heading={false} /></div>

        {hasVideo && (
          <video
            src="/demo.mp4"
            controls
            playsInline
            preload="metadata"
            onError={() => setHasVideo(false)}
            onPlay={() => track(slug, 'click', 'video')}
            className="w-full max-w-3xl rounded-2xl mb-12"
            style={{ border: '1px solid rgba(167,139,250,0.25)', background: '#0d0d18' }}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl p-5" style={{ background: '#0d0d18', border: '1px solid rgba(167,139,250,0.15)' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#fff' }}>{f.title}</h3>
              <p className="text-sm" style={{ color: '#9ca3af', lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 md:p-8 text-center max-w-3xl mx-auto" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.14), rgba(236,72,153,0.1))', border: '1px solid rgba(167,139,250,0.25)' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>See it in your own service</h2>
          <p className="mb-6" style={{ color: '#d1d5db' }}>Message us and we will show you Studio in a short demo, online or in person.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://instagram.com/studiobyscientist"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(slug, 'click', 'contact')}
              className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}
            >
              Book a quick demo
            </a>
            <a
              href="/#download"
              onClick={() => track(slug, 'click', 'download')}
              className="px-6 py-3 rounded-xl font-semibold"
              style={{ border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}
            >
              Download Studio
            </a>
          </div>
        </div>

        <p className="text-center text-xs mt-10" style={{ color: '#6b7280' }}>Studio by Scientist · studiobyscientist.com</p>
      </div>
    </main>
  )
}
