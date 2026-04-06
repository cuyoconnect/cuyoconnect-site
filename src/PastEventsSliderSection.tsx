import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArchivePosterCard } from '@/components/ArchivePosterCard'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const SECTION_HEADING = 'Eventos anteriores'
const SPEED = 22
const INSTAGRAM_HREF = 'https://www.instagram.com/cuyoconnect/'

// const CURSOR_PHOTOS = [
//   '/events/event-01.webp',
//   '/events/event-02.webp',
//   '/events/event-03.webp',
//   '/events/event-04.webp',
//   '/events/event-05.webp',
//   '/events/event-06.webp',
//   '/events/event-07.webp',
//   '/events/event-08.webp',
// ]

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

// const CURSOR_CARDS = makeCards(CURSOR_PHOTOS, 'CURSOR', '19 feb 2026')

const ALEPH_CARDS = makeCards(ALEPH_PHOTOS, "Aleph's Hackathon", '29 ago 2025')

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
  // CURSOR_CARDS,
  ALEPH_CARDS,
  STELLAR_CARDS,
  LATINHACK_CARDS,
)

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
              <ArchivePosterCard
                key={index}
                variant="slider"
                imageSrc={eventCard.image}
                title={eventCard.title}
                dateLabel={eventCard.date}
                href={INSTAGRAM_HREF}
                ariaLabel={`Ver ${eventCard.title} en Instagram`}
                external
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
