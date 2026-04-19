import { useMemo, useState } from 'react'
import {
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'

import { ArchivePosterCard } from '@/components/ArchivePosterCard'
import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import { BlurText } from '@/components/ui/blur-text'
import {
  RECURSO_COVER_FALLBACKS,
  RECURSOS,
  type RecursoItem,
} from '@/data/recursos'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HEADING = 'Recursos y materiales'

/** Texto introductorio bajo el título (genérico; el listado añade cantidad u orden). */
const PAGE_LEAD = 'Presentaciones y recursos de nuestra comunidad.'

/**
 * Derivado solo de `RECURSOS` (no del estado React) para que SSR y cliente
 * coincidan y no haya mismatch de hidratación en la variante de tarjeta.
 */
const IS_SINGLE_RESOURCE_PAGE = RECURSOS.length === 1

/** Misma curva que `TeamSection` para entradas al scroll. */
const CARD_EASE = [0.33, 1, 0.68, 1] as const

function resourceListVariants(reduceMotion: boolean | null): Variants {
  const off = reduceMotion === true
  return {
    hidden: {},
    visible: {
      transition: off
        ? { duration: 0 }
        : {
            staggerChildren: 0.1,
            delayChildren: 0.05,
          },
    },
  }
}

function resourceItemVariants(reduceMotion: boolean | null): Variants {
  const off = reduceMotion === true
  const enter = {
    type: 'tween' as const,
    duration: off ? 0 : 0.82,
    ease: CARD_EASE,
  }
  return {
    hidden: {
      opacity: off ? 1 : 0,
      y: off ? 0 : 36,
      scale: off ? 1 : 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: enter,
    },
  }
}

function sortByDateNewestFirst(items: RecursoItem[]): RecursoItem[] {
  return [...items].sort((a, b) => {
    if (a.dateSort === b.dateSort) return 0
    return a.dateSort < b.dateSort ? 1 : -1
  })
}

export function RecursosPage() {
  const reduceMotion = useReducedMotion()
  const itemsOrdered = useMemo(() => sortByDateNewestFirst(RECURSOS), [])
  const tailHighlight = useMemo(() => heroTopicTailHighlight(3), [])
  const listVariants = useMemo(
    () => resourceListVariants(reduceMotion),
    [reduceMotion],
  )
  const itemVariants = useMemo(
    () => resourceItemVariants(reduceMotion),
    [reduceMotion],
  )
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)

  const coverById = useMemo(() => {
    const map = new Map<string, string>()
    RECURSOS.forEach((item, i) => {
      map.set(
        item.id,
        item.coverImage ??
          RECURSO_COVER_FALLBACKS[i % RECURSO_COVER_FALLBACKS.length]!,
      )
    })
    return map
  }, [])

  return (
    <div className="relative isolate overflow-x-hidden bg-white text-neutral-950 [color-scheme:light]">
      <SideCircuitDecor />

      <section
        className={cn(
          'relative isolate py-16 sm:py-20',
          'px-4 sm:px-6',
        )}
        aria-labelledby="recursos-heading"
      >
        <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'relative z-10 min-w-0')}>
          {IS_SINGLE_RESOURCE_PAGE ? (
            <>
              <h1
                id="recursos-heading"
                className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
              >
                <BlurText
                  text={HEADING}
                  className="text-inherit"
                  segmentDelay={0.14}
                  duration={0.95}
                  tailHighlight={tailHighlight}
                />
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg">
                {PAGE_LEAD}
              </p>
            </>
          ) : (
            <>
              <h1
                id="recursos-heading"
                className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
              >
                <BlurText
                  text={HEADING}
                  className="text-inherit"
                  segmentDelay={0.14}
                  duration={0.95}
                  tailHighlight={tailHighlight}
                />
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:text-lg">
                {PAGE_LEAD}{' '}
                {itemsOrdered.length}{' '}
                {itemsOrdered.length === 1 ? 'recurso' : 'recursos'}, del más
                nuevo al más antiguo.
              </p>
            </>
          )}

          <motion.ul
            className={cn(
              'min-w-0 list-none p-0',
              IS_SINGLE_RESOURCE_PAGE
                ? 'mt-10 flex flex-wrap justify-center gap-[14px]'
                : 'mt-10 grid grid-cols-2 gap-4 sm:mt-12 sm:gap-8 lg:grid-cols-3',
            )}
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -10% 0px' }}
          >
            {itemsOrdered.map((item, index) => {
              const coverSrc =
                coverById.get(item.id) ?? RECURSO_COVER_FALLBACKS[0]!
              const external = /^https?:\/\//i.test(item.href)
              const ariaSuffix = external ? ' (se abre en una pestaña nueva)' : ''

              return (
                <motion.li
                  key={item.id}
                  className={cn(
                    IS_SINGLE_RESOURCE_PAGE ? 'shrink-0' : 'min-w-0',
                  )}
                  variants={itemVariants}
                >
                  <ArchivePosterCard
                    variant={IS_SINGLE_RESOURCE_PAGE ? 'slider' : 'grid'}
                    imageSrc={coverSrc}
                    title={item.title}
                    dateLabel={item.date}
                    dateTime={item.dateSort}
                    href={item.href}
                    ariaLabel={`${item.title}${ariaSuffix}`}
                    external={external}
                    cardIndex={index}
                    hoveredIndex={hoveredCardIndex}
                    isDragging={false}
                    reduceMotion={reduceMotion}
                    onMouseEnter={() => setHoveredCardIndex(index)}
                    onMouseLeave={() => setHoveredCardIndex(null)}
                  />
                </motion.li>
              )
            })}
          </motion.ul>
        </div>
      </section>
    </div>
  )
}
