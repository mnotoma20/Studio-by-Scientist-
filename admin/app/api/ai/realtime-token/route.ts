import { NextRequest, NextResponse } from 'next/server'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

// Mints a short-lived OpenAI client secret for a live (streaming) transcription session, so the
// desktop app can stream the sermon audio straight to OpenAI while the real key stays here.
// Same gate as the other AI routes: signed in + Pro/Studio (or owner).
// gpt-live-transcribe: streams word by word and held up on a noisy phone recording of a real
// Nigerian service (accurate references and verses) where gpt-realtime-whisper dropped most of the
// speech and gpt-4o-transcribe garbled it.
const MODEL = 'gpt-live-transcribe'

export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!auth.entitled) {
    return NextResponse.json(
      { error: 'AI features require a Pro or Studio plan.', upgradeRequired: true },
      { status: 403 }
    )
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
          audio: {
            input: {
              format: { type: 'audio/pcm', rate: 24000 },
              // This model streams continuously and does not take turn detection or a prompt.
              transcription: { model: MODEL, languages: ['en'] },
            },
          },
        },
      }),
    })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok || !data.value) {
      return NextResponse.json(
        { error: data?.error?.message || `Realtime token request failed (${upstream.status})` },
        { status: upstream.ok ? 502 : upstream.status }
      )
    }
    return NextResponse.json({ value: data.value, expiresAt: data.expires_at, model: MODEL })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
