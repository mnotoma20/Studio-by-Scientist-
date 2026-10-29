import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { authStudioChurch } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await authStudioChurch(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  await createAdminClient().from('remote_sessions').delete().eq('church_id', auth.church.id)
  return NextResponse.json({ success: true })
}
