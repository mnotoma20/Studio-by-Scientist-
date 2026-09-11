import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS: Record<string, string | undefined> = {
  'pro:monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
  'pro:annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
  'studio:monthly': process.env.STRIPE_PRICE_STUDIO_MONTHLY,
  'studio:annual': process.env.STRIPE_PRICE_STUDIO_ANNUAL,
}

// Called by the desktop app (POST, Supabase token in the Authorization header). Creates a
// Stripe Checkout session for the caller's own church and returns its URL, which the app
// opens in the system browser. No shared secret, no church id from the client — it comes
// from the verified token.
export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: { plan?: string; interval?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { plan, interval } = body
  if (!plan || !interval) {
    return NextResponse.json({ error: 'Missing plan or interval' }, { status: 400 })
  }
  const priceId = PRICE_IDS[`${plan}:${interval}`]
  if (!priceId) {
    return NextResponse.json({ error: `Unknown plan/interval: ${plan}/${interval}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('id, name, stripe_customer_id')
    .eq('id', auth.church.id)
    .single()

  if (churchError || !church) {
    return NextResponse.json({ error: churchError?.message || 'Church not found' }, { status: 404 })
  }

  let customerId = church.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: church.name || undefined,
      metadata: { church_id: church.id },
    })
    customerId = customer.id
    await supabase.from('churches').update({ stripe_customer_id: customerId }).eq('id', church.id)
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://admin-neon-three-38.vercel.app'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: church.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appBaseUrl}/billing/success`,
    cancel_url: `${appBaseUrl}/billing/canceled`,
    metadata: { church_id: church.id, plan, interval },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
  }
  return NextResponse.json({ url: session.url })
}
