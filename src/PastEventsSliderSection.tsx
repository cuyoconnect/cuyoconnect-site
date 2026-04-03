import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const SECTION_HEADING = 'Eventos anteriores'
const SPEED = 22
const INSTAGRAM_HREF = 'https://www.instagram.com/cuyoconnect/'

const CURSOR_PHOTOS = [
  '/events/event-01.webp',
  '/events/event-02.webp',
  '/events/event-03.webp',
  '/events/event-04.webp',
  '/events/event-05.webp',
  '/events/event-06.webp',
  '/events/event-07.webp',
  '/events/event-08.webp',
]

const ALEPH_PHOTOS = [
  '/events/event-09.webp',
  '/events/event-10.webp',
  '/events/event-11.webp',
  '/events/event-12.webp',
  '/events/event-13.webp',
  '/events/event-14.webp',
  '/events/event-15.webp',
]

const STELLAR_PHOTOS = [
  '/events/event-23.webp',
  '/events/event-24.webp',
  '/events/event-25.webp',
  '/events/event-26.webp',
  '/events/event-17.webp',
  '/events/event-18.webp',
  '/events/event-19.webp',
  '/events/event-20.webp',
]

const LATINHACK_PHOTOS = ['/events/event-21.webp', '/events/event-22.webp']

type EventCard = {
  image: string
  title: string
  date: string
}

function makeCards(photos: string[], title: string, date: string): EventCard[] {
  return photos.map((image) => ({ image, title, date }))
}

const CURSOR_CARDS = makeCards(CURSOR_PHOTOS, 'CURSOR', '16 dic 2025')

const ALEPH_CARDS = makeCards(ALEPH_PHOTOS, "Aleph's Hackathon", '17 dic 2025')

const STELLAR_CARDS = makeCards(
  STELLAR_PHOTOS,
  'Stellar Summer Friday',
  '30 ene 2026',
)

const LATINHACK_CARDS = makeCards(LATINHACK_PHOTOS, 'Latin Hack', '17 dic 2025')

function interleave(...groups: EventCard[][]): EventCard[] {
  const result: EventCard[] = []
  const indices = groups.map(() => 0)
  let remaining = groups.reduce((sum, group) => sum + group.length, 0)

  while (remaining > 0) {
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      if (indices[groupIndex] < groups[groupIndex].length) {
        result.push(groups[groupIndex][indices[groupIndex]])
        indices[groupIndex] += 1
        remaining -= 1
      }
    }
  }

  return result
}

const INTERLEAVED = interleave(
  CURSOR_CARDS,
  ALEPH_CARDS,
  STELLAR_CARDS,
  LATINHACK_CARDS,
)

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

