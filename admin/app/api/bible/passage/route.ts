import { NextRequest, NextResponse } from 'next/server'
import { authChurch } from '@/lib/churchAuth'

export const runtime = 'nodejs'

// Authenticated passthrough to the licensed Bible APIs (ESV, NLT). Their keys live only on this
// server, exactly like the OpenAI key -- the packaged desktop app can't carry a .env file, so
// calling these directly from the app never worked outside a dev checkout.
//   { provider: 'esv', q: 'John 3:16' }       -> api.esv.org passage JSON
//   { provider: 'nlt', ref: 'John.3.16' }     -> { html } from api.nlt.to
// The desktop app still does all the parsing; this only holds the key and forwards the request.
export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: { provider?: string; q?: string; ref?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    if (body.provider === 'esv') {
      const key = process.env.ESV_API_KEY
      if (!key) return NextResponse.json({ error: 'ESV is not configured on the server' }, { status: 503 })
      const q = (body.q || '').trim()
      if (!q || q.length > 100) return NextResponse.json({ error: 'Invalid passage query' }, { status: 400 })
      const url =
        `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(q)}` +
        `&include-verse-numbers=true&include-footnotes=false&include-headings=false` +
        `&include-short-copyright=false&include-passage-references=false`
      const upstream = await fetch(url, { headers: { Authorization: `Token ${key}` } })
      const text = await upstream.text()
      return new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
    }

    if (body.provider === 'nlt') {
      const key = process.env.NLT_API_KEY
      if (!key) return NextResponse.json({ error: 'NLT is not configured on the server' }, { status: 503 })
      const ref = (body.ref || '').trim()
      if (!ref || ref.length > 100) return NextResponse.json({ error: 'Invalid passage reference' }, { status: 400 })
      // version=NLT is required: without it the API inconsistently serves the Spanish NTV.
      const url = `https://api.nlt.to/api/passages?ref=${encodeURIComponent(ref)}&version=NLT&key=${key}`
      const upstream = await fetch(url)
      const html = await upstream.text()
      if (!upstream.ok) return NextResponse.json({ error: `NLT request failed (${upstream.status})` }, { status: upstream.status })
      return NextResponse.json({ html })
    }

    return NextResponse.json({ error: `Unknown provider: ${String(body.provider)}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
