import { useMemo, useState } from 'react'

import { GitHubProjectsBubblesViewer } from '@/components/github-map/GitHubProjectsBubblesViewer'
import { GitHubProjectsSectionActions } from '@/components/github-map/GitHubProjectsSectionActions'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HEADING = 'Proyectos de la comunidad'
const PAGE_LEAD =
  'Cada burbuja es un proyecto publicado de la comunidad: el tamaño refleja su actividad en commits. Hacé clic en una para ver quién lo hizo.'

export function ProyectosPage() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(1), [])
  const [mapFocused, setMapFocused] = useState(false)

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

          <div className="mt-6 w-full min-w-0 sm:mt-8">
            <GitHubProjectsBubblesViewer onFocusChange={setMapFocused} />
          </div>

          <GitHubProjectsSectionActions
            visible={!mapFocused}
            className="mt-12 text-center sm:mt-14"
          />
        </div>
      </section>
    </div>
  )
}
