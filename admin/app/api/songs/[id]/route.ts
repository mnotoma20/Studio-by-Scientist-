import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { error } = await supabase.from('shared_songs').update(body).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('shared_songs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
