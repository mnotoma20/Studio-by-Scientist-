import { NextRequest, NextResponse } from 'next/server'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

// Thin authenticated passthrough to the Anthropic Messages API. The desktop app builds the
// full prompt/messages payload and sends it here with its Supabase token; the API key lives
// only on this server. Response body is returned verbatim so the app's existing parsing works.
export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!auth.entitled) {
    return NextResponse.json(
      { error: 'AI features require a Pro or Studio plan.', upgradeRequired: true },
      { status: 403 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured on the server' }, { status: 503 })

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Guard against the passthrough being used as an open relay.
  const allowedModels = new Set(['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-haiku-latest'])
  if (typeof payload.model !== 'string' || !allowedModels.has(payload.model)) {
    return NextResponse.json({ error: `Model not allowed: ${String(payload.model)}` }, { status: 400 })
  }
  if (typeof payload.max_tokens !== 'number' || payload.max_tokens > 4000) {
    payload.max_tokens = 2000
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })
    const body = await upstream.text()
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
