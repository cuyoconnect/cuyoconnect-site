import { motion, useReducedMotion } from 'framer-motion'

import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

const DISCONNECT_COLOR = '#a33831'

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

const HERO_IMAGE = '/404-stamped.webp'
const HERO_IMAGE_WIDTH = 1664
const HERO_IMAGE_HEIGHT = 929

const captionClass = cn(
  'w-full px-4 text-center text-base font-medium text-neutral-700',
  'sm:px-5 sm:text-lg',
)

export function NotFoundPage() {
  const reduceMotion = useReducedMotion()

  const headingInitial = reduceMotion
    ? { opacity: 1, filter: 'blur(0px)' }
    : { opacity: 0, filter: 'blur(10px)' }
  const headingAnimate = { opacity: 1, filter: 'blur(0px)' }

  return (
    <section
      id="not-found"
      className={cn(
        'relative isolate m-0 flex h-[100svh] max-h-[100svh] flex-col items-center overflow-hidden bg-white p-0',
        'pt-14 sm:pt-16',
        'sm:m-0 sm:px-6',
      )}
      aria-labelledby="not-found-heading"
    >
      <SideCircuitDecor />

      <div
        className={cn(
          'relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4',
          'sm:px-0',
        )}
      >
        <div
          className={cn(
            'mx-auto flex min-h-0 w-full min-w-0 flex-col items-center',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <p className="mb-3 shrink-0 text-sm font-medium tracking-[0.18em] uppercase text-neutral-500 sm:mb-4">
            Error 404
          </p>

          <motion.h1
            id="not-found-heading"
            initial={headingInitial}
            animate={headingAnimate}
            transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              'w-full max-w-full shrink-0 text-balance text-center font-semibold tracking-tight text-neutral-950',
              'text-3xl sm:text-4xl md:text-5xl',
            )}
          >
            Cuyo<span style={{ color: DISCONNECT_COLOR }}>Disconnect</span>
          </motion.h1>

          {/* La imagen mantiene su tamaño natural; si excede el espacio
              disponible se recorta (vertical y horizontal en mobile)
              sin empujar la altura del 100svh. */}
          <div className="mt-4 flex w-full min-w-0 min-h-0 shrink items-center justify-center overflow-hidden sm:mt-6">
            <div
              className={cn(
                'hero-image-fade relative isolate flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden',
                'max-sm:max-w-none max-sm:shrink-0 max-sm:w-[max(28rem,min(136vw,42rem))]',
              )}
            >
              <img
                src={HERO_IMAGE}
                alt="Dos manos señalando una red molecular tachada con una X negra y un sello rojo que dice 404"
                width={HERO_IMAGE_WIDTH}
                height={HERO_IMAGE_HEIGHT}
                decoding="async"
                fetchPriority="high"
                className="h-auto w-full max-w-full shrink-0 object-contain"
              />
            </div>
          </div>

          <p className={cn(captionClass, 'mt-2 mb-10 shrink-0 sm:mt-3 sm:mb-14')}>
            No pudimos <span className="font-semibold">conectarte</span> a esta
            página
          </p>

          <a
            href="/"
            className={cn(
              'inline-flex w-fit max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white',
              'transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)]',
              'hover:bg-black hover:duration-[240ms] hover:delay-0',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
              'sm:px-6 sm:text-base',
            )}
          >
            <span>Volver al inicio</span>
            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  )
}
