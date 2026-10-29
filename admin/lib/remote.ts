import { createAdminClient } from '@/lib/supabase'
import { authChurch } from '@/lib/churchAuth'

export const REMOTE_CMDS = ['next', 'prev', 'blank', 'logo', 'verse', 'listen-start', 'listen-stop']
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000

// Phone Remote is a Studio feature: Studio plan or the owner override. authChurch's `entitled` is
// Pro/Studio/owner, so entitled-but-not-Pro leaves exactly Studio and owner.
export async function authStudioChurch(request: Request) {
  const auth = await authChurch(request)
  if (!auth.ok) return { error: auth.error, status: auth.status } as const
  if (!auth.entitled || auth.church.plan === 'pro') {
    return { error: 'The phone remote is part of the Studio plan.', status: 403, upgradeRequired: true } as const
  }
  return { church: auth.church } as const
}

export async function loadSession(id: string) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return null
  const { data } = await createAdminClient().from('remote_sessions').select('*').eq('id', id).maybeSingle()
  if (!data) return null
  if (Date.now() - new Date(data.created_at).getTime() > SESSION_TTL_MS) return null
  return data as { id: string; church_id: string; state: any; updated_at: string; created_at: string }
}
