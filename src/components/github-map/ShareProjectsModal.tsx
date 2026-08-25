import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { fetchMyMemberProfile } from '@/lib/member-profiles'
import { GITHUB_MAP_MIN_COMMITS } from '@/lib/github-map/types'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'

type ShareProjectsModalProps = {
  open: boolean
  onClose: () => void
}

const springPanel = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 360,
  mass: 0.8,
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.22 1.84 1.22 1.07 1.84 2.81 1.31 3.5 1 .11-.77.42-1.31.76-1.61-2.67-.3-5.47-1.31-5.47-5.85 0-1.29.46-2.34 1.22-3.17-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.28 1.21a9.5 9.5 0 0 1 5 0c2.28-1.53 3.28-1.21 3.28-1.21.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 4.55-2.81 5.55-5.49 5.84.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function oauthRedirectTo() {
  if (typeof window === 'undefined') return undefined
  const origin = window.location.origin
  if (window.location.pathname === '/proyectos') {
    return `${origin}/proyectos?thanks=proyectos`
  }
  return `${origin}/?thanks=proyectos#proyectos`
}

export function ShareProjectsModal({ open, onClose }: ShareProjectsModalProps) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const { hasAuthConfigured, isSigningIn, signInWithGitHub, session, user } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setSynced(false)
      setErrorMessage('')
      setIsSyncing(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [open])

  async function handlePrimaryAction() {
    setErrorMessage('')

    if (!hasAuthConfigured) {
      setErrorMessage(
        'Todavía no podemos conectar GitHub en este entorno. Probá más tarde.',
      )
      return
    }

    if (user && session) {
      setIsSyncing(true)
      try {
        await fetchMyMemberProfile(session, user)
        setSynced(true)
      } catch (error) {
        console.error('No se pudo sincronizar el perfil.', error)
        setErrorMessage('No pudimos sincronizar tu GitHub. Intentá de nuevo en un rato.')
      } finally {
        setIsSyncing(false)
      }
      return
    }

    try {
      await signInWithGitHub({ redirectTo: oauthRedirectTo() })
    } catch (error) {
      console.error('No se pudo iniciar sesión con GitHub.', error)
      setErrorMessage('No pudimos abrir GitHub. Intentá de nuevo.')
    }
  }

  const githubLogin =
    user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username ??
    null

  const primaryBusy = isSigningIn || isSyncing
  const primaryLabel = (() => {
    if (isSigningIn) return 'Abriendo GitHub…'
    if (isSyncing) return 'Sincronizando…'
    if (synced) return 'Listo'
    if (user) return 'Sincronizar mi GitHub'
    return 'Conectar con GitHub'
  })()

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          initial={false}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            aria-label="Cerrar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex h-auto max-h-[min(85svh,calc(100svh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={reduceMotion ? { duration: 0 } : { ...springPanel, delay: 0.1 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-neutral-950"
                >
                  Sumá tus proyectos al mapa
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Open source, en público, hecho en la comunidad.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-[10px] p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                aria-label="Cerrar"
                onClick={onClose}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <p className="text-pretty text-sm leading-relaxed text-neutral-600">
                Mostramos repos open source con deploy en vivo y actividad reciente.
                Conectá GitHub y listo — el mapa se actualiza solo en unas horas.
              </p>

              <h3 className="mt-4 text-sm font-semibold text-neutral-950">
                Requisitos
              </h3>
              <ul className="mt-2 list-none space-y-1.5 text-sm leading-relaxed text-neutral-600">
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
                  <span>Cuenta de GitHub conectada a CuyoConnect.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
                  <span>
                    Repo público con al menos{' '}
                    <strong className="font-medium text-neutral-800">
                      {GITHUB_MAP_MIN_COMMITS} commits
                    </strong>{' '}
                    en el último año.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
                  <span>
                    URL del deploy en la sección{' '}
                    <strong className="font-medium text-neutral-800">About</strong> del repo
                    (campo <strong className="font-medium text-neutral-800">Website</strong>).
                  </span>
                </li>
              </ul>

              <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/90 px-3.5 py-3 text-sm leading-relaxed text-neutral-600">
                <p className="font-medium text-neutral-900">Cómo cargar la URL del deploy</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 marker:text-neutral-400">
                  <li>Abrí tu repo en GitHub.</li>
                  <li>
                    En la barra lateral derecha, sección <strong className="font-medium text-neutral-800">About</strong>, tocá el ícono de engranaje.
                  </li>
                  <li>
                    En <strong className="font-medium text-neutral-800">Website</strong>, pegá la URL pública
                    (Vercel, Netlify, GitHub Pages, etc.).
                  </li>
                  <li>Guardá los cambios.</li>
                </ol>
              </div>

              <p className="mt-4 text-pretty text-sm leading-relaxed text-neutral-500">
                Para que aparezcan tus redes (LinkedIn, X, sitio web) al abrir un proyecto,
                tenelas cargadas en tu{' '}
                <a
                  href="https://github.com/settings/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-700 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-950"
                >
                  perfil de GitHub
                </a>
                . Las tomamos de ahí cuando sincronizamos.
              </p>

              {user && githubLogin ? (
                <p className="mt-4 rounded-xl bg-neutral-50 px-3.5 py-3 text-sm text-neutral-600">
                  Conectado como{' '}
                  <span className="font-medium text-neutral-900">@{githubLogin}</span>.
                  {synced
                    ? ' En las próximas horas revisamos tus repos y actualizamos el mapa.'
                    : ' Tocá sincronizar para que tomemos tus repos públicos.'}
                </p>
              ) : null}

              {synced ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-900"
                  role="status"
                >
                  Listo. Cuando corra la próxima sincronización, tu proyecto puede
                  aparecer acá.
                </p>
              ) : null}

              {errorMessage ? (
                <p className="mt-4 text-sm text-rose-600" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={() => void handlePrimaryAction()}
                disabled={primaryBusy || synced}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300',
                )}
              >
                <GitHubMark className="h-4 w-4" />
                {primaryLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
