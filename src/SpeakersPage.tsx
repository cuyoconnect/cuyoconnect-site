import { useEffect, useId, useMemo, useState } from 'react'

import { BlurText } from '@/components/ui/blur-text'
import { GitHubJoinCta } from '@/components/GitHubJoinCta'
import { SpeakerThanksOverlay } from '@/components/SpeakerThanksOverlay'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import {
  submitSpeakerProposal,
  type SpeakerProposalDuration,
} from '@/lib/speaker-proposals'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'

const PAGE_HEADING = 'Querés ser speaker'

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
] as const

const SPEAKERS_DRAFT_KEY = 'cuyoconnect:speakers-draft-v1'

function parseDraft(raw: string | null): {
  topics: string
  duration: (typeof DURATION_OPTIONS)[number]['value']
} | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as { topics?: unknown; duration?: unknown }
    const topics = typeof data.topics === 'string' ? data.topics : ''
    const d = data.duration
    const duration =
      d === '30' || d === '45' || d === '60' ? d : DURATION_OPTIONS[0]!.value
    return { topics, duration }
  } catch {
    return null
  }
}

export function SpeakersPage() {
  const topicsId = useId()
  const durationId = useId()
  const { user, hasAuthConfigured, signInWithGitHub, isSigningIn } = useAuth()

  const [topics, setTopics] = useState('')
  const [duration, setDuration] = useState<(typeof DURATION_OPTIONS)[number]['value']>('30')
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [thanksOpen, setThanksOpen] = useState(false)
  const [thanksVariant, setThanksVariant] = useState<'proposal' | 'community'>(
    'proposal',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const titleTailHighlight = useMemo(() => heroTopicTailHighlight(1), [])

  const meta = user?.user_metadata as Record<string, string | undefined> | undefined
  const login = meta?.user_name ?? meta?.preferred_username
  const avatarUrl = meta?.avatar_url

  useEffect(() => {
    if (typeof window === 'undefined') return
    const parsed = parseDraft(sessionStorage.getItem(SPEAKERS_DRAFT_KEY))
    if (parsed) {
      setTopics(parsed.topics)
      setDuration(parsed.duration)
    }
    setDraftHydrated(true)
  }, [])

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return
    sessionStorage.setItem(
      SPEAKERS_DRAFT_KEY,
      JSON.stringify({ topics, duration }),
    )
  }, [topics, duration, draftHydrated])

  /** Tras OAuth desde la galería (landing), Supabase redirige a /speakers?thanks=miembros */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('thanks') !== 'miembros') return

    const t = window.setTimeout(() => {
      setThanksVariant('community')
      setThanksOpen(true)
      params.delete('thanks')
      const qs = params.toString()
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next)
    }, 0)

    return () => window.clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    if (!hasAuthConfigured) {
      setErrorMessage(
        'El login con GitHub no está configurado en este entorno. No podemos guardar la propuesta desde acá.',
      )
      return
    }

    const trimmed = topics.trim()
    if (!trimmed) {
      setErrorMessage('Contanos sobre qué te gustaría hablar.')
      return
    }

    if (!user) {
      try {
        await signInWithGitHub({
          redirectTo: `${window.location.origin}/speakers`,
        })
      } catch (err) {
        console.error('No se pudo iniciar sesión con GitHub.', err)
        setErrorMessage(
          'No pudimos abrir el login con GitHub. Intentá de nuevo.',
        )
      }
      return
    }

    const durationMinutes = Number(duration) as SpeakerProposalDuration
    setIsSubmitting(true)
    try {
      await submitSpeakerProposal({
        topics: trimmed,
        durationMinutes,
        user,
      })
      setThanksVariant('proposal')
      setThanksOpen(true)
      setTopics('')
      setDuration(DURATION_OPTIONS[0]!.value)
      try {
        sessionStorage.removeItem(SPEAKERS_DRAFT_KEY)
      } catch {
        /* ignore */
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No pudimos guardar tu propuesta.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const primaryBusy = isSigningIn || isSubmitting
  const submitDisabled = !hasAuthConfigured || primaryBusy

  const primaryLabel = (() => {
    if (isSigningIn) return 'Abriendo GitHub…'
    if (isSubmitting) return 'Guardando…'
    if (!user) return 'Enviar con GitHub'
    return 'Enviar propuesta'
  })()

  return (
    <div className="relative overflow-x-hidden bg-white text-neutral-950 [color-scheme:light]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,0,0,0.04),transparent_70%)]"
        aria-hidden
      />

      <section
        className={cn('relative isolate py-16 sm:py-20', 'px-4 sm:px-6')}
        aria-labelledby="speakers-heading"
      >
        <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'relative z-10 min-w-0')}>
          <h1
            id="speakers-heading"
            className={cn(
              'text-balance text-2xl font-semibold tracking-tight text-neutral-950',
              'sm:text-3xl md:text-4xl',
            )}
          >
            <BlurText
              text={PAGE_HEADING}
              className="text-inherit"
              segmentDelay={0.14}
              duration={0.95}
              tailHighlight={titleTailHighlight}
            />
          </h1>

          {!hasAuthConfigured ? (
            <GitHubJoinCta intent="speakers" className="mt-12" />
          ) : (
            <form
              className="mt-10 max-w-xl sm:mt-12"
              onSubmit={(e) => void handleSubmit(e)}
              noValidate
            >
              <div className="flex flex-col gap-8">
                <div>
                  <label
                    htmlFor={topicsId}
                    className="mb-2 block text-sm font-medium text-neutral-950"
                  >
                    Tema o idea de la charla
                  </label>
                  <p className="mb-3 text-sm text-neutral-500">
                    Contá el enfoque, el público al que apunta o qué te gustaría
                    que se lleven quienes escuchen.
                  </p>
                  <textarea
                    id={topicsId}
                    name="topics"
                    rows={6}
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="Escribí acá…"
                    className={cn(
                      'min-h-[10rem] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-base leading-relaxed text-neutral-950',
                      'placeholder:text-neutral-400',
                      'focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/70',
                    )}
                    autoComplete="off"
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <label
                    htmlFor={durationId}
                    className="text-sm text-neutral-500"
                  >
                    Duración
                  </label>
                  <select
                    id={durationId}
                    name="duration"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value as (typeof DURATION_OPTIONS)[number]['value'])
                    }
                    className={cn(
                      'cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-[0.2em]',
                      'focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-300',
                    )}
                  >
                    {DURATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {errorMessage ? (
                  <p className="text-sm text-rose-600" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                {user ? (
                  <div
                    className="flex flex-wrap items-center gap-2.5 text-sm text-neutral-600"
                    role="status"
                  >
                    {typeof avatarUrl === 'string' ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full border border-neutral-200/80 object-cover"
                      />
                    ) : null}
                    <span className="truncate">
                      {login ? `@${login}` : user.email ?? 'Sesión con GitHub'}
                    </span>
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    className={cn(
                      'inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-auto',
                      'disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300',
                    )}
                  >
                    {primaryLabel}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <SpeakerThanksOverlay
        open={thanksOpen}
        variant={thanksVariant}
        onClose={() => setThanksOpen(false)}
      />
    </div>
  )
}
