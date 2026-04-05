import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim()
let supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim()

let browserClient: SupabaseClient | null = null

export function configureSupabaseAuthEnv(config: {
  url?: string
  anonKey?: string
}) {
  const nextUrl = config.url?.trim()
  const nextAnonKey = config.anonKey?.trim()
  if (!nextUrl || !nextAnonKey) return

  if (supabaseUrl !== nextUrl || supabaseAnonKey !== nextAnonKey) {
    supabaseUrl = nextUrl
    supabaseAnonKey = nextAnonKey
    browserClient = null
  }
}

export function hasSupabaseAuthEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseAuthEnv()) return null

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
