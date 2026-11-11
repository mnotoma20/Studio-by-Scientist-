'use client'

import { useEffect, useState } from 'react'
import { Link2, Copy, Trash2, Eye, MousePointerClick, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/Toast'
import { timeAgo } from '@/lib/utils'

const SITE = 'https://www.studiobyscientist.com'

interface DemoLink {
  slug: string
  church_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  denomination: string | null
  views: number
  clicks: number
  last_viewed_at: string | null
  created_at: string
}

// One church per line: Church name, Contact name, Email, Phone, Denomination (commas or tabs; only the name is required).
function parseRows(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((line) => {
      const p = (line.includes('\t') ? line.split('\t') : line.split(',')).map((x) => x.trim())
      return { church_name: p[0], contact_name: p[1], email: p[2], phone: p[3], denomination: p[4] }
    })
    .filter((r) => r.church_name && !/^church(_| )name$/i.test(r.church_name))
}

export default function DemosPage() {
  const { toast } = useToast()
  const [links, setLinks] = useState<DemoLink[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/demos')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not load')
      setLinks(d.links)
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not load', 'error') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    const rows = parseRows(text)
    if (!rows.length) { toast('Add at least one church', 'error'); return }
    setSaving(true)
    try {
      const r = await fetch('/api/demos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not create links')
      toast(`Created ${d.created.length} link${d.created.length === 1 ? '' : 's'}`, 'success')
      setText('')
      load()
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not create links', 'error') }
    setSaving(false)
  }

  const copy = async (slug: string) => {
    try { await navigator.clipboard.writeText(`${SITE}/demo/${slug}`); toast('Link copied', 'success') }
    catch { toast(`${SITE}/demo/${slug}`, 'info') }
  }
  const remove = async (slug: string) => {
    const r = await fetch(`/api/demos?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
    if (r.ok) setLinks((l) => l.filter((x) => x.slug !== slug)); else toast('Could not delete', 'error')
  }

  const opened = links.filter((l) => l.views > 0).length
  const clicked = links.filter((l) => l.clicks > 0).length
  const card = { background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }
  const th = { textAlign: 'left' as const, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '8px 10px' }
  const td = { padding: '10px', fontSize: '13px', color: '#e5e7eb', borderTop: '1px solid rgba(167,139,250,0.1)' }

  return (
    <DashboardLayout title="Demos">
      <div style={card}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><Link2 size={18} color="#a78bfa" /> New demo links</h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>One church per line: <b>Church name, Contact name, Email, Phone, Denomination</b>. Only the name is required.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={'Advent Lutheran Church, Larry, office@example.org, (713) 555-0100, Lutheran'}
          style={{ width: '100%', background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <button onClick={create} disabled={saving} style={{ marginTop: '12px', background: 'linear-gradient(135deg,#a78bfa,#ec4899)', border: 0, borderRadius: '10px', color: '#fff', fontWeight: 700, padding: '10px 20px', cursor: 'pointer' }}>
          {saving ? 'Creating…' : 'Create links'}
        </button>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#9ca3af' }}>
          <span><b style={{ color: '#fff', fontSize: '20px' }}>{links.length}</b> links</span>
          <span><b style={{ color: '#fff', fontSize: '20px' }}>{opened}</b> opened</span>
          <span><b style={{ color: '#fff', fontSize: '20px' }}>{clicked}</b> pressed a button</span>
        </div>
        {loading ? <Loader2 size={20} color="#a78bfa" /> : links.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '13px' }}>No links yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
              <thead><tr><th style={th}>Church</th><th style={th}>Contact</th><th style={th}><Eye size={12} /> Opened</th><th style={th}><MousePointerClick size={12} /> Clicks</th><th style={th}>Last opened</th><th style={th}></th></tr></thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.slug}>
                    <td style={td}><b>{l.church_name}</b>{l.denomination ? <span style={{ color: '#9ca3af' }}> · {l.denomination}</span> : null}</td>
                    <td style={td}>{[l.contact_name, l.phone, l.email].filter(Boolean).join(' · ') || '—'}</td>
                    <td style={{ ...td, color: l.views ? '#10b981' : '#6b7280' }}>{l.views}</td>
                    <td style={{ ...td, color: l.clicks ? '#f59e0b' : '#6b7280' }}>{l.clicks}</td>
                    <td style={td}>{l.last_viewed_at ? timeAgo(l.last_viewed_at) : 'Not yet'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button onClick={() => copy(l.slug)} title="Copy link" style={{ background: 'none', border: 0, color: '#a78bfa', cursor: 'pointer', marginRight: '8px' }}><Copy size={15} /></button>
                      <button onClick={() => remove(l.slug)} title="Delete" style={{ background: 'none', border: 0, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
