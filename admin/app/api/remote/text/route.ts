import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { loadSession } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Words the phone heard (Live Mode listening from the phone's mic). Queued for the desktop app in
// order like any other remote command; returns at once instead of waiting for the app to answer.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const session = await loadSession(String(body.s || ''))
  if (!session) return NextResponse.json({ ok: false, error: 'This link is no longer valid.' }, { status: 404 })
  const text = typeof body.text === 'string' ? body.text.slice(0, 1500) : ''
  if (!text) return NextResponse.json({ ok: true })
  const { error } = await createAdminClient().from('remote_commands').insert({ session: session.id, cmd: 'live-text', ref: text })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
