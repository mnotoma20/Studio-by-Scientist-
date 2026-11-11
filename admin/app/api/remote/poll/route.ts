import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { authStudioChurch, loadSession } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15
export const fetchCache = 'force-no-store' // Next 14 otherwise caches Supabase's fetches and serves stale state

// Called by the desktop app about once a second: publishes what is on screen, reports the results of
// commands it ran, and receives any commands the phone queued.
export async function POST(request: NextRequest) {
  const auth = await authStudioChurch(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const session = await loadSession(String(body.session || ''))
  if (!session || session.church_id !== auth.church.id) {
    return NextResponse.json({ error: 'Remote session ended', ended: true }, { status: 404 })
  }
  const supabase = createAdminClient()

  const results = Array.isArray(body.results) ? body.results.slice(0, 20) : []
  for (const r of results) {
    if (!Number.isInteger(r?.id)) continue
    await supabase.from('remote_commands').update({ done: true, result: r.result ?? { success: true } })
      .eq('id', r.id).eq('session', session.id)
  }

  await supabase.from('remote_sessions').update({ state: body.state || {}, updated_at: new Date().toISOString() }).eq('id', session.id)

  // `hold`: while the phone is feeding Live Mode its words must reach the app at once, so instead of
  // answering "nothing yet" the request waits (up to ~2.5 s) and answers the moment a command arrives.
  const holdUntil = body.hold ? Date.now() + 2500 : 0
  let fresh: { id: number; cmd: string; ref: string }[] = []
  for (;;) {
    const { data: pending } = await supabase.from('remote_commands').select('id, cmd, ref, created_at')
      .eq('session', session.id).eq('done', false).order('id').limit(10)
    fresh = (pending || []).filter((c) => Date.now() - new Date(c.created_at).getTime() < 15000)
    if (fresh.length || Date.now() >= holdUntil) break
    await new Promise((r) => setTimeout(r, 120))
  }
  return NextResponse.json({ commands: fresh.map(({ id, cmd, ref }) => ({ id, cmd, ref })) })
}
