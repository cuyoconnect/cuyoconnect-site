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

/**
 * Tras GitHub OAuth, Supabase redirige a esta URL (o a la que pase `signInWithGitHub`).
 * Tiene que estar listada en Supabase → Authentication → URL Configuration
 * → Redirect URLs (p. ej. `http://localhost:4321/**` o `https://cuyoconnect.com/**`
 * para incluir `/speakers` y `/speakers?thanks=miembros`).
 * Si no coincide con ninguna URL permitida, Supabase usa el "Site URL"
 * (suele ser producción, p. ej. https://cuyoconnect.com).
 */
export function getSupabaseOAuthRedirectTo() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/`
}
