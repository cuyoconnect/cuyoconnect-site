import { useMemo } from 'react'

import { GitHubProjectsBubblesViewer } from '@/components/github-map/GitHubProjectsBubblesViewer'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HEADING = 'Proyectos de la comunidad'
const PAGE_LEAD =
  'Cada burbuja es un proyecto publicado y su tamaño sigue los commits del último año. Pasá el mouse para verlo y hacé clic para fijar la tarjeta.'

export function ProyectosPage() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(1), [])

  return (
    <div className="min-h-dvh bg-white text-neutral-950 [color-scheme:light]">
      <section
        className="relative isolate px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28"
        aria-labelledby="proyectos-heading"
      >
        <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'relative z-10 min-w-0')}>
          <h1
            id="proyectos-heading"
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
            {PAGE_LEAD}
          </p>
        </div>

        {/* Sin columna máxima: el racimo usa todo el ancho de la ventana. */}
        <div className="mt-6 w-full min-w-0 sm:mt-8">
          <GitHubProjectsBubblesViewer />
        </div>
      </section>
    </div>
  )
}