function CalendarIcon({ className }: { className?: string }) {
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
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

interface EventCardProps extends EventCard {
  cardIndex: number
  hoveredIndex: number | null
  isDragging: boolean
  reduceMotion: boolean | null
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function EventCardItem({
  image,
  title,
  date,
  cardIndex,
  hoveredIndex,
  isDragging,
  reduceMotion,
  onMouseEnter,
  onMouseLeave,
}: EventCardProps) {
  const effectiveHovered = isDragging ? null : hoveredIndex
  const isHoveredCard = effectiveHovered === cardIndex
  const isPeerDimmed =
    effectiveHovered !== null && effectiveHovered !== cardIndex

  const sat =
    effectiveHovered === null
      ? 0.85
      : isHoveredCard
        ? 1
        : /* peer */ 0.48
  const gray = isPeerDimmed ? 0.42 : 0
  const filterValue = `saturate(${sat}) grayscale(${gray})`

  const articleStyle =
    reduceMotion === true
      ? {
          filter: filterValue,
          WebkitFilter: filterValue,
          boxShadow: isHoveredCard
            ? '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06)',
        }
      : {
          filter: filterValue,
          WebkitFilter: filterValue,
          boxShadow: isHoveredCard
            ? '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          transitionProperty: 'filter, box-shadow',
          transitionDuration: effectiveHovered === null ? '420ms' : '280ms',
          transitionDelay: effectiveHovered === null ? '90ms' : '0ms',
          transitionTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
        }

  return (
    <article
      className={cn(
        'relative shrink-0 rounded-2xl border border-neutral-200 bg-white',
        'w-52 select-none sm:w-60 md:w-68',
      )}
      style={articleStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          'pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4',
          'flex size-8 items-center justify-center rounded-full bg-yellow-300 text-neutral-950',
          'ring-1 ring-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]',
          'sm:size-9',
        )}
        style={{
          opacity: isHoveredCard ? 1 : 0,
          transition: 'opacity 300ms cubic-bezier(0.33, 1, 0.68, 1)',
        }}
        aria-hidden
      >
        <ArrowUpRightIcon className="size-3.5 shrink-0 sm:size-4" />
      </div>

      <a
        href={INSTAGRAM_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'absolute inset-0 z-30 rounded-2xl',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
        )}
        aria-label={`Ver ${title} en Instagram`}
        draggable={false}
      />

      <div className="relative z-0 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-200">
        <img
          src={image}
          alt={title}
          className="relative z-0 size-full object-cover object-center"
          width={400}
          height={500}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div
            className={cn(
              'absolute inset-0 -top-16 bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125 sm:-top-22',
              '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
              '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
            )}
            aria-hidden
          />
          <div className="relative z-10 px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
            <h3 className="text-balance text-sm font-semibold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:text-base">
              {title}
            </h3>
            <p
              className={cn(
                'mt-0.5 flex items-center gap-1.5 text-xs leading-relaxed text-white sm:mt-1 sm:gap-2 sm:text-sm lg:text-base',
                '[text-shadow:0_1px_2px_rgba(0,0,0,0.5)]',
              )}
            >
              <CalendarIcon className="block size-3 shrink-0 text-current sm:size-3.5" />
              <span className="leading-none">{date}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function PastEventsSliderSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])
  const reduceMotion = useReducedMotion()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const items = useMemo(
    () => [...INTERLEAVED, ...INTERLEAVED, ...INTERLEAVED],
    [],
  )

  const trackRef = useRef<HTMLDivElement>(null)
  const xRef = useRef(0)
  const loopUnitRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const wasDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)

  isPausedRef.current = hoveredIndex !== null

  useEffect(() => {
    const trackElement = trackRef.current
    if (!trackElement) return

    loopUnitRef.current = trackElement.scrollWidth / 3

    function tick(timestamp: number) {
      if (lastTsRef.current === null) lastTsRef.current = timestamp
      const deltaSeconds = (timestamp - lastTsRef.current) / 1000
      lastTsRef.current = timestamp

      if (!isDraggingRef.current && !isPausedRef.current) {
        xRef.current -= SPEED * deltaSeconds

        if (xRef.current <= -loopUnitRef.current) {
          xRef.current += loopUnitRef.current
        }
      }

      trackElement!.style.transform = `translateX(${xRef.current}px)`
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    isDraggingRef.current = true
    wasDraggingRef.current = false
    lastTsRef.current = null
    dragStartXRef.current = event.clientX
    dragStartPosRef.current = xRef.current
    setIsDragging(true)
    setHoveredIndex(null)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return

    const deltaX = event.clientX - dragStartXRef.current
    if (Math.abs(deltaX) > 4) wasDraggingRef.current = true

    let newX = dragStartPosRef.current + deltaX
    const unit = loopUnitRef.current

    if (unit > 0) {
      while (newX > 0) newX -= unit
      while (newX < -unit) newX += unit
    }

    xRef.current = newX
  }

  function handlePointerUp() {
    if (!isDraggingRef.current) return

    isDraggingRef.current = false
    lastTsRef.current = null
    setIsDragging(false)
  }

  return (
    <section
      id="eventos-anteriores"
      className="bg-white py-16 text-neutral-950 [color-scheme:light] sm:py-20"
      aria-labelledby="eventos-anteriores-heading"
    >
      <div
        className={cn(
          'mx-auto mb-10 w-full min-w-0 px-4 text-left sm:mb-12 sm:px-6',
          HERO_CONTENT_WIDTH_CLASS,
        )}
      >
        <h2
          id="eventos-anteriores-heading"
          className="w-full max-w-full text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
        >
          <BlurText
            text={SECTION_HEADING}
            className="text-inherit"
            segmentDelay={0.14}
            duration={0.95}
            tailHighlight={tailHighlight}
          />
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg">
          Momentos de cada encuentro de nuestra comunidad.
        </p>
      </div>

      <div
        className={cn(
          'relative mx-auto w-full min-w-0',
          HERO_CONTENT_WIDTH_CLASS,
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 sm:w-7"
          style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 sm:w-7"
          style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }}
          aria-hidden
        />

        <div
          className="overflow-hidden px-2 py-5 sm:py-6"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={(event) => {
            if (wasDraggingRef.current) {
              event.stopPropagation()
              event.preventDefault()
              wasDraggingRef.current = false
            }
          }}
        >
          <div
            ref={trackRef}
            className="flex will-change-transform -mx-2"
            style={{ gap: '14px', width: 'max-content' }}
          >
            {items.map((eventCard, index) => (
              <EventCardItem
                key={index}
                {...eventCard}
                cardIndex={index}
                hoveredIndex={hoveredIndex}
                isDragging={isDragging}
                reduceMotion={reduceMotion}
                onMouseEnter={() => {
                  if (!isDragging) setHoveredIndex(index)
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
