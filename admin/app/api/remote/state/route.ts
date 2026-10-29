import { NextRequest, NextResponse } from 'next/server'
import { loadSession } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store' // Next 14 otherwise caches Supabase's fetches and serves stale state

// Phone page polls this. The session id in the QR link is the credential (96 random bits).
export async function GET(request: NextRequest) {
  const session = await loadSession(request.nextUrl.searchParams.get('s') || '')
  if (!session) return NextResponse.json({ error: 'This link is no longer valid. Scan the QR code in Studio again.' }, { status: 404 })
  const online = Date.now() - new Date(session.updated_at).getTime() < 10000
  return NextResponse.json({ ...(session.state || {}), online })
}
