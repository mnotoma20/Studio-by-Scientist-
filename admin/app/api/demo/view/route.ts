import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Public: the demo page on the website calls this when it opens (kind 'view') and when a button is
// pressed (kind 'click'). It only ever records that a link was opened, never anything about the
// visitor. Link-preview bots (WhatsApp, iMessage) do not run the page's script, so they do not count.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const slug = String(body.slug || '').slice(0, 80)
  const kind = body.kind === 'click' ? 'click' : 'view'
  const detail = typeof body.detail === 'string' ? body.detail.slice(0, 40) : null
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })

  const db = createAdminClient()
  const { data: link } = await db.from('demo_links').select('slug, church_name, views, clicks, first_viewed_at').eq('slug', slug).maybeSingle()
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })

  const now = new Date().toISOString()
  await db.from('demo_events').insert({ slug, kind, detail })
  if (kind === 'view') {
    await db.from('demo_links').update({ views: link.views + 1, last_viewed_at: now, first_viewed_at: link.first_viewed_at || now }).eq('slug', slug)
  } else {
    await db.from('demo_links').update({ clicks: link.clicks + 1 }).eq('slug', slug)
  }
  return NextResponse.json({ church_name: link.church_name }, { headers: CORS })
}
