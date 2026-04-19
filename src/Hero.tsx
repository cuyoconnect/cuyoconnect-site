import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CommunityStripSection } from '@/CommunityStripSection'
import { HeroEasterEggImage } from '@/components/hero/HeroEasterEggImage'
import { BlurText } from '@/components/ui/blur-text'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { heroTopicHighlightWord } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const HERO_HEADING = 'Aprendé, Conectá, Construí'

const HERO_EASTER_CAPTION = '@cuyoconnect'

/** Mismo gris para texto y subrayado; ligero corrimiento a la izquierda solo en QR. */
const captionQrClass =
  'text-neutral-500 underline decoration-current decoration-2 underline-offset-[0.18em] -translate-x-2 sm:-translate-x-3'

const captionClass = cn(
  'mb-6 w-full px-4 pb-3 pt-0 text-center text-2xl font-semibold tracking-tight text-neutral-950 sm:mb-8 sm:px-5 sm:pb-4 sm:text-3xl md:text-4xl',
)

/** Índice de la palabra resaltada: "Conectá," (0 = Aprendé, 1 = Conectá, 2 = Construí). */
const HERO_HIGHLIGHT_WORD_INDEX = 1

export function Hero() {
  const [captionSurface, setCaptionSurface] = useState<'hero' | 'qr'>('hero')
  const tailHighlight = useMemo(
    () => heroTopicHighlightWord(HERO_HIGHLIGHT_WORD_INDEX),
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
              'w-full max-w-full text-balance text-center font-bebas font-normal uppercase tracking-tight text-neutral-950',
              'text-4xl leading-none sm:text-5xl md:text-6xl lg:text-7xl',
            )}
          >
            <BlurText
              text={HERO_HEADING}
              className="text-inherit"
              segmentDelay={0.08}
              duration={0.55}
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
              <HeroEasterEggImage onCaptionSurfaceChange={setCaptionSurface} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={captionSurface}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38, ease: 'easeInOut' }}
                  className={cn(
                    captionClass,
                    captionSurface === 'qr' && captionQrClass,
                  )}
                >
                  {captionSurface === 'hero'
                    ? 'CuyoConnect'
                    : HERO_EASTER_CAPTION}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <CommunityStripSection className="py-6 sm:py-8 max-sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]" />
    </section>
  )
}
