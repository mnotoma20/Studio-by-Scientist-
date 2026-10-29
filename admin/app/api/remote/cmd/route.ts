import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { loadSession, REMOTE_CMDS } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Phone page sends a button press. Queued for the desktop app, then we wait briefly for its answer so
// the phone can show "could not find that verse" etc.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const session = await loadSession(String(body.s || ''))
  if (!session) return NextResponse.json({ success: false, error: 'This link is no longer valid. Scan the QR code in Studio again.' }, { status: 404 })
  if (!REMOTE_CMDS.includes(body.cmd)) return NextResponse.json({ success: false, error: 'Unknown command' }, { status: 400 })
  if (Date.now() - new Date(session.updated_at).getTime() > 10000) {
    return NextResponse.json({ success: false, error: 'Studio is not connected. Is it open and online?' })
  }
  const supabase = createAdminClient()
  const { data: row, error } = await supabase.from('remote_commands')
    .insert({ session: session.id, cmd: body.cmd, ref: String(body.ref || '').slice(0, 80) })
    .select('id').single()
  if (error || !row) return NextResponse.json({ success: false, error: error?.message || 'Could not send' })

  const deadline = Date.now() + 6000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 250))
    const { data } = await supabase.from('remote_commands').select('done, result').eq('id', row.id).maybeSingle()
    if (data?.done) return NextResponse.json(data.result || { success: true })
  }
  return NextResponse.json({ success: false, error: 'Studio did not respond' })
}
