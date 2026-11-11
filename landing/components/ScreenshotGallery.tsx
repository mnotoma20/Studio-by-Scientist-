'use client'

import { useState } from 'react'

// Real screenshots of the app (sample content), shown one at a time with a tab row.
const SHOTS = [
  { id: 'detect', tab: 'Listens to the preacher', title: 'Hears the verse, shows the verse', body: 'As the pastor says a reference, Studio finds it and puts it on the screen. The read-along shows what it is hearing, word by word.', src: '/demo/detect.jpg' },
  { id: 'bible', tab: 'Bible', title: 'Any verse in one click', body: 'Search a verse, pick a translation, and send it to the screen. Bibles built in work with no internet.', src: '/demo/bible.jpg' },
  { id: 'songs', tab: 'Songs', title: 'Songs and lyrics', body: 'Keep your song library and send each verse, chorus or bridge to the screen as you go.', src: '/demo/songs.jpg' },
  { id: 'themes', tab: 'Themes', title: 'Make the screen look like your church', body: 'Pick backgrounds and themes for Bible and song screens, including short looping videos as moving backgrounds.', src: '/demo/themes.jpg' },
  { id: 'notes', tab: 'Sermon notes', title: 'Sermon notes with AI', body: 'Turn a message into clear points with supporting verses, ready to put on the projector one point at a time.', src: '/demo/notes.jpg' },
  { id: 'recap', tab: 'Service recap', title: 'A recap ready to send', body: 'After the service, Studio writes a summary, key points and a message you can send to your church.', src: '/demo/recap.jpg' },
  { id: 'library', tab: 'Sermon library', title: 'Every message, saved', body: 'Messages are organised by series and by month, with their scriptures, notes and recap, so you can find any past service.', src: '/demo/library.jpg' },
]

export default function ScreenshotGallery({ heading = true }: { heading?: boolean }) {
  const [active, setActive] = useState(0)
  const shot = SHOTS[active]

  return (
    <section id="screenshots" className="relative">
      {heading && (
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>See it in action</p>
          <h2 className="font-bold" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.15 }}>
            The real app, not a mock-up
          </h2>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 justify-start md:justify-center" role="tablist" style={{ scrollbarWidth: 'none' }}>
        {SHOTS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={i === active
              ? { background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {s.tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(167,139,250,0.25)', background: '#0d0d18', boxShadow: '0 20px 60px rgba(167,139,250,0.12)' }}>
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: '#14142a', borderBottom: '1px solid rgba(167,139,250,0.15)' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
          <span className="ml-3 text-xs" style={{ color: '#6b7280' }}>Studio by Scientist</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={shot.id} src={shot.src} alt={shot.title} width={1600} className="w-full h-auto block" loading="lazy" />
      </div>

      <div className="text-center mt-6 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-2">{shot.title}</h3>
        <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>{shot.body}</p>
        <p className="text-xs mt-3" style={{ color: '#4b5563' }}>Sample content shown.</p>
      </div>
    </section>
  )
}
