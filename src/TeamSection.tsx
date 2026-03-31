import { TEAM, type TeamMember } from '@/data/team'
import { COMMUNITY_LINKS, type CommunityLinkId } from '@/lib/community-links'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80'

function communityHref(id: CommunityLinkId) {
  return COMMUNITY_LINKS.find((l) => l.id === id)!.href
}

function memberSocialUrls(member: TeamMember) {
  return {
    linkedin: member.social?.linkedin ?? member.href ?? communityHref('linkedin'),
    x: member.social?.x ?? communityHref('x'),
    instagram: member.social?.instagram ?? communityHref('instagram'),
  }
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

const socialIconLinkClass = cn(
  'pointer-events-auto inline-flex size-8 items-center justify-center rounded-lg sm:size-9',
  'text-white/95 transition hover:text-white',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
)

export function TeamSection() {
  return (
    <section
      id="equipo"
      className={cn(
        'relative w-full overflow-x-clip bg-white text-neutral-950 [color-scheme:light]',
        'px-4 py-16 sm:px-6 sm:py-20',
      )}
      aria-labelledby="equipo-heading"
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'min-w-0 text-center')}>
        <h2
          id="equipo-heading"
          className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
        >
          Equipo
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-neutral-600 sm:text-lg">
          Las personas que impulsan la comunidad: estrategia, operaciones y
          contenido.
        </p>
      </div>

      <ul
        className={cn(
          HERO_CONTENT_WIDTH_CLASS,
          'mt-10 grid min-w-0 list-none grid-cols-2 gap-4 sm:mt-12 sm:gap-8 lg:grid-cols-3',
        )}
      >
        {TEAM.map((member) => {
          const social = memberSocialUrls(member)
          return (
            <li key={member.name}>
              <article
                className={cn(
                  'h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white',
                  'text-left',
                )}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-200">
                  <img
                    src={member.imageSrc ?? FALLBACK_IMAGE}
                    alt=""
                    className="relative z-0 size-full object-cover object-center"
                    width={800}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10">
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-0 -top-12 sm:-top-16',
                        'bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125',
                        '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                        '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                      )}
                      aria-hidden
                    />
                    <div className="relative z-10 flex flex-col px-3 pb-3 sm:px-5 sm:pb-5">
                      <h3 className="text-sm font-semibold tracking-tight text-balance text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:text-lg">
                        {member.name}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-white sm:mt-1 sm:text-sm lg:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        {member.role}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
                        <a
                          href={social.linkedin}
                          className={socialIconLinkClass}
                          aria-label={`LinkedIn de ${member.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkedInIcon className="size-4 sm:size-5" />
                        </a>
                        <a
                          href={social.x}
                          className={socialIconLinkClass}
                          aria-label={`Perfil de X de ${member.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <XIcon className="size-[0.95rem] sm:size-[1.15rem]" />
                        </a>
                        <a
                          href={social.instagram}
                          className={socialIconLinkClass}
                          aria-label={`Instagram de ${member.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <InstagramIcon className="size-4 sm:size-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
