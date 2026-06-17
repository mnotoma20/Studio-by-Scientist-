import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const now = new Date()
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const days14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: allEvents }, { data: recentEvents }] = await Promise.all([
    supabase.from('analytics_events').select('event, user_id, created_at, data').gte('created_at', days30),
    supabase.from('analytics_events').select('event, created_at, data').gte('created_at', days14),
  ])

  const events30 = allEvents || []
  const events14 = recentEvents || []

  // Daily active churches (unique user_ids per day, 30 days)
  const dailyActive: Record<string, Set<string>> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyActive[d.toISOString().slice(0, 10)] = new Set()
  }
  events30.forEach(e => {
    const day = e.created_at.slice(0, 10)
    if (dailyActive[day] && e.user_id) dailyActive[day].add(e.user_id)
  })
  const dailyActiveData = Object.entries(dailyActive).map(([day, users]) => ({
    day: day.slice(5),
    count: users.size,
  }))

  // Feature usage breakdown (event type counts)
  const featureCounts: Record<string, number> = {}
  events30.forEach(e => { featureCounts[e.event] = (featureCounts[e.event] || 0) + 1 })
  const featureUsage = [
    { name: 'Bible', value: featureCounts['verse_displayed'] || 0 },
    { name: 'Songs', value: featureCounts['song_displayed'] || 0 },
    { name: 'Prayer', value: featureCounts['prayer_displayed'] || 0 },
    { name: 'AI Detect', value: featureCounts['ai_detection'] || 0 },
    { name: 'Sessions', value: featureCounts['session_start'] || 0 },
  ].filter(f => f.value > 0)

  // AI detections per day (14 days)
  const aiByDay: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    aiByDay[d.toISOString().slice(0, 10)] = 0
  }
  events14.filter(e => e.event === 'ai_detection').forEach(e => {
    const day = e.created_at.slice(0, 10)
    if (day in aiByDay) aiByDay[day]++
  })
  const aiData = Object.entries(aiByDay).map(([day, count]) => ({ day: day.slice(5), count }))

  // Top 10 displayed Bible verses (30 days)
  const verseCounts: Record<string, number> = {}
  events30.filter(e => e.event === 'verse_displayed' && e.data?.reference).forEach(e => {
    const ref = e.data.reference
    verseCounts[ref] = (verseCounts[ref] || 0) + 1
  })
  const topVerses = Object.entries(verseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([verse, count]) => ({ verse, count }))

  // Total counts
  const totalVerses = featureCounts['verse_displayed'] || 0
  const totalSongs = featureCounts['song_displayed'] || 0
  const totalAI = featureCounts['ai_detection'] || 0
  const totalSessions = featureCounts['session_start'] || 0

  return NextResponse.json({
    dailyActiveData,
    featureUsage,
    aiData,
    topVerses,
    totals: { totalVerses, totalSongs, totalAI, totalSessions }
  })
}
