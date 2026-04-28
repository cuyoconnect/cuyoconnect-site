import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ExternalLink, MapPin } from 'lucide-react'
import { toString as qrToSvgString } from 'qrcode'

import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import {
  getMemberDisplayName,
  MEMBER_PROFILE_SOCIAL_LINKS,
  type MemberProfile,
  type MemberProfileSocialLinkId,
} from '@/lib/member-profiles'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

type MemberProfilePageProps = {
  slug: string
  initialProfile?: MemberProfile | null
  initialError?: string
}

type LoadState =
  | { status: 'ready'; profile: MemberProfile; error: '' }
  | { status: 'not-found'; profile: null; error: '' }
  | { status: 'error'; profile: null; error: string }

function ProfileSocialIcon({
  id,
  className,
}: {
  id: MemberProfileSocialLinkId
  className?: string
}) {
  const iconClass = cn('h-5 w-5 shrink-0', className)
  switch (id) {
    case 'github':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    case 'x':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    default:
      return null
  }
}

function ProfileSocialMarkerTextureDefs() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden focusable="false">
      <defs>
        <filter id="profile-social-marker-roughen" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08 0.18" numOctaves="4" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="3.4" />
        </filter>
        <filter id="profile-social-ink-roughen" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="0.75" />
        </filter>
        <mask id="profile-social-marker-wear" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="64">
          <rect width="80" height="64" fill="white" />
          <path d="M9 18c13-5 33-7 58-3" stroke="black" strokeWidth="2.6" strokeLinecap="round" opacity="0.38" />
          <path d="M14 42c16 4 30 4 52-2" stroke="black" strokeWidth="2.2" strokeLinecap="round" opacity="0.28" />
          <path d="M20 28h9M43 22h7M51 36h12M28 47h7" stroke="black" strokeWidth="2.8" strokeLinecap="round" opacity="0.34" />
          <circle cx="17" cy="34" r="2.4" fill="black" opacity="0.32" />
          <circle cx="61" cy="25" r="1.9" fill="black" opacity="0.3" />
          <circle cx="39" cy="45" r="1.4" fill="black" opacity="0.24" />
        </mask>
      </defs>
    </svg>
  )
}

function ProfileSocialMarkerSpot({ className }: { className?: string }) {
  return (
    <svg
      className={cn('absolute inset-0 overflow-visible', className)}
      viewBox="0 0 80 64"
      fill="none"
      aria-hidden
    >
      <g filter="url(#profile-social-marker-roughen)" mask="url(#profile-social-marker-wear)">
        <path
          d="M12.5 14.5C23 7.8 44.7 6.1 63.5 11.9C73.8 15.1 74 27.5 66.8 37.1C58.5 48.1 38.9 54.5 22.8 50.4C9.8 47.1 4.2 34.7 8.1 25.1C9.4 21.9 10.6 17.7 12.5 14.5Z"
          fill="#fae673"
        />
        <path
          d="M16 18.9C29.8 11.8 49.9 11.7 62.6 16.4C69 18.8 68.7 25.7 63.8 31.8C55.7 41.8 35.4 47.7 20.8 43.5C10.8 40.6 9.4 28.4 16 18.9Z"
          fill="#ebd85a"
          opacity="0.72"
        />
      </g>
    </svg>
  )
}

export function CuyoQrCode({ value }: { value: string }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const trimmed = value.trim()
    if (!trimmed) return

    let cancelled = false

    void (async () => {
      try {
        const nextSvg = await qrToSvgString(trimmed, {
          type: 'svg',
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 220,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        if (!cancelled) setSvg(nextSvg)
      } catch (error) {
        console.error('No se pudo generar el QR.', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[13.75rem] items-center justify-center rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
      {svg ? (
        <div
          className="[&_svg]:h-full [&_svg]:w-full"
          aria-label="QR del perfil"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-[1.5rem] bg-neutral-100" />
      )}
      <div className="pointer-events-none absolute inset-1 rounded-[1.7rem] border border-black/[0.04]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
      </div>
    </div>
  )
}

const springPanel = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 360,
  mass: 0.8,
}

function InteractiveProfileCardFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'relative [&_a]:relative [&_a]:z-10 rounded-[2rem] bg-[rgba(255,255,255,0.97)]',
        'shadow-[0_0_165px_68px_rgba(255,255,255,0.78),_0_0_330px_138px_rgba(255,255,255,0.52),_0_0_490px_195px_rgba(255,255,255,0.32),_0_40px_130px_-14px_rgba(15,_23,_42,_0.048),_0_80px_210px_-42px_rgba(255,_255,_255,_0.62),_0_120px_300px_-56px_rgba(15,_23,_42,_0.03)]',
      )}
    >
      {children}
    </div>
  )
}

