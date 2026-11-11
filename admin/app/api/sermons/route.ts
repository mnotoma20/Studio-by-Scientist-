import { NextRequest, NextResponse } from 'next/server'
import { authChurch } from '@/lib/churchAuth'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

// Sermon library (Studio plan). One authenticated route for the desktop app:
//   { action: 'list' }                          -> { sermons: [...] }
//   { action: 'save', sermon: { id?, title, series, preached_on, scriptures, notes, recap } }
//   { action: 'delete', id }
// Every query is scoped to the caller's own church, so one church can never see another's.
const MAX_JSON_CHARS = 200_000

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: NextRequest) {
  const auth = await authChurch(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!(auth.owner || auth.church.plan === 'studio')) {
    return NextResponse.json({ error: 'The sermon library is part of the Studio plan.', upgradeRequired: true }, { status: 403 })
  }

  let body: { action?: string; id?: string; sermon?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const db = createAdminClient()
  const churchId = auth.church.id

  if (body.action === 'list') {
    const { data, error } = await db
      .from('sermons')
      .select('*')
      .eq('church_id', churchId)
      .order('preached_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sermons: data ?? [] })
  }

  if (body.action === 'save') {
    const s = body.sermon || {}
    const title = clean(s.title, 200)
    if (!title) return NextResponse.json({ error: 'A sermon needs a title' }, { status: 400 })
    const date = clean(s.preached_on, 10)
    const json = (v: unknown) => (v && JSON.stringify(v).length <= MAX_JSON_CHARS ? v : null)
    const row: Record<string, unknown> = {
      title,
      series: clean(s.series, 120) || null,
      preached_on: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
      scriptures: clean(s.scriptures, 300) || null,
      updated_at: new Date().toISOString(),
    }
    // Only touch notes/recap when sent, so saving a recap never wipes the notes already stored.
    if ('notes' in s) row.notes = json(s.notes)
    if ('recap' in s) row.recap = json(s.recap)
    const id = clean(s.id, 64)
    const q = id
      ? db.from('sermons').update(row).eq('id', id).eq('church_id', churchId)
      : db.from('sermons').insert({ ...row, church_id: churchId })
    const { data, error } = await q.select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sermon: data })
  }

  if (body.action === 'delete') {
    const id = clean(body.id, 64)
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await db.from('sermons').delete().eq('id', id).eq('church_id', churchId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
