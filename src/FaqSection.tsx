import { useMemo } from 'react'

import { BlurText } from '@/components/ui/blur-text'
import { FaqAccordion } from '@/components/ui/faq-chat-accordion'
import { LANDING_FAQ_ITEMS } from '@/data/faq'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const FAQ_HEADING = 'Preguntas frecuentes'

export function FaqSection() {
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])

  return (
    <section
      id="preguntas-frecuentes"
      className={cn(
        'relative w-full overflow-x-clip bg-white text-neutral-950 [color-scheme:light]',
        'px-4 py-16 sm:px-6 sm:py-20',
      )}
      aria-labelledby="faq-heading"
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS, 'min-w-0')}>
        <h2
          id="faq-heading"
          className={cn(
            'text-balance text-2xl font-semibold tracking-tight text-neutral-950',
            'sm:text-3xl md:text-4xl',
          )}
        >
          <BlurText
            text={FAQ_HEADING}
            className="text-inherit"
            segmentDelay={0.14}
            duration={0.95}
            tailHighlight={tailHighlight}
          />
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:text-lg">
          Todo lo que necesitás saber antes de sumarte.
        </p>

        <div className="mt-8 min-w-0 sm:mt-10">
          <FaqAccordion
            data={LANDING_FAQ_ITEMS}
            className="max-w-2xl border-t border-neutral-200"
          />
        </div>
      </div>
    </section>
  )
}
