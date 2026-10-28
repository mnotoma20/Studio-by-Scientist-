import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin-only (the middleware requires a staff session for everything outside /api/stripe, /api/ai
// and /billing). Reads real payments straight from Stripe: last 30 days of successful charges,
// plus active subscriptions and the monthly recurring revenue they add up to.
export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60

    const perDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      perDay[d.toISOString().slice(0, 10)] = 0
    }

    let total = 0
    let payments = 0
    let currency = 'usd'
    for await (const ch of stripe.charges.list({ created: { gte: since }, limit: 100 })) {
      if (ch.status !== 'succeeded' || !ch.paid) continue
      const net = (ch.amount - (ch.amount_refunded || 0)) / 100
      const day = new Date(ch.created * 1000).toISOString().slice(0, 10)
      if (day in perDay) perDay[day] += net
      total += net
      payments += 1
      currency = ch.currency
    }

    let activeSubs = 0
    let mrr = 0
    for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
      activeSubs += 1
      for (const item of sub.items.data) {
        const price = item.price
        const amt = (price.unit_amount ?? 0) / 100 * (item.quantity ?? 1)
        const every = price.recurring?.interval_count ?? 1
        if (price.recurring?.interval === 'year') mrr += amt / (12 * every)
        else if (price.recurring?.interval === 'month') mrr += amt / every
      }
    }

    return NextResponse.json({
      currency,
      total30: Math.round(total * 100) / 100,
      payments,
      activeSubs,
      mrr: Math.round(mrr * 100) / 100,
      daily: Object.entries(perDay).map(([day, amount]) => ({ day: day.slice(5), amount: Math.round(amount * 100) / 100 })),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Stripe request failed' }, { status: 500 })
  }
}
