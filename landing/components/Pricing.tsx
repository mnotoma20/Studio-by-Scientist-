'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    featured: false,
    color: '#6b7280',
    features: [
      'Manual Bible search & display',
      'Unlimited songs',
      '2 schedules per month',
      'Unlimited themes',
      '1 screen output',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaHref: '#download',
    ctaStyle: 'ghost',
  },
  {
    name: 'Pro',
    badge: '⭐ Most Popular',
    monthly: 18,
    annual: 14,
    featured: true,
    color: '#a78bfa',
    features: [
      'Everything in Free',
      'Unlimited schedules',
      'AI voice detection (Live Mode)',
      'AI sermon notes',
      'PowerPoint import',
      'Slide Deck editor',
      'Multi-screen output (up to 4)',
      'Stage monitor',
      'NDI streaming output',
      'Priority support',
    ],
    cta: 'Get Started',
    ctaHref: '#download',
    ctaStyle: 'gradient',
  },
  {
    name: 'Studio',
    monthly: 50,
    annual: 40,
    featured: false,
    color: '#f59e0b',
    features: [
      'Everything in Pro',
      'Premium song library',
      'Service intelligence reports',
      'Admin dashboard',
      'Custom branding',
      'Dedicated support',
    ],
    cta: 'Get Started',
    ctaHref: '#download',
    ctaStyle: 'gradient',
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="pricing" ref={ref} className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.2), transparent)' }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#f59e0b' }}>
            Pricing
          </p>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-3"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Simple pricing.
          </h2>
          <p className="text-2xl font-light" style={{ color: '#6b7280', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>
            Powerful software.
          </p>
        </motion.div>

        {/* Annual toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-16">
          <span className="text-sm font-medium" style={{ color: annual ? '#6b7280' : '#fff' }}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
            style={{ background: annual ? 'linear-gradient(135deg, #a78bfa, #ec4899)' : 'rgba(255,255,255,0.1)' }}>
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: annual ? '28px' : '4px' }} />
          </button>
          <span className="text-sm font-medium" style={{ color: annual ? '#fff' : '#6b7280' }}>Annual</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            Save 20%
          </span>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl p-8 transition-all duration-300"
              style={{
                background: plan.featured ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.025)',
                border: plan.featured ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: plan.featured ? '0 0 60px rgba(167,139,250,0.12), 0 0 120px rgba(236,72,153,0.06)' : 'none',
                marginTop: plan.featured ? '0' : '16px',
              }}>

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff' }}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-4xl font-black text-white">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className="text-sm mb-2" style={{ color: '#6b7280' }}>/month</span>
                </div>
                {annual && plan.monthly > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    Billed annually (${(annual ? plan.annual : plan.monthly) * 12}/yr)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                      <Check size={10} style={{ color: plan.color }} strokeWidth={3} />
                    </div>
                    <span style={{ color: '#d1d5db' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a href={plan.ctaHref}
                className={`block w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.ctaStyle === 'gradient'
                    ? 'btn-gradient text-white relative overflow-hidden'
                    : plan.ctaStyle === 'ghost'
                    ? 'hover:bg-white/5 border border-white/10 text-white'
                    : 'border text-white hover:bg-white/5'
                }`}
                style={plan.ctaStyle === 'outline' ? { borderColor: `${plan.color}40`, color: plan.color } : {}}>
                <span className="relative z-10">{plan.cta}</span>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
