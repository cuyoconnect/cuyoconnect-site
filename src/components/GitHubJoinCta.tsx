import { useState } from 'react'

import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'

type GitHubJoinCtaProps = {
  className?: string
  /**
   * `community`: CTA para sumarse a la galería (default).
   * `speakers`: flujo de propuestas de charla.
   */
  intent?: 'community' | 'speakers'
  /**
   * Solo `intent="speakers"`.
   * `footer`: solo botón o sesión compacta (fila de acciones con enviar).
   * `panel`: texto + botón (legacy).
   * `standalone`: tarjeta centrada aparte.
   */
  speakersLayout?: 'standalone' | 'panel' | 'footer'
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.22 1.84 1.22 1.07 1.84 2.81 1.31 3.5 1 .11-.77.42-1.31.76-1.61-2.67-.3-5.47-1.31-5.47-5.85 0-1.29.46-2.34 1.22-3.17-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.28 1.21a11.6 11.6 0 0 1 5.97 0c2.28-1.53 3.28-1.21 3.28-1.21.65 1.64.24 2.86.12 3.16.76.83 1.22 1.88 1.22 3.17 0 4.55-2.81 5.55-5.49 5.84.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

export function GitHubJoinCta({
  className,
  intent = 'community',
  speakersLayout = 'standalone',
}: GitHubJoinCtaProps) {
  const { hasAuthConfigured, isSigningIn, signInWithGitHub, user } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  async function handleJoin() {
    setErrorMessage('')

    try {
      if (typeof window !== 'undefined') {
        const origin = window.location.origin
        if (intent === 'community') {
          await signInWithGitHub({
            redirectTo: `${origin}/speakers?thanks=miembros`,
          })
          return
        }
        if (intent === 'speakers') {
          await signInWithGitHub({
            redirectTo: `${origin}/speakers`,
          })
          return
        }
      }
      await signInWithGitHub()
    } catch (error) {
      console.error('No se pudo iniciar sesion con GitHub.', error)
      setErrorMessage('No pudimos abrir el login con GitHub. Intenta nuevamente.')
    }
  }

  if (!hasAuthConfigured) {
    if (intent === 'speakers') {
      return (
        <div
          className={cn(
            'rounded-2xl border border-dashed border-amber-200/90 bg-amber-50/80 px-5 py-4 text-sm text-amber-950 sm:py-5',
            className,
          )}
          role="status"
        >
          Hace falta configurar Supabase en este sitio (variables{' '}
          <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
            PUBLIC_SUPABASE_*
          </code>
          ) para guardar propuestas.
        </div>
      )
    }
    return (
      <div
        className={cn(
          'rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-4 text-sm text-neutral-600',
          className,
        )}
      >
        Configura `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`, o usa el
        bridge transicional desde `VITE_*`, para habilitar el acceso con GitHub.
      </div>
    )
  }

  if (user) {
    if (intent === 'speakers') {
      const meta = user.user_metadata as Record<string, string | undefined>
      const login = meta.user_name ?? meta.preferred_username
      const avatarUrl = meta.avatar_url

      if (speakersLayout === 'footer') {
        return (
          <div
            className={cn(
              'flex min-w-0 flex-wrap items-center gap-2.5',
              className,
            )}
            role="status"
          >
            {typeof avatarUrl === 'string' ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-neutral-200/80 object-cover"
              />
            ) : null}
            <span className="truncate text-sm text-neutral-600">
              {login ? `@${login}` : user.email ?? 'Sesión activa'}
            </span>
          </div>
        )
      }

      return (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3 sm:gap-4',
            className,
          )}
          role="status"
        >
          {typeof avatarUrl === 'string' ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-neutral-200/80 object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-950">
              {login ? `@${login}` : user.email ?? 'Sesión activa'}
            </p>
            <p className="text-sm text-neutral-500">Conectado con GitHub</p>
          </div>
        </div>
      )
    }

    return (
      <p
        className={cn('text-sm text-neutral-500', className)}
        role="status"
      >
        Ya sos parte de la comunidad.
      </p>
    )
  }

  if (intent === 'speakers') {
    if (speakersLayout === 'footer') {
      return (
        <div className={cn('min-w-0', className)}>
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={isSigningIn}
            className={cn(
              'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:border-neutral-400 hover:bg-neutral-50 hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:w-auto',
            )}
          >
            <GitHubMark className="h-4 w-4" />
            <span>
              {isSigningIn ? 'Abriendo GitHub…' : 'Continuar con GitHub'}
            </span>
          </button>
          {errorMessage ? (
            <p className="mt-2 text-sm text-rose-600">{errorMessage}</p>
          ) : null}
        </div>
      )
    }

    if (speakersLayout === 'panel') {
      return (
        <div className={cn('flex flex-col gap-4', className)}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <p className="min-w-0 max-w-xl text-pretty text-sm leading-relaxed text-neutral-600 sm:pt-0.5">
              GitHub nos permite guardar la propuesta con tu perfil.
            </p>
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={isSigningIn}
              className={cn(
                'inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:border-neutral-400 hover:bg-neutral-50 hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:w-auto sm:self-start sm:py-2.5',
              )}
            >
              <GitHubMark className="h-4 w-4" />
              <span>
                {isSigningIn ? 'Abriendo GitHub…' : 'Continuar con GitHub'}
              </span>
            </button>
          </div>
          {errorMessage ? (
            <p className="text-sm text-rose-600">{errorMessage}</p>
          ) : null}
        </div>
      )
    }

    return (
      <div
        className={cn(
          'mx-auto max-w-md rounded-2xl border border-neutral-200/90 bg-white px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10',
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Paso 1 de 2
        </p>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
          Identificarte con GitHub
        </h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-neutral-600">
          Así sabemos quién envía la propuesta. El paso siguiente es escribir de
          qué querés hablar y cuánto tiempo te llevaría.
        </p>
        <ul className="mt-4 list-none space-y-1.5 text-left text-sm text-neutral-600">
          <li className="flex gap-2">
            <span className="font-semibold text-neutral-900">1.</span>
            GitHub (este paso)
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-neutral-900">2.</span>
            Texto de la charla + duración estimada
          </li>
        </ul>
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={isSigningIn}
          className={cn(
            'mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 py-3.5 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:py-3',
          )}
        >
          <GitHubMark className="h-4 w-4" />
          <span>
            {isSigningIn ? 'Abriendo GitHub…' : 'Continuar con GitHub'}
          </span>
        </button>
        {errorMessage ? (
          <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <button
        type="button"
        onClick={() => void handleJoin()}
        disabled={isSigningIn}
        className={cn(
          'inline-flex w-fit max-w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:px-6',
        )}
      >
        <GitHubMark className="h-4 w-4" />
        <span>
          {isSigningIn
            ? 'Redirigiendo a GitHub...'
            : 'Ser parte de CuyoConnect'}
        </span>
      </button>

      {errorMessage ? (
        <p className="text-sm text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  )
}
