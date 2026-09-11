import { NextRequest, NextResponse } from 'next/server'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

// Authenticated passthrough to OpenAI. Two shapes:
//   { kind: 'chat', body: { model, messages, ... } }        -> /v1/chat/completions
//   { kind: 'transcribe', audioBase64, mime, fields: {...} } -> /v1/audio/transcriptions
// The desktop app sends its Supabase token; the OpenAI key lives only on this server.
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

  let req: Record<string, unknown>
  try {
    req = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    if (req.kind === 'chat') {
      const body = (req.body || {}) as Record<string, unknown>
      const allowed = new Set(['gpt-4o-mini', 'gpt-4o'])
      if (typeof body.model !== 'string' || !allowed.has(body.model)) {
        return NextResponse.json({ error: `Model not allowed: ${String(body.model)}` }, { status: 400 })
      }
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
      const text = await upstream.text()
      return new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
    }

    if (req.kind === 'transcribe') {
      const audioBase64 = req.audioBase64 as string
      if (!audioBase64) return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
      const bytes = Buffer.from(audioBase64, 'base64')
      if (bytes.length > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
      }
      const fields = (req.fields || {}) as Record<string, string>
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: (req.mime as string) || 'audio/webm' }), 'audio.webm')
      form.append('model', 'whisper-1')
      for (const [k, v] of Object.entries(fields)) form.append(k, v)

      const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })
      const text = await upstream.text()
      return new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
    }

    return NextResponse.json({ error: `Unknown kind: ${String(req.kind)}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
