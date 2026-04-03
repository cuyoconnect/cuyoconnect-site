import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
)?.trim()

export const hasSupabaseAuthEnv = Boolean(supabaseUrl && supabaseAnonKey)

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!hasSupabaseAuthEnv) return null

  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return browserClient
}

export function getSupabaseOAuthRedirectTo() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/`
}
