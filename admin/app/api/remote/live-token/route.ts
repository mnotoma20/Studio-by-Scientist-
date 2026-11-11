import { NextRequest, NextResponse } from 'next/server'
import { loadSession } from '@/lib/remote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Same model as /api/ai/realtime-token (see the note there on why this one).
const MODEL = 'gpt-live-transcribe'

// The phone page asks for a short-lived OpenAI pass so it can stream its own microphone for Live
// Mode. The session id in the QR link is the credential, and the session only exists because a
// Studio church (or the owner) started it. Refused while Studio is offline, so a leaked link can
// not spend AI credit when nobody is running the app.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const session = await loadSession(String(body.s || ''))
  if (!session) return NextResponse.json({ error: 'This link is no longer valid. Scan the QR code in Studio again.' }, { status: 404 })
  if (Date.now() - new Date(session.updated_at).getTime() > 10000) {
    return NextResponse.json({ error: 'Studio is not connected. Is it open and online?' }, { status: 409 })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured on the server' }, { status: 503 })

  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        session: {
          type: 'transcription',
          audio: { input: { format: { type: 'audio/pcm', rate: 24000 }, transcription: { model: MODEL, languages: ['en'] } } },
        },
      }),
    })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok || !data.value) {
      return NextResponse.json({ error: data?.error?.message || `Token request failed (${upstream.status})` }, { status: upstream.ok ? 502 : upstream.status })
    }
    return NextResponse.json({ value: data.value })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
