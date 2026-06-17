import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const [churchRes, songRes] = await Promise.all([
    supabase.from('churches').select('id, name, location, plan, created_at').order('created_at', { ascending: false }),
    supabase.from('shared_songs').select('*', { count: 'exact', head: true }),
  ])

  if (churchRes.error) console.error('[dashboard API] churches error:', churchRes.error.message)
  if (songRes.error) console.error('[dashboard API] songs error:', songRes.error.message)

  return NextResponse.json({
    churches: churchRes.data || [],
    songCount: songRes.count || 0,
    debug: { churchError: churchRes.error?.message, songError: songRes.error?.message }
  })
}
