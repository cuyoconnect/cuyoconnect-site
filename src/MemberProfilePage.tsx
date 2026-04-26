import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'

import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import {
  fetchMemberProfileBySlug,
  getMemberDisplayName,
  getMemberPublicUrl,
  MEMBER_PROFILE_SOCIAL_LINKS,
  type MemberProfile,
} from '@/lib/member-profiles'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

type MemberProfilePageProps = {
  slug: string
}

type LoadState =
  | { status: 'loading'; profile: null; error: '' }
  | { status: 'ready'; profile: MemberProfile; error: '' }
  | { status: 'not-found'; profile: null; error: '' }
  | { status: 'error'; profile: null; error: string }

type QrCodeModule = {
  toString: (text: string, options: Record<string, unknown>) => Promise<string>
}

const FALLBACK_SITE_URL = 'https://cuyoconnect.com'

export function CuyoQrCode({ value }: { value: string }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const qrcode = (await import('qrcode')) as QrCodeModule
        const nextSvg = await qrcode.toString(value, {
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

function ProfileShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-white px-4 pb-16 pt-24 text-neutral-950 sm:px-6 sm:pb-20 sm:pt-28">
      <SideCircuitDecor />
      <div className={cn('relative z-10 mx-auto w-full', HERO_CONTENT_WIDTH_CLASS)}>
        {children}
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

export function MemberProfilePage({ slug }: MemberProfilePageProps) {
  const [state, setState] = useState<LoadState>({
    status: 'loading',
    profile: null,
    error: '',
  })
  const [origin] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : FALLBACK_SITE_URL,
  )

  useEffect(() => {
    let cancelled = false

    void fetchMemberProfileBySlug(slug)
      .then((profile) => {
        if (cancelled) return
        setState(
          profile
            ? { status: 'ready', profile, error: '' }
            : { status: 'not-found', profile: null, error: '' },
        )
      })
      .catch((error) => {
        if (cancelled) return
        console.error('No se pudo cargar el perfil publico.', error)
        setState({
          status: 'error',
          profile: null,
          error: 'No pudimos cargar este perfil. Intenta de nuevo en unos minutos.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const profile = state.profile
  const publicUrl = useMemo(
    () => getMemberPublicUrl(profile?.slug ?? slug, origin),
    [origin, profile?.slug, slug],
  )

  if (state.status === 'loading') {
    return (
      <ProfileShell>
        <div className="mx-auto max-w-xl animate-pulse rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mx-auto h-24 w-24 rounded-full bg-neutral-100" />
          <div className="mx-auto mt-6 h-7 w-2/3 rounded-full bg-neutral-100" />
          <div className="mx-auto mt-3 h-4 w-1/2 rounded-full bg-neutral-100" />
          <div className="mt-8 space-y-3">
            <div className="h-12 rounded-full bg-neutral-100" />
            <div className="h-12 rounded-full bg-neutral-100" />
            <div className="h-12 rounded-full bg-neutral-100" />
          </div>
        </div>
      </ProfileShell>
    )
  }

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
      <article className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="rounded-[2rem] border border-neutral-200/90 bg-white p-6 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.35)] sm:p-8">
          <header className="flex flex-col items-center text-center">
            <img
              src={profile.avatar_url || '/logo.png'}
              alt=""
              width={112}
              height={112}
              className="h-28 w-28 rounded-full border border-neutral-200 bg-neutral-50 object-cover"
            />
            <p className="mt-6 text-sm font-medium tracking-[0.18em] uppercase text-neutral-500">
              Miembro CuyoConnect
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">@{profile.slug}</p>
            {profile.location ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </p>
            ) : null}
            {profile.bio ? (
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-neutral-600">
                {profile.bio}
              </p>
            ) : null}
          </header>

          <div className="mt-8 flex flex-col gap-3">
            {socialLinks.length > 0 ? (
              socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:border-neutral-300 hover:bg-neutral-50 hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-neutral-700" />
                </a>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-4 text-center text-sm text-neutral-500">
                Este perfil todavia no agrego links.
              </p>
            )}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-neutral-200/90 bg-neutral-50/80 p-5 text-center lg:sticky lg:top-28">
          <CuyoQrCode value={publicUrl} />
          <p className="mt-4 text-sm font-medium text-neutral-950">
            Escaneame para compartir
          </p>
          <p className="mt-1 break-all text-xs leading-relaxed text-neutral-500">
            {publicUrl}
          </p>
        </aside>
      </article>
    </ProfileShell>
  )
}
