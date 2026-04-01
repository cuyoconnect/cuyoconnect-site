import { useMemo } from 'react'
import { BlurText } from '@/components/ui/blur-text'
import { LUMA_CALENDAR_EMBED_SRC } from '@/lib/community-links'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const EVENTS_HEADING = 'Próximos eventos'

export function EventsSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])

  return (
    <section
      id="eventos"
      className={cn(
        'py-16 sm:py-20',
        'bg-white text-neutral-950 [color-scheme:light]',
        'px-4 sm:px-6',
      )}
      aria-labelledby="eventos-heading"
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS)}>
        <h2
          id="eventos-heading"
          className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
        >
          <BlurText
            text={EVENTS_HEADING}
            className="text-inherit"
            segmentDelay={0.14}
            duration={0.95}
            tailHighlight={tailHighlight}
          />
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:text-lg">
          Reservá y enterate de los encuentros en nuestro calendario.
        </p>
        <div
          className={cn(
            'mt-8 min-w-0 max-w-full overflow-hidden rounded-2xl bg-white',
          )}
        >
          <iframe
            title="Calendario de eventos CuyoConnect en Luma"
            src={LUMA_CALENDAR_EMBED_SRC}
            className="block -mt-6 h-[min(42dvh,375px)] w-[calc(100%+20px)] min-h-[250px] border-0 sm:min-h-[305px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="clipboard-write"
          />
        </div>
      </div>
    </section>
  )
}
