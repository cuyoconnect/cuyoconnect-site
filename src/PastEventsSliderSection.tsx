import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BlurText } from '@/components/ui/blur-text'
import FlexCarousel from '@/components/ui/FlexCarousel'
import type { FlexCarouselHandle, FlexCarouselItem } from '@/components/ui/FlexCarousel'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const SECTION_HEADING = 'Eventos anteriores'
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

const CURSOR_CARDS = makeCards(CURSOR_PHOTOS, 'CURSOR', '19 feb 2026')

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

const EVENT_ITEMS: FlexCarouselItem[] = interleave(
  CURSOR_CARDS,
  ALEPH_CARDS,
  STELLAR_CARDS,
  LATINHACK_CARDS,
).map((card) => ({
  src: card.image,
  alt: `${card.title}, ${card.date}`,
  title: card.title,
  subtitle: card.date,
}))

export function PastEventsSliderSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])
  const carouselRef = useRef<FlexCarouselHandle | null>(null)

  return (
    <section
      id="eventos-anteriores"
      className="bg-white py-16 text-neutral-950 [color-scheme:light] sm:py-20"
      aria-labelledby="eventos-anteriores-heading"
    >
      <div
        className={cn(
          'mx-auto mb-6 w-full min-w-0 px-4 text-left sm:mb-8 sm:px-6',
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
          Momentos de cada encuentro de nuestra comunidad.{' '}
          <a
            href={INSTAGRAM_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-950"
          >
            Ver en Instagram
          </a>
        </p>
      </div>

      <div
        className={cn(
          'relative mx-auto h-[26rem] w-full min-w-0 overflow-hidden sm:h-[34rem] lg:h-[38rem]',
          HERO_CONTENT_WIDTH_CLASS,
        )}
      >
        <FlexCarousel
          className="flex-carousel--events"
          controlsRef={carouselRef}
          items={EVENT_ITEMS}
          preset="liquid"
          intro="rise"
          cardHeight={0.62}
          gap={8}
          radius={16}
          squeeze={0.2}
          bend={0.5}
          focusOnClick
          captions
          fit="square"
          autoplay
          interval={4.5}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 sm:w-8"
          style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 sm:w-8"
          style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }}
          aria-hidden
        />
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => carouselRef.current?.nudge(-1)}
          className="absolute top-[42%] left-2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-950 shadow-sm transition-colors hover:bg-neutral-50 sm:left-3"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => carouselRef.current?.nudge(1)}
          className="absolute top-[42%] right-2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-950 shadow-sm transition-colors hover:bg-neutral-50 sm:right-3"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </section>
  )
}
