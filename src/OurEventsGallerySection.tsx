import DomeGallery from '@/components/DomeGallery'
import { EVENTS_GALLERY } from '@/data/events-gallery'
import {
  DOME_STAGE_WIDTH_CLASS,
  HERO_CONTENT_WIDTH_CLASS,
} from '@/lib/content-width'
import { cn } from '@/lib/utils'

function ArrowRightIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function OurEventsGallerySection() {
  const published = EVENTS_GALLERY.filter((e) => e.published).sort(
    (a, b) => a.order - b.order,
  )

  const images = published.map((ev) => ({
    src: ev.image,
    alt: `${ev.title}${ev.subtitle ? ` - ${ev.subtitle}` : ''}`,
    href: ev.href,
  }))

  return (
    <section
      id="nuestros-eventos"
      className={cn(
        'scroll-mt-[6rem] bg-white py-16 text-neutral-950 sm:scroll-mt-[7rem] sm:py-20',
        'px-4 sm:px-6',
      )}
      aria-labelledby="nuestros-eventos-heading"
    >
      <div className="w-full">
        <div
          className={cn(
            'mx-auto w-full min-w-0 text-left',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <h2
            id="nuestros-eventos-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
          >
            Eventos anteriores
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg">
            Momentos del ecosistema CuyoConnect: deslizá, ampliá y abrí el
            calendario para reservar tu próximo encuentro.
          </p>
        </div>

        <div
          className={cn(
            'mx-auto mt-10 w-full min-w-0 sm:mt-12',
            DOME_STAGE_WIDTH_CLASS,
          )}
        >
          <div
            className={cn(
              'relative w-full overflow-hidden bg-white',
              'h-[400px] sm:h-[500px] md:h-[620px] lg:h-[680px]',
            )}
          >
            {images.length > 0 ? (
              <DomeGallery
                images={images}
                fit={0.66}
                minRadius={500}
                heightGuardFactor={1.48}
                segments={30}
                maxVerticalRotationDeg={0}
                imageBorderRadius="14px"
                overlayBlurColor="#ffffff"
                colorAmount={0.8}
                autoRotationSpeed={0.02}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                Pronto habrá eventos para mostrar.
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            'mx-auto mt-10 w-full min-w-0 text-center sm:mt-12',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <a
            href="#eventos"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            Ver calendario y próximas fechas
            <ArrowRightIcon className="h-4 w-4 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  )
}
