import { Marquee } from '@/components/ui/marquee'
import { TEAM } from '@/data/team'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { COMMUNITY_LINKS } from '@/lib/community-links'
import { cn } from '@/lib/utils'

const TEAM_EXTERNAL_DEFAULT_HREF =
  COMMUNITY_LINKS.find((l) => l.id === 'linkedin')?.href ??
  'https://www.linkedin.com/company/cuyoconnect/'

function TeamCardExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) {
    const w = parts[0]!
    return w.slice(0, Math.min(2, w.length)).toUpperCase()
  }
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase()
}

export function TeamSection() {
  return (
    <section
      id="equipo"
      className={cn(
        'relative w-full overflow-hidden bg-white py-12 text-neutral-900 [color-scheme:light] md:py-24',
      )}
      aria-labelledby="equipo-heading"
    >
      <div className="relative z-10 w-full">
        <div
          className={cn(
            'mb-16 flex w-full min-w-0 flex-col items-center text-center',
            'mx-auto',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <h2
            id="equipo-heading"
            className="mb-4 text-balance text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl"
          >
            Equipo CuyoConnect
          </h2>
          <p className="max-w-2xl text-pretty text-neutral-600 sm:text-lg">
            Las personas que organizamos encuentros, contenido y la comunidad
            en Cuyo.
          </p>
        </div>

        <div
          className={cn(
            'relative w-full min-w-0',
            'mx-auto',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-10 bg-[linear-gradient(90deg,rgb(255_255_255)_0%,transparent_100%)] sm:w-14" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-10 bg-[linear-gradient(270deg,rgb(255_255_255)_0%,transparent_100%)] sm:w-14" />

          <Marquee className="cc-team-marquee [--gap:1.5rem] [--marquee-duration:55s]">
            {TEAM.map((member) => {
              const externalHref = member.href ?? TEAM_EXTERNAL_DEFAULT_HREF
              return (
                <div
                  className="cc-team-card group relative flex w-64 shrink-0 flex-col"
                  key={`${member.name}-${member.role}`}
                >
                  <div
                    className={cn(
                      'relative aspect-square w-full overflow-hidden rounded-2xl',
                      'bg-neutral-100 ring-1 ring-neutral-200/80',
                    )}
                  >
                    {member.imageSrc ? (
                      <img
                        src={member.imageSrc}
                        alt=""
                        width={512}
                        height={512}
                        decoding="async"
                        loading="lazy"
                        className="cc-team-photo h-full w-full object-cover transition-[filter] duration-300"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center bg-neutral-100 text-2xl font-semibold text-neutral-500"
                        aria-hidden
                      >
                        {memberInitials(member.name)}
                      </div>
                    )}
                    {member.imageSrc ? (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] rounded-b-2xl"
                        aria-hidden
                      >
                        <div className="rounded-b-2xl bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pt-10 pb-2.5 sm:pt-12 sm:pb-3">
                          <p className="font-semibold text-white">{member.name}</p>
                          <p className="mt-0.5 text-sm text-white/90">{member.role}</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] rounded-b-2xl border-t border-white/60 bg-neutral-100/95 px-3 py-2.5 backdrop-blur-[2px]"
                        aria-hidden
                      >
                        <p className="font-semibold text-neutral-950">{member.name}</p>
                        <p className="text-sm text-neutral-600">{member.role}</p>
                      </div>
                    )}
                    <a
                      href={externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'absolute inset-0 z-[2] rounded-2xl outline-none',
                        'focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2',
                        'focus-visible:ring-offset-white',
                      )}
                      aria-label={`${member.name}, ${member.role}. Enlace externo (se abre en una pestaña nueva)`}
                    >
                      <span
                        className={cn(
                          'pointer-events-none absolute top-2 right-2 flex size-8 items-center justify-center',
                          'rounded-full bg-white/70 text-neutral-800/85 ring-1 ring-black/[0.06]',
                          'backdrop-blur-[6px] transition-[opacity,transform] duration-300 ease-out',
                          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                          'shadow-sm',
                        )}
                        aria-hidden
                      >
                        <TeamCardExternalIcon className="size-3.5 stroke-[1.75]" />
                      </span>
                    </a>
                  </div>
                </div>
              )
            })}
          </Marquee>
        </div>
      </div>
    </section>
  )
}
