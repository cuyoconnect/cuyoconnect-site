import { useMemo } from 'react'
import { CommunityStripSection } from '@/CommunityStripSection'
import { BlurText } from '@/components/ui/blur-text'
import { cn } from '@/lib/utils'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'

/** Mismo tono que el resaltado del hero (marcador). */
const HERO_TOPIC_HIGHLIGHT = '#ffec6b'

const HERO_HEADING =
  'Comunidad de builders en IA, tecnología y web3'

/** Últimas cuatro palabras: "IA," "tecnología" "y" "web3" */
const HERO_TOPIC_WORD_COUNT = 4

export function Hero() {
  const tailHighlight = useMemo(
    () => ({
      lastWordCount: HERO_TOPIC_WORD_COUNT,
      color: HERO_TOPIC_HIGHLIGHT,
      /** Trazo más grueso + más pasadas = aspecto más “a mano” / desprolijo. */
      strokeWidth: 2.15,
      padding: 5,
      multiline: true,
      animationDuration: 1500,
      iterations: 4,
      className:
        '[&::selection]:bg-[#ffec6b] [&::selection]:text-neutral-950',
    }),
    [],
  )

  return (
    <section
      id="inicio"
      className={cn(
        'hero-viewport relative isolate m-0 flex flex-col items-center overflow-x-hidden bg-white p-0',
        'pt-14 sm:pt-16',
        'sm:m-0 sm:px-6',
      )}
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,0,0,0.04),transparent_70%)]"
        aria-hidden
      />

      <div
        className={cn(
          'relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4',
          'sm:px-0',
        )}
      >
        <div
          className={cn(
            'mx-auto flex w-full min-w-0 flex-col items-center',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <h1
            id="hero-heading"
            className={cn(
              'w-full max-w-full text-balance text-center font-semibold tracking-tight text-neutral-950',
              'text-2xl sm:text-3xl md:text-4xl',
            )}
          >
            <BlurText
              text={HERO_HEADING}
              className="text-inherit"
              segmentDelay={0.14}
              duration={0.95}
              tailHighlight={tailHighlight}
            />
          </h1>

          <div className="mt-8 -mb-3 flex w-full min-w-0 justify-center sm:mt-10 sm:-mb-5 md:-mb-6">
            <div
              className={cn(
                'hero-image-fade relative isolate mx-auto block max-h-none w-full max-w-full',
                'max-sm:max-w-none max-sm:shrink-0 max-sm:w-[max(28rem,min(136vw,42rem))]',
              )}
            >
              <img
                src="/cuyo-connect-hero.png"
                alt=""
                width={1920}
                height={747}
                decoding="async"
                className="relative z-0 mx-0 mt-0 mb-0 block h-auto w-full max-w-full max-sm:rounded-none"
              />
              <p className="mb-6 w-full px-4 pb-3 pt-0 text-center text-2xl font-semibold tracking-tight text-neutral-950 sm:mb-8 sm:px-5 sm:pb-4 sm:text-3xl md:text-4xl">
                CuyoConnect
              </p>
            </div>
          </div>
        </div>
      </div>

      <CommunityStripSection className="py-6 sm:py-8 max-sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]" />
    </section>
  )
}
