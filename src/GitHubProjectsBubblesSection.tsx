import { useMemo } from 'react'

import { GitHubProjectsBubblesViewer } from '@/components/github-map/GitHubProjectsBubblesViewer'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HEADING = 'Proyectos de la comunidad'
const LEAD =
  'Cada burbuja es un proyecto publicado y su tamaño sigue los commits del último año.'

export function GitHubProjectsBubblesSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(1), [])

  return (
    <section
      id="proyectos"
      className={cn(
        'relative w-full overflow-x-clip bg-white text-neutral-950 [color-scheme:light]',
        'px-4 py-16 sm:px-6 sm:py-20',
      )}
      aria-labelledby="proyectos-heading"
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'min-w-0')}>
        <h2
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
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:text-lg">
          {LEAD}
        </p>
      </div>

      {/* Sin columna máxima: el racimo usa todo el ancho, como el hero. */}
      <div className="mt-10 w-full min-w-0 sm:mt-12">
        <GitHubProjectsBubblesViewer />
      </div>

      <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'mt-8 min-w-0')}>
        <a
          href="/proyectos"
          className={cn(
            'inline-flex items-center rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-medium text-white',
            'transition-colors hover:bg-black',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
          )}
        >
          Ver todos los proyectos
        </a>
      </div>
    </section>
  )
}
