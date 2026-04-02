import { useMemo, useState } from 'react'
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

/** Misma marca que el CTA «Unite» en `SiteHeader`. */
function ArrowUpRightIcon({ className }: { className?: string }) {
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
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)

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
          const isHoveredCard = hoveredCardIndex === index
          const isPeerDimmed =
            hoveredCardIndex !== null && hoveredCardIndex !== index

          const sat =
            hoveredCardIndex === null
              ? 0.75
              : isHoveredCard
                ? 1
                : 0.48
          const gray = isPeerDimmed ? 0.42 : 0
          const filterValue = `saturate(${sat}) grayscale(${gray})`

          return (
            <motion.li
              key={member.name}
              className="min-w-0"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 'some' }}
              custom={index}
              onMouseEnter={() => setHoveredCardIndex(index)}
              onMouseLeave={() => setHoveredCardIndex(null)}
            >
              <article
                className={cn(
                  'group/team-card relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white',
                  'text-left',
                )}
                style={
                  reduceMotion
                    ? {
                        filter: filterValue,
                        WebkitFilter: filterValue,
                      }
                    : {
                        filter: filterValue,
                        WebkitFilter: filterValue,
                        transitionProperty: 'filter',
                        transitionDuration:
                          hoveredCardIndex === null ? '420ms' : '280ms',
                        transitionDelay:
                          hoveredCardIndex === null ? '90ms' : '0ms',
                        transitionTimingFunction:
                          'cubic-bezier(0.33, 1, 0.68, 1)',
                      }
                }
              >
                <div
                  className={cn(
                    'pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4',
                    'flex size-8 items-center justify-center rounded-full sm:size-9',
                    'bg-yellow-300 text-neutral-950 ring-1 ring-black/10',
                    'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]',
                  )}
                  style={{
                    opacity: isHoveredCard ? 1 : 0,
                    transition: 'opacity 300ms cubic-bezier(0.33, 1, 0.68, 1)',
                  }}
                  aria-hidden
                >
                  <ArrowUpRightIcon className="size-3.5 shrink-0 sm:size-4" />
                </div>
                <div className="relative z-0 aspect-[4/5] w-full overflow-hidden bg-neutral-200">
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
                        'absolute inset-0 -top-16 sm:-top-22',
                        'bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125',
                        '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                        '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                      )}
                      aria-hidden
                    />
                    <div className="relative z-10 px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
                      <h3 className="text-sm font-semibold tracking-tight text-balance text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:text-lg">
                        {member.name}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-white sm:mt-1 sm:text-sm lg:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        {member.role}
                      </p>
                    </div>
                  </div>
                </div>
                <a
                  href={linkedInHref}
                  className={cn(
                    'absolute inset-0 z-10 cursor-pointer rounded-2xl',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
                  )}
                  aria-label={`Abrir LinkedIn de ${member.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </article>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
