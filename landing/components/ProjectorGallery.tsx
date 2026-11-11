// What the congregation sees on the projector (screenshots of the real display window, sample content).
const SCREENS = [
  { src: '/demo/proj-verse.jpg', alt: 'John 3:16 on the projector over a blue background', label: 'Scripture' },
  { src: '/demo/proj-lyrics.jpg', alt: 'Song lyrics on the projector over a red background', label: 'Song lyrics' },
  { src: '/demo/proj-verse2.jpg', alt: 'Romans 8:28 on the projector over a gold background', label: 'Your choice of look' },
]

export default function ProjectorGallery({ heading = true }: { heading?: boolean }) {
  return (
    <section id="projector" className="relative">
      {heading && (
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>On the big screen</p>
          <h2 className="font-bold" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.15 }}>
            What your congregation sees
          </h2>
          <p className="mt-3 max-w-2xl mx-auto" style={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Large, clear text that fits the screen, on backgrounds you choose. Readable from the back row.
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {SCREENS.map((s) => (
          <figure key={s.src} className="m-0">
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(167,139,250,0.25)', background: '#000', boxShadow: '0 12px 40px rgba(167,139,250,0.1)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} width={1600} height={900} className="w-full h-auto block" loading="lazy" />
            </div>
            <figcaption className="text-center text-sm mt-3" style={{ color: '#9ca3af' }}>{s.label}</figcaption>
          </figure>
        ))}
      </div>
      <p className="text-center text-xs mt-4" style={{ color: '#4b5563' }}>Sample content shown.</p>
    </section>
  )
}
