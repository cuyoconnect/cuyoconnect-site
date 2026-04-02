import { useMemo } from 'react'
import DomeGallery from '@/components/DomeGallery'
import { BlurText } from '@/components/ui/blur-text'
import { EVENTS_GALLERY } from '@/data/events-gallery'
import {
  DOME_STAGE_WIDTH_CLASS,
  HERO_CONTENT_WIDTH_CLASS,
} from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const EVENTS_GALLERY_HEADING = 'Eventos anteriores'

export function OurEventsGallerySection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])
  const published = EVENTS_GALLERY.filter((e) => e.published).sort(
    (a, b) => a.order - b.order,
  )

  const images = published.map((ev) => ({
    src: ev.image,
    alt: ev.title,
    href: ev.href,
    date: ev.date,
  }))

  return (
    <section
      id="nuestros-eventos"
      className="bg-white py-16 text-neutral-950 sm:py-20"
      aria-labelledby="nuestros-eventos-heading"
    >
      <div className="w-full">
        <div
          className={cn(
            'mx-auto w-full min-w-0 px-4 text-left sm:px-6',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <h2
            id="nuestros-eventos-heading"
            className={cn(
              'w-full max-w-full text-balance text-2xl font-semibold tracking-tight text-neutral-950',
              'sm:text-3xl md:text-4xl',
            )}
          >
            <BlurText
              text={EVENTS_GALLERY_HEADING}
              className="text-inherit"
              segmentDelay={0.14}
              duration={0.95}
              tailHighlight={tailHighlight}
            />
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg">
            Así se viven los encuentros de nuestra comunidad.
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
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                Pronto habrá eventos para mostrar.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
