import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('shared_songs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[GET /api/songs] Supabase error:', error.message)
    return NextResponse.json({ songs: [], error: error.message }, { status: 500 })
  }
  return NextResponse.json({ songs: data ?? [] })
}
