import { useMemo, useState } from 'react'

import { GitHubProjectsSectionActions } from '@/components/github-map/GitHubProjectsSectionActions'
import { GitHubProjectsBubblesViewer } from '@/components/github-map/GitHubProjectsBubblesViewer'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HEADING = 'Proyectos de la comunidad'
const LEAD =
  'Cada burbuja es un proyecto publicado de la comunidad: el tamaño refleja su actividad en commits. Hacé clic en una para ver quién lo hizo.'

export function GitHubProjectsBubblesSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(1), [])
  const [mapFocused, setMapFocused] = useState(false)

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

        <div className="mt-10 w-full min-w-0 sm:mt-12">
          <GitHubProjectsBubblesViewer onFocusChange={setMapFocused} />
        </div>

        <GitHubProjectsSectionActions
          visible={!mapFocused}
          className="mt-12 text-center sm:mt-14"
        />
      </div>
    </section>
  )
}
