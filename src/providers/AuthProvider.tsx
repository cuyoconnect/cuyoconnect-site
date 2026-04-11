import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import {
  configureSupabaseAuthEnv,
  getSupabaseBrowserClient,
  getSupabaseOAuthRedirectTo,
  hasSupabaseAuthEnv,
} from '@/lib/supabase'

type AuthContextValue = {
  hasAuthConfigured: boolean
  isAuthReady: boolean
  isSigningIn: boolean
  session: Session | null
  user: User | null
  signInWithGitHub: (options?: { redirectTo?: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  supabaseUrl,
  supabaseAnonKey,
}: {
  children: ReactNode
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  configureSupabaseAuthEnv({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  })

  const authConfigured = hasSupabaseAuthEnv()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  /** No bloquear botones de OAuth hasta que termine `getSession` (puede colgarse o tardar mucho). */
  const [isAuthReady, setIsAuthReady] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return
    }

    let ignore = false

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (ignore) return
        if (error) {
          console.error('No se pudo restaurar la sesion de Supabase.', error)
        }

        const nextSession = data.session ?? null
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
      })
      .catch((error) => {
        if (ignore) return
        console.error('Fallo inesperado restaurando la sesion.', error)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setIsAuthReady(true)
      setIsSigningIn(false)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      hasAuthConfigured: authConfigured,
      isAuthReady,
      isSigningIn,
      session,
      user,
      async signInWithGitHub(options?: { redirectTo?: string }) {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return

        setIsSigningIn(true)

        const redirectTo =
          options?.redirectTo?.trim() || getSupabaseOAuthRedirectTo()

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo,
            scopes: 'read:user user:email',
          },
        })

        if (error) {
          setIsSigningIn(false)
          throw error
        }
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return

        const { error } = await supabase.auth.signOut()
        if (error) {
          throw error
        }
      },
    }),
    [authConfigured, isAuthReady, isSigningIn, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }
  return context
}
