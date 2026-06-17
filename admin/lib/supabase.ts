import { createBrowserClient, createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Service role client — bypasses RLS, server-side only, never expose to browser
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Browser client — uses cookies so middleware can read the session
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client (Server Components, middleware, API routes)
export function createServerClient(cookieStore: {
  get(name: string): { name: string; value: string } | undefined
  set(name: string, value: string, options: CookieOptions): void
  delete(name: string): void
}) {
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set(name, value, options) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set(name, '', { ...options, maxAge: 0 }) } catch {}
      },
    },
  })
}
