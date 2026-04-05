import { useState } from 'react'

import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'

type GitHubJoinCtaProps = {
  className?: string
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

export function GitHubJoinCta({ className }: GitHubJoinCtaProps) {
  const { hasAuthConfigured, isAuthReady, isSigningIn, signInWithGitHub, user } =
    useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  async function handleJoin() {
    setErrorMessage('')

    try {
      await signInWithGitHub()
    } catch (error) {
      console.error('No se pudo iniciar sesion con GitHub.', error)
      setErrorMessage('No pudimos abrir el login con GitHub. Intenta nuevamente.')
    }
  }

  if (!hasAuthConfigured) {
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
    return (
      <p
        className={cn('text-sm text-neutral-500', className)}
        role="status"
      >
        Ya sos parte de la comunidad.
      </p>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <button
        type="button"
        onClick={() => void handleJoin()}
        disabled={!isAuthReady || isSigningIn}
        className={cn(
          'inline-flex w-fit max-w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:px-6',
        )}
      >
        <GitHubMark className="h-4 w-4" />
        <span>
          {isSigningIn
            ? 'Redirigiendo a GitHub...'
            : !isAuthReady
              ? 'Preparando acceso...'
              : 'Ser parte de CuyoConnect'}
        </span>
      </button>

      <p className="text-sm text-neutral-600">
        Inicia sesión con GitHub y tu avatar aparecerá automáticamente.
      </p>

      {errorMessage ? (
        <p className="text-sm text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  )
}
