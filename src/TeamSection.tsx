import { useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { BlurText } from '@/components/ui/blur-text'
import { TEAM, type TeamMember } from '@/data/team'
import { COMMUNITY_LINKS, type CommunityLinkId } from '@/lib/community-links'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const TEAM_HEADING = 'Nuestro equipo'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80'

function communityHref(id: CommunityLinkId) {
  return COMMUNITY_LINKS.find((l) => l.id === id)!.href
}

function memberLinkedInHref(member: TeamMember) {
  return member.social?.linkedin ?? member.href ?? communityHref('linkedin')
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

const socialIconLinkClass = cn(
  'pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10',
  'text-white/95 transition hover:text-white',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
)

/** ease-out suave; el movimiento se reparte mejor en el tiempo que curves más agresivas. */
const CARD_EASE = [0.33, 1, 0.68, 1] as const

function teamCardVariants(reduceMotion: boolean | null): Variants {
  const off = reduceMotion === true
  /** Sin `type: "tween"`, `y` usa spring por defecto y el `duration` casi no se nota. */
  const enter = {
    type: 'tween' as const,
    duration: off ? 0 : 0.95,
    ease: CARD_EASE,
  }
  return {
    hidden: { opacity: off ? 1 : 0, y: off ? 0 : 32 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        ...enter,
        delay: off ? 0 : i * 0.12,
      },
    }),
  }
}

export function TeamSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])
  const reduceMotion = useReducedMotion()
  const cardVariants = useMemo(
    () => teamCardVariants(reduceMotion),
    [reduceMotion],
  )

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
          className={cn(
            'w-full max-w-full text-balance text-center text-2xl font-semibold tracking-tight text-neutral-950',
            'sm:text-3xl md:text-4xl',
          )}
        >
          <BlurText
            text={TEAM_HEADING}
            className="text-inherit"
            segmentDelay={0.14}
            duration={0.95}
            tailHighlight={tailHighlight}
          />
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
        {TEAM.map((member, index) => {
          const linkedInHref = memberLinkedInHref(member)
          return (
            <motion.li
              key={member.name}
              className="min-w-0"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 'some' }}
              custom={index}
            >
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
                        'pointer-events-none absolute inset-0 -top-16 sm:-top-22',
                        'bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125',
                        '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                        '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                      )}
                      aria-hidden
                    />
                    <div className="relative z-10 flex flex-row items-center justify-between gap-3 px-4 pt-5 pb-6 sm:gap-3 sm:px-6 sm:pt-6 sm:pb-7">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold tracking-tight text-balance text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:text-lg">
                          {member.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-white sm:mt-1 sm:text-sm lg:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                          {member.role}
                        </p>
                      </div>
                      <a
                        href={linkedInHref}
                        className={socialIconLinkClass}
                        aria-label={`LinkedIn de ${member.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkedInIcon className="size-5 sm:size-6" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