export function ProfileShareQrModal({
  open,
  onClose,
  publicUrl,
}: {
  open: boolean
  onClose: () => void
  publicUrl: string
}) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          initial={false}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/35"
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
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={reduceMotion ? { duration: 0 } : { ...springPanel, delay: 0.08 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <h2
                id={titleId}
                className="text-base font-semibold tracking-tight text-neutral-950"
              >
                Compartir tu perfil
              </h2>
              <button
                type="button"
                className="shrink-0 rounded-[10px] p-2 text-neutral-500 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:duration-[240ms] hover:delay-0 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
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
            <div className="px-5 pb-6 pt-2 text-center">
              <CuyoQrCode value={publicUrl} />
              <p className="mt-4 text-sm font-medium text-neutral-950">
                Escaneame para compartir
              </p>
              <p className="mt-1 break-all text-xs leading-relaxed text-neutral-500">
                {publicUrl}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ProfileShell({
  children,
  showSideCircuitDecor = true,
}: {
  children: ReactNode
  showSideCircuitDecor?: boolean
}) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-white px-4 pb-16 pt-24 text-neutral-950 sm:px-6 sm:pb-20 sm:pt-28">
      {showSideCircuitDecor ? <SideCircuitDecor /> : null}
      <div
        className={cn(
          'relative z-10 mx-auto flex w-full flex-col justify-center',
          HERO_CONTENT_WIDTH_CLASS,
        )}
      >
        <div className="flex min-h-[calc(100svh-10rem)] w-full flex-col justify-center sm:min-h-[calc(100svh-12rem)]">
          {children}
        </div>
      </div>
    </section>
  )
}

function StateMessage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <ProfileShell>
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-medium tracking-[0.18em] uppercase text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
          {description}
        </p>
        <a
          href="/miembros"
          className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Ver miembros
        </a>
      </div>
    </ProfileShell>
  )
}

export function MemberProfilePage({
  slug,
  initialProfile = null,
  initialError = '',
}: MemberProfilePageProps) {
  const state: LoadState = initialError
    ? { status: 'error', profile: null, error: initialError }
    : initialProfile
      ? { status: 'ready', profile: initialProfile, error: '' }
      : { status: 'not-found', profile: null, error: '' }
  const profile = state.profile

  if (state.status === 'not-found') {
    return (
      <StateMessage
        eyebrow="Perfil no encontrado"
        title="Todavia no hay conexion para este slash"
        description="La persona puede no haber publicado su perfil o el enlace puede estar escrito distinto."
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StateMessage
        eyebrow="CuyoConnect"
        title="No pudimos cargar el perfil"
        description={state.error}
      />
    )
  }

  if (!profile) return null

  const displayName = getMemberDisplayName(profile)
  const socialLinks = MEMBER_PROFILE_SOCIAL_LINKS.flatMap((link) => {
    const href = profile[link.field]
    return typeof href === 'string' && href.trim() ? [{ ...link, href }] : []
  })

  return (
    <ProfileShell>
      <article className="mx-auto w-full max-w-xl">
        <ProfileSocialMarkerTextureDefs />
        <InteractiveProfileCardFrame>
          <div className="relative p-5 sm:p-6">
            <header className="flex flex-col items-center text-center">
              <div className="flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                <div className="shrink-0">
                  <img
                    src={profile.avatar_url || '/logo.png'}
                    alt=""
                    width={112}
                    height={112}
                    className="h-28 w-28 rounded-full border border-white/50 bg-white/20 object-cover shadow-[0_18px_44px_-24px_rgba(15,23,42,0.35)]"
                  />
                </div>
                <div className="flex min-w-0 flex-col items-center text-center sm:items-start sm:text-left sm:pt-0.5">
                  <h1 className="text-balance text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl [&::selection]:bg-[#fae673] [&::selection]:text-neutral-950">
                    {displayName}
                  </h1>
                  <p className="mt-2 text-center text-sm text-neutral-500 sm:text-left">
                    @{profile.slug}
                  </p>
                </div>
              </div>
              {profile.location ? (
                <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {profile.location}
                </p>
              ) : null}
            </header>

            <div className="mt-6 flex justify-center">
              {socialLinks.length > 0 ? (
                <nav
                  className="flex w-full flex-row flex-nowrap items-start justify-center gap-4 sm:gap-8"
                  aria-label="Links sociales"
                >
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex min-w-20 flex-col items-center gap-3 text-center text-neutral-950 transition-opacity duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:opacity-80 hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-neutral-400"
                      aria-label={`Abrir ${link.label}`}
                      title={link.label}
                    >
                      <span className="relative flex h-16 w-20 items-center justify-center">
                        <ProfileSocialMarkerSpot className="-rotate-6 scale-95 opacity-95 transition-transform duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:-rotate-3 group-hover:scale-100 group-hover:duration-[240ms] group-hover:delay-0" />
                        <ProfileSocialIcon
                          id={link.id}
                          className="relative h-9 w-9 text-neutral-950 [filter:url(#profile-social-ink-roughen)] transition-transform duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105 group-hover:duration-[240ms] group-hover:delay-0"
                        />
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs font-medium leading-none underline decoration-neutral-950/45 decoration-1 underline-offset-4">
                          {link.label}
                        </span>
                        <ExternalLink
                          className="h-3.5 w-3.5 shrink-0 text-neutral-950/50 transition-colors duration-[420ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-neutral-950/80 group-hover:duration-[240ms]"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </span>
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-4 text-center text-sm text-neutral-500">
                  Este perfil todavia no agrego links.
                </p>
              )}
            </div>
          </div>
        </InteractiveProfileCardFrame>
      </article>
    </ProfileShell>
  )
}
