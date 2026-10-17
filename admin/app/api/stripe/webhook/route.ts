import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// price ID -> {plan, interval}, the inverse of the checkout route's map — lets
// subscription.updated recompute the plan from whatever price is currently active
// (handles Pro<->Studio changes and monthly<->annual switches alike).
function planFromPriceId(priceId: string | undefined): { plan: string; interval: string } | null {
  const map: Record<string, { plan: string; interval: string }> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: { plan: 'pro', interval: 'monthly' },
    [process.env.STRIPE_PRICE_PRO_ANNUAL || '']: { plan: 'pro', interval: 'annual' },
    [process.env.STRIPE_PRICE_STUDIO_MONTHLY || '']: { plan: 'studio', interval: 'monthly' },
    [process.env.STRIPE_PRICE_STUDIO_ANNUAL || '']: { plan: 'studio', interval: 'annual' },
  }
  return priceId ? map[priceId] || null : null
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Signature verification needs the raw, unparsed body — reading .text() before any
  // JSON parsing is required, Stripe's signature won't match a re-serialized object.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', (err as Error).message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const churchId = session.client_reference_id
        if (!churchId || !session.subscription) break
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const item = subscription.items.data[0]
        const mapped = planFromPriceId(item?.price.id)
        await supabase.from('churches').update({
          plan: mapped?.plan || 'pro',
          billing_interval: mapped?.interval || null,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('id', churchId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const item = subscription.items.data[0]
        const mapped = planFromPriceId(item?.price.id)
        await supabase.from('churches').update({
          plan: mapped?.plan || 'free',
          billing_interval: mapped?.interval || null,
          subscription_status: subscription.status,
          current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase.from('churches').update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          current_period_end: null,
          cancel_at_period_end: false,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      default:
        // Unhandled event types are expected — Stripe sends many we don't act on.
        break
    }
  } catch (err) {
    console.error(`[stripe webhook] failed to process ${event.type}:`, (err as Error).message)
    // Still return 200 — Stripe retries on non-2xx, and a DB hiccup here shouldn't cause
    // repeated retries to pile up; the next subscription.updated event will self-correct.
  }

  return NextResponse.json({ received: true })
}
