import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Called by the desktop app (POST, Supabase token in the Authorization header). Returns the
// URL of a Stripe-hosted Billing Portal session for the caller's own church — invoices, card
// updates, cancellation, all Stripe-maintained. The church id comes from the verified token.
export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const supabase = createAdminClient()
  const { data: church, error } = await supabase
    .from('churches')
    .select('id, stripe_customer_id')
    .eq('id', auth.church.id)
    .single()

  if (error || !church) {
    return NextResponse.json({ error: 'Church not found' }, { status: 404 })
  }
  if (!church.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing history yet — this church has never checked out' }, { status: 404 })
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://admin-neon-three-38.vercel.app'
  const session = await stripe.billingPortal.sessions.create({
    customer: church.stripe_customer_id,
    return_url: `${appBaseUrl}/billing/success`,
  })

  return NextResponse.json({ url: session.url })
}
