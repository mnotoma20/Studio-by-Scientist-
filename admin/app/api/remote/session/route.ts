import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase'
import { authStudioChurch } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The desktop app starts a remote session; the returned id is the secret in the phone's QR link.
export async function POST(request: NextRequest) {
  const auth = await authStudioChurch(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, upgradeRequired: (auth as any).upgradeRequired }, { status: auth.status })
  }
  const supabase = createAdminClient()
  await supabase.from('remote_sessions').delete().eq('church_id', auth.church.id) // one live session per church
  const id = randomBytes(12).toString('hex')
  const { error } = await supabase.from('remote_sessions').insert({ id, church_id: auth.church.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: id })
}
