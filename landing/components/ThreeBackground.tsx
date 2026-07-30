'use client'

import { useEffect, useRef } from 'react'

const VERSES = [
  'John 3:16', 'Psalm 23:1', 'Rom 8:28', 'Phil 4:13',
  'Jer 29:11', 'Isa 40:31', 'Prov 3:5', 'Matt 6:33',
  'Heb 11:1', '2 Tim 1:7', 'Josh 1:9', 'Gal 2:20',
  'Ps 46:10', 'Rev 21:4', 'Gen 1:1', 'John 1:1',
  '1 Cor 13:4', 'Eph 2:8', 'Rom 5:8', 'John 14:6',
]

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  text: string
  alpha: number
  size: number
  color: string
  phase: number
}

// Persistent, viewport-pinned "living scripture field" — rendered once behind the whole
// page (not just the hero) so the site never goes flat/static as you scroll.
export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const auroraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    let w = window.innerWidth
    let h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const COLORS = ['#a78bfa', '#ec4899', '#8b5cf6', '#db2777', '#c084fc', '#f472b6', '#f59e0b']

    const COUNT = w < 640 ? 26 : 46
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      text: VERSES[Math.floor(Math.random() * VERSES.length)],
      alpha: Math.random() * 0.4 + 0.08,
      size: Math.random() * 8 + 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
    }))

    const connections: [number, number][] = []
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (Math.random() < 0.07) connections.push([i, j])
      }
    }

    let time = 0
    // Scroll-linked "energy" — the field gets a touch more luminous deeper into the page,
    // building quietly toward the download CTA instead of staying flat throughout.
    let energy = 0
    let targetEnergy = 0

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, w, h)
      time += 0.004
      energy += (targetEnergy - energy) * 0.03

      for (const [a, b] of connections) {
        const pa = particles[a]
        const pb = particles[b]
        const dx = pa.x - pb.x
        const dy = pa.y - pb.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 260) {
          const lineAlpha = (1 - dist / 260) * (0.12 + energy * 0.1)
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.strokeStyle = hexToRgba(pa.color, lineAlpha)
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -120) p.x = w + 120
        if (p.x > w + 120) p.x = -120
        if (p.y < -60) p.y = h + 60
        if (p.y > h + 60) p.y = -60

        const pulse = p.alpha * (0.55 + 0.45 * Math.sin(time * 1.8 + p.phase)) * (1 + energy * 0.5)

        const glowR = p.size * 2.5
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR)
        grd.addColorStop(0, hexToRgba(p.color, pulse * 0.35))
        grd.addColorStop(1, hexToRgba(p.color, 0))
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2)
        ctx.fill()

        const fontSize = Math.max(9, Math.min(20, p.size))
        ctx.font = `${fontSize}px 'Playfair Display', Georgia, serif`
        ctx.fillStyle = hexToRgba(p.color, pulse)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.text, p.x, p.y)
      }

      animFrame = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    window.addEventListener('resize', handleResize)

    // Slow parallax drift on the aurora mesh + gentle brightening as the user scrolls down
    const handleScroll = () => {
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      const progress = Math.min(window.scrollY / docHeight, 1)
      targetEnergy = progress
      if (auroraRef.current) {
        auroraRef.current.style.transform = `translateY(${window.scrollY * 0.06}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" style={{ background: '#050508' }}>
      {/* Slow-drifting aurora mesh — gives the field depth/parallax beneath the particles */}
      <div ref={auroraRef} className="absolute inset-0 aurora-mesh" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.75 }}
      />
      {/* Soft top/bottom vignette so section content stays readable */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.35) 100%)' }} />
    </div>
  )
}
