import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Admin only (the middleware requires the staff session for everything outside its allow-list).
//   GET                         -> { links: [...] }
//   POST { rows: [{church_name, contact_name?, email?, phone?, denomination?}] } -> { created: [...] }
//   DELETE ?slug=...
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// "Advent Lutheran Church" -> "advent-lutheran-church-k3x9": readable, but the random tail means
// nobody can guess another church's link.
function makeSlug(name: string) {
  const base = name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'church'
  return `${base}-${randomBytes(2).toString('hex')}`
}

export async function GET() {
  const { data, error } = await createAdminClient().from('demo_links').select('*').order('last_viewed_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ links: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : []
  const toInsert = rows
    .map((r: Record<string, unknown>) => ({
      church_name: clean(r.church_name, 120),
      contact_name: clean(r.contact_name, 80) || null,
      email: clean(r.email, 120) || null,
      phone: clean(r.phone, 40) || null,
      denomination: clean(r.denomination, 60) || null,
    }))
    .filter((r: { church_name: string }) => r.church_name)
    .map((r: object & { church_name: string }) => ({ ...r, slug: makeSlug(r.church_name) }))
  if (!toInsert.length) return NextResponse.json({ error: 'No churches to add' }, { status: 400 })
  const { data, error } = await createAdminClient().from('demo_links').insert(toInsert).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ created: data })
}

export async function DELETE(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || ''
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const { error } = await createAdminClient().from('demo_links').delete().eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
