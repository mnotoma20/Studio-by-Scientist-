import { createAdminClient } from '@/lib/supabase'

export type ChurchAuthResult =
  | { ok: true; userId: string; church: { id: string; plan: string; is_admin: boolean }; entitled: boolean }
  | { ok: false; status: number; error: string }

const OWNER_EMAILS = ['oghenemine2007@outlook.com']

// Authenticates a request from the desktop app by its Supabase access token (sent as
// `Authorization: Bearer <jwt>`). No shared secret ships in the app — the JWT is minted by
// Supabase at sign-in and validated here against the same project. Returns the caller's
// church and whether it is entitled to paid features (Pro/Studio plan, or owner override).
export async function authChurch(request: Request): Promise<ChurchAuthResult> {
  const header = request.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) return { ok: false, status: 401, error: 'Missing authentication token' }

  const supabase = createAdminClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, error: 'Invalid or expired session — sign in again' }
  }
  const user = userData.user

  const { data: church, error: churchErr } = await supabase
    .from('churches')
    .select('id, plan, is_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (churchErr) return { ok: false, status: 500, error: churchErr.message }
  if (!church) return { ok: false, status: 404, error: 'No church found for this account' }

  const plan = (church.plan || 'free').toLowerCase()
  const isOwner = church.is_admin === true || OWNER_EMAILS.includes((user.email || '').toLowerCase())
  const entitled = isOwner || plan === 'pro' || plan === 'studio'

  return { ok: true, userId: user.id, church: { id: church.id, plan, is_admin: church.is_admin === true }, entitled }
}
