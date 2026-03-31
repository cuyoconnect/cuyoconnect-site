import { LUMA_CALENDAR_EMBED_SRC } from '@/lib/community-links'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

export function EventsSection() {
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
          Próximos eventos
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
            className="block h-[min(72dvh,640px)] w-full min-h-[420px] min-w-0 max-w-full border-0 sm:min-h-[520px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="clipboard-write"
          />
        </div>
      </div>
    </section>
  )
}
