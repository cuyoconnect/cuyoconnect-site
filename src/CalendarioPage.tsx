import { useMemo } from 'react'
import { EditorialPoster } from '@/components/calendario/EditorialPoster'
import { selectPosterMonths } from '@/components/calendario/shared'
import type { PosterCalendarEvent } from '@/data/calendario'

export function CalendarioPage({ events }: { events: PosterCalendarEvent[] }) {
  const months = useMemo(() => selectPosterMonths(events), [events])

  // El padding superior despeja la cabecera fija (mismo valor que scroll-padding-top en index.css).
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-clip bg-white px-4 pb-8 pt-[calc(6.5rem+env(safe-area-inset-top,0px))] text-neutral-950 [color-scheme:light] sm:px-6 sm:pb-10 sm:pt-[calc(7rem+env(safe-area-inset-top,0px))]">
      <h1 className="sr-only">Calendario</h1>
      {months.length === 0 ? (
        <p className="text-[17px] text-neutral-500">No hay eventos próximos.</p>
      ) : (
        <div className="w-full max-w-[30rem]">
          <EditorialPoster months={months} />
        </div>
      )}
    </div>
  )
}
