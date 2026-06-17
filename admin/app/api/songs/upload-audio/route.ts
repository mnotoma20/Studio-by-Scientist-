import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createAdminClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const songTitle = (formData.get('title') as string) || 'song'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'mp3'
    const path = `${Date.now()}_${songTitle.replace(/\s+/g, '_').slice(0, 40)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Try to create bucket if it doesn't exist
    await supabase.storage.createBucket('song-audio', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('song-audio')
      .upload(path, buffer, { contentType: file.type || 'audio/mpeg', upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('song-audio').getPublicUrl(path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    console.error('Upload route error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
