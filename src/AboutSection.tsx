import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useId,
  useLayoutEffect,
  useRef,
} from 'react'

import { useReducedMotion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, useInView } from 'motion/react'

import { BlurText } from '@/components/ui/blur-text'
import { Highlighter } from '@/components/ui/highlighter'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { HERO_TOPIC_HIGHLIGHT } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const ABOUT_HEADING = 'QUIÉNES SOMOS'

type AboutCopySegment = {
  text: string
  highlight?: boolean
}

const ABOUT_COPY_LINES: readonly (readonly AboutCopySegment[])[] = [
  [
    {
      text: 'Nacimos en Cuyo con una idea simple: la distancia no debería ser un límite para quienes ',
    },
    { text: 'construyen tecnología', highlight: true },
    { text: '.' },
  ],
  [
    {
      text: 'Conectamos personas, ideas y proyectos porque las mejores cosas ',
    },
    { text: 'se crean juntos', highlight: true },
    { text: '.' },
  ],
] as const

function splitWords(text: string) {
  return text.split(/(\s+)/).filter((segment) => segment.length > 0)
}

type AboutGalleryItem = {
  src: string
  positionClassName: string
  frameClassName: string
  outlineClassName: string
  accentClassName: string
  sizes?: string
  objectPosition?: string
  useSquiggleClip?: boolean
  shapeClassName?: string
  imageClassName?: string
}

const ABOUT_STAGE_GALLERY_ITEMS: AboutGalleryItem[] = [
  {
    src: '/events/event-24.webp',
    positionClassName:
      'left-[3%] top-[3%] w-[6.2rem] sm:left-[6%] sm:w-[7.5rem] lg:left-[15%] lg:top-[7%] lg:w-[9.8rem] xl:left-[16%] xl:top-[4%] xl:w-[12rem]',
    frameClassName:
      'aspect-[4/5] rounded-[46%_54%_52%_48%/38%_42%_58%_62%] rotate-[-9deg]',
    outlineClassName:
      'rounded-[44%_56%_50%_50%/42%_35%_65%_58%] rotate-[6deg]',
    accentClassName:
      '-right-3 -top-3 h-[34%] w-[42%] rounded-[56%_44%_60%_40%/45%_38%_62%_55%] bg-[#ffec6b]/75',
    objectPosition: 'center 28%',
  },
  {
    src: '/events/about-artur.webp',
    positionClassName:
      'left-[4%] bottom-[5%] w-[6.2rem] sm:left-[7%] sm:w-[7.5rem] lg:left-[13%] lg:bottom-[14%] lg:w-[10.4rem] xl:left-[14%] xl:bottom-[11%] xl:w-[12.8rem]',
    frameClassName:
      'aspect-[4/5] rounded-[1rem] sm:rounded-[1.2rem] lg:rounded-[1.4rem] rotate-[4deg]',
    outlineClassName:
      'rounded-[1.2rem] sm:rounded-[1.4rem] lg:rounded-[1.6rem] rotate-[-7deg]',
    accentClassName:
      '-left-3 bottom-[-0.5rem] h-[35%] w-[42%] rounded-[64%_36%_45%_55%/40%_63%_37%_60%] bg-[#d7f3d2]/85',
    objectPosition: 'center 34%',
  },
  {
    src: '/events/event-14.webp',
    positionClassName:
      'right-[3%] top-[5%] w-[6.2rem] sm:right-[6%] sm:w-[7.5rem] lg:right-[14%] lg:top-[12%] lg:w-[9.8rem] xl:right-[15%] xl:top-[8%] xl:w-[12rem]',
    frameClassName:
      'aspect-[4/5] rounded-[1rem] sm:rounded-[1.2rem] lg:rounded-[1.4rem] rotate-[8deg]',
    outlineClassName:
      'rounded-[1.2rem] sm:rounded-[1.4rem] lg:rounded-[1.6rem] rotate-[-5deg]',
    accentClassName:
      '-left-2 -top-3 h-[34%] w-[38%] rounded-[54%_46%_62%_38%/48%_40%_60%_52%] bg-[#ffec6b]/65',
    objectPosition: 'center 30%',
  },
  {
    src: '/events/about-julito.webp',
    positionClassName:
      'right-[4%] bottom-[3%] w-[6.2rem] sm:right-[7%] sm:w-[7.5rem] lg:right-[15%] lg:bottom-[6%] lg:w-[10.4rem] xl:right-[16%] xl:bottom-[4%] xl:w-[12.8rem]',
    frameClassName:
      'aspect-[4/5] rounded-[52%_48%_46%_54%/40%_44%_56%_60%] rotate-[-4deg]',
    outlineClassName:
      'rounded-[50%_50%_44%_56%/38%_42%_58%_62%] rotate-[8deg]',
    accentClassName:
      '-right-2 bottom-[-0.6rem] h-[32%] w-[40%] rounded-[44%_56%_38%_62%/55%_36%_64%_45%] bg-[#ffd9df]/80',
    objectPosition: 'center 38%',
  },
]

const ABOUT_TOP_FLOW_ITEM: AboutGalleryItem = {
  src: '/events/event-03.webp',
  positionClassName: '',
  frameClassName:
    'aspect-[6/5] rounded-[1rem] sm:rounded-[1.2rem] lg:rounded-[1.4rem] rotate-[7deg]',
  outlineClassName:
    'rounded-[1.2rem] sm:rounded-[1.4rem] lg:rounded-[1.6rem] rotate-[-5deg]',
  accentClassName:
    '-bottom-3 -left-3 h-[45%] w-[32%] rounded-[60%_40%_44%_56%/37%_47%_53%_63%] bg-[#d9d2ff]/80',
  objectPosition: 'center 44%',
  sizes:
    '(min-width: 1280px) 15.5rem, (min-width: 1024px) 14.5rem, (min-width: 640px) 12.5rem, 10rem',
}

const ABOUT_BOTTOM_FLOW_ITEM: AboutGalleryItem = {
    src: '/events/about-joaco-y-tici.webp',
  positionClassName: '',
  frameClassName:
    'aspect-[5/4] rounded-[63%_37%_47%_53%/42%_56%_44%_58%] rotate-[-7deg]',
  outlineClassName:
    'rounded-[58%_42%_44%_56%/47%_61%_39%_53%] rotate-[6deg]',
  accentClassName:
    '-right-3 -bottom-3 h-[40%] w-[35%] rounded-[42%_58%_58%_42%/35%_57%_43%_65%] bg-[#c5f0ff]/80',
  objectPosition: 'center 26%',
  sizes:
    '(min-width: 1280px) 15.5rem, (min-width: 1024px) 14.5rem, (min-width: 640px) 12.5rem, 10rem',
}

function clipPathStyle(id: string): CSSProperties {
  return {
    clipPath: `url(#${id})`,
    WebkitClipPath: `url(#${id})`,
  }
}

function AboutClipPathDefs({ squiggleId }: { squiggleId: string }) {
  return (
    <svg
      className="absolute h-0 w-0 overflow-hidden"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={squiggleId} clipPathUnits="objectBoundingBox">
          <path d="M0.434125 0.00538712C0.56323 -0.00218488 0.714575 -0.000607013 0.814404 0.00302954L0.802642 0.163537C0.813884 0.167475 0.824927 0.172002 0.835358 0.177236C0.869331 0.194281 0.909224 0.225945 0.90824 0.27348C0.907177 0.324883 0.858912 0.354946 0.822651 0.36933C0.857426 0.376783 0.894591 0.387558 0.925837 0.404287C0.968002 0.426862 1.00569 0.464702 0.999287 0.515878C0.993163 0.564818 0.950731 0.597642 0.904098 0.615682C0.88204 0.624216 0.858239 0.62992 0.834803 0.633808C0.858076 0.639299 0.881603 0.646639 0.90267 0.656757C0.946271 0.677698 0.986875 0.715485 0.978905 0.768037C0.972241 0.811979 0.93615 0.843109 0.895204 0.862035C0.858032 0.879217 0.815169 0.887544 0.778534 0.892219C0.704792 0.901628 0.614366 0.901003 0.535183 0.899176C0.508115 0.898551 0.482286 0.89779 0.45773 0.897065C0.404798 0.895504 0.357781 0.894117 0.317008 0.894657C0.301552 0.894862 0.289265 0.895348 0.279749 0.895976C0.251913 0.937168 0.226467 0.980907 0.216015 1L0 0.941216C0.0140558 0.915539 0.051354 0.851547 0.0902557 0.797766C0.118421 0.758828 0.1722 0.745373 0.200402 0.740217C0.168437 0.733484 0.134299 0.723597 0.105102 0.708076C0.0614715 0.684884 0.0263696 0.64687 0.0325498 0.596965C0.0385804 0.548267 0.0803829 0.515256 0.12709 0.496909C0.146901 0.489127 0.168128 0.483643 0.189242 0.479724C0.163739 0.476035 0.137977 0.471053 0.115188 0.463936C0.0874831 0.455285 0.00855855 0.424854 0.016569 0.357817C0.0231721 0.302559 0.0838593 0.276249 0.116031 0.266164C0.149646 0.255625 0.188201 0.2505 0.221821 0.247468C0.208809 0.243824 0.195905 0.239492 0.183801 0.234287C0.152543 0.220846 0.101565 0.189547 0.105449 0.136312C0.108467 0.0949629 0.144168 0.0682612 0.171101 0.0543099C0.197578 0.0405945 0.227933 0.032236 0.25348 0.0267029C0.305656 0.0154021 0.370636 0.00911076 0.434125 0.00538712Z" />
        </clipPath>
      </defs>
    </svg>
  )
}

function AboutAnimatedWord({
  children,
  index,
  isInView,
}: {
  children: ReactNode
  index: number
  isInView: boolean
}) {
  return (
    <motion.span
      className="inline-block"
      style={{ willChange: 'filter, opacity, transform' }}
      initial={{ filter: 'blur(14px)', opacity: 0, y: 18 }}
      animate={
        isInView
          ? { filter: 'blur(0px)', opacity: 1, y: 0 }
          : { filter: 'blur(14px)', opacity: 0, y: 18 }
      }
      transition={{
        duration: 0.62,
        delay: 0.14 + index * 0.045,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.span>
  )
}

function AboutAnimatedParagraph({
  className,
}: {
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10%' })
  const renderedLines = ABOUT_COPY_LINES.reduce<{
    lines: ReactNode[]
    wordIndex: number
  }>(
    (lineAccumulator, line, lineIndex) => {
      const segmentResult = line.reduce<{
        segments: ReactNode[]
        wordIndex: number
      }>(
        (segmentAccumulator, segment, segmentIndex) => {
          const words = splitWords(segment.text)
          const wordResult = words.reduce<{
            renderedWords: ReactNode[]
            highlightedWordIndexes: number[]
            wordIndex: number
          }>(
            (wordAccumulator, word, innerIndex) => {
              if (!word.trim()) {
                return {
                  ...wordAccumulator,
                  renderedWords: [
                    ...wordAccumulator.renderedWords,
                    <span key={`space-${lineIndex}-${segmentIndex}-${innerIndex}`}>{word}</span>,
                  ],
                }
              }

              const currentIndex = wordAccumulator.wordIndex

              return {
                renderedWords: [
                  ...wordAccumulator.renderedWords,
                  <AboutAnimatedWord
                    key={`word-${lineIndex}-${segmentIndex}-${innerIndex}-${currentIndex}`}
                    index={currentIndex}
                    isInView={isInView}
                  >
                    {word}
                  </AboutAnimatedWord>,
                ],
                highlightedWordIndexes: segment.highlight
                  ? [...wordAccumulator.highlightedWordIndexes, currentIndex]
                  : wordAccumulator.highlightedWordIndexes,
                wordIndex: currentIndex + 1,
              }
            },
            {
              renderedWords: [],
              highlightedWordIndexes: [],
              wordIndex: segmentAccumulator.wordIndex,
            },
          )

          const segmentContent = !segment.highlight
            ? wordResult.renderedWords
            : (
                <Highlighter
                  className="pb-[0.08em] font-bold"
                  action="underline"
                  color={HERO_TOPIC_HIGHLIGHT}
                  strokeWidth={3}
                  animationDuration={850}
                  iterations={1}
                  padding={1}
                  multiline
                  isView
                  annotationDelayMs={Math.round(
                    520 +
                      (wordResult.highlightedWordIndexes[wordResult.highlightedWordIndexes.length - 1] ??
                        0) *
                        45,
                  )}
                >
                  {wordResult.renderedWords}
                </Highlighter>
              )

          return {
            segments: [
              ...segmentAccumulator.segments,
              <span
                key={`segment-${lineIndex}-${segmentIndex}`}
                className="inline"
              >
                {segmentContent}
              </span>,
            ],
            wordIndex: wordResult.wordIndex,
          }
        },
        { segments: [], wordIndex: lineAccumulator.wordIndex },
      )

      return {
        lines: [
          ...lineAccumulator.lines,
          <span key={`line-${lineIndex}`} className="block">
            {segmentResult.segments}
          </span>,
        ],
        wordIndex: segmentResult.wordIndex,
      }
    },
    { lines: [], wordIndex: 0 },
  )

  return (
    <div
      ref={ref}
      className={cn(
        'mx-auto mt-6 max-w-[18.5rem] text-center text-[1.34rem] font-normal leading-[1.28] tracking-[-0.03em] text-neutral-950 sm:mt-7 sm:max-w-[25rem] sm:text-[1.62rem] sm:leading-[1.26] lg:max-w-[39rem] lg:text-[1.9rem] xl:max-w-[42rem] xl:text-[2.05rem]',
        className,
      )}
    >
      {renderedLines.lines}
    </div>
  )
}

function AboutTextBlock({
  className,
  innerClassName,
  headingClassName,
  copyClassName,
  containerRef,
}: {
  className?: string
  innerClassName?: string
  headingClassName?: string
  copyClassName?: string
  containerRef?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={containerRef}
      className={cn(HERO_CONTENT_WIDTH_CLASS, 'relative z-10 mx-auto will-change-transform', className)}
    >
      <div className={cn('mx-auto text-center', innerClassName)}>
        <div
          className={cn(
            'text-center text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-neutral-700 sm:text-[0.8rem]',
            headingClassName,
          )}
        >
          <BlurText
            text={ABOUT_HEADING}
            className="text-inherit"
            animateBy="word"
            segmentDelay={0.12}
            duration={0.56}
          />
        </div>
        <AboutAnimatedParagraph className={copyClassName} />
      </div>
    </div>
  )
}

function AboutImageCard({
  item,
  className,
  squiggleClipId,
  containerRef,
}: {
  item: AboutGalleryItem
  className: string
  squiggleClipId?: string
  containerRef?: Ref<HTMLDivElement>
}) {
  const clipStyle =
    item.useSquiggleClip && squiggleClipId
      ? clipPathStyle(squiggleClipId)
      : undefined

  return (
    <div ref={containerRef} className={cn('relative will-change-transform', className)}>
      <div className={cn('absolute -z-20 blur-[1px]', item.accentClassName)} />
      <div
        className={cn(
          'absolute -inset-2 -z-10 border border-neutral-950/10',
          item.shapeClassName,
          !item.useSquiggleClip &&
            'rounded-[inherit]',
          item.outlineClassName,
        )}
        style={clipStyle}
      />
      <figure
        className={cn(
          'relative overflow-hidden border border-neutral-950/10 bg-neutral-100 shadow-[0_8px_20px_rgba(15,23,42,0.1)] sm:shadow-[0_12px_28px_rgba(15,23,42,0.11)] lg:shadow-[0_16px_36px_rgba(15,23,42,0.12)] xl:shadow-[0_22px_52px_rgba(15,23,42,0.14)]',
          item.shapeClassName,
          !item.useSquiggleClip &&
            'rounded-[inherit]',
          item.frameClassName,
        )}
        style={clipStyle}
      >
        <img
          src={item.src}
          alt=""
          width={900}
          height={1080}
          loading="lazy"
          decoding="async"
          className={cn('block size-full object-cover saturate-[0.94]', item.imageClassName)}
          sizes={
            item.sizes ??
            '(min-width: 1280px) 15rem, (min-width: 1024px) 12rem, (min-width: 640px) 10rem, 5rem'
          }
          style={
            item.objectPosition
              ? { objectPosition: item.objectPosition }
              : undefined
          }
        />
      </figure>
    </div>
  )
}

function AboutFlowImage({
  item,
  className,
  squiggleClipId,
  containerRef,
}: {
  item: AboutGalleryItem
  className: string
  squiggleClipId?: string
  containerRef?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={containerRef} className="relative z-10 will-change-transform">
      <AboutImageCard
        item={item}
        className={className}
        squiggleClipId={squiggleClipId}
      />
    </div>
  )
}

function OrbitStroke({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={cn('absolute fill-none stroke-current', className)}
      aria-hidden="true"
    >
      <path
        d="M24 126C43 52 118 9 187 24c64 14 112 66 108 113-5 56-70 86-134 80-72-6-123-61-137-91"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="8 10"
      />
    </svg>
  )
}

function SparkBurst({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('absolute fill-none stroke-current', className)}
      aria-hidden="true"
    >
      <path
        d="M32 6v14M32 44v14M6 32h14M44 32h14M14.4 14.4l9.9 9.9M39.7 39.7l9.9 9.9M49.6 14.4l-9.9 9.9M24.3 39.7l-9.9 9.9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DotCluster({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn('absolute fill-current', className)}
      aria-hidden="true"
    >
      <circle cx="16" cy="22" r="4.5" />
      <circle cx="44" cy="14" r="3.5" />
      <circle cx="72" cy="24" r="4" />
      <circle cx="32" cy="52" r="3.5" />
      <circle cx="64" cy="58" r="4.5" />
      <circle cx="92" cy="44" r="3.5" />
    </svg>
  )
}

type AboutDecoration = {
  kind: 'orbit' | 'dots' | 'spark'
  className: string
}

const ABOUT_STAGE_DECORATIONS: readonly AboutDecoration[] = [
  {
    kind: 'orbit',
    className:
      'left-[4%] top-[7%] h-10 w-16 text-neutral-950/10 sm:h-18 sm:w-28 lg:h-28 lg:w-44 xl:left-[5%] xl:top-[7%] xl:h-32 xl:w-52',
  },
  {
    kind: 'orbit',
    className:
      'bottom-[10%] right-[4%] h-8 w-14 rotate-180 text-neutral-950/10 sm:h-15 sm:w-[5.75rem] lg:h-24 lg:w-40 xl:bottom-[12%] xl:right-[6%] xl:h-28 xl:w-44',
  },
  {
    kind: 'dots',
    className:
      'left-[20%] top-[11%] h-7 w-12 text-[#ffec6b]/80 sm:h-10 sm:w-16 lg:h-12 lg:w-[4.5rem] xl:left-[19%] xl:top-[10%] xl:h-14 xl:w-20',
  },
  {
    kind: 'dots',
    className:
      'right-[18%] bottom-[16%] h-6 w-10 text-neutral-950/10 sm:h-9 sm:w-14 lg:h-12 lg:w-[4.5rem] xl:right-[19%] xl:h-14 xl:w-20',
  },
  {
    kind: 'spark',
    className:
      'right-[21%] top-[17%] h-5 w-5 text-[#ffec6b]/70 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:right-[23%] xl:top-[15%] xl:h-11 xl:w-11',
  },
  {
    kind: 'spark',
    className:
      'left-[17%] bottom-[24%] h-4 w-4 text-neutral-950/12 sm:h-7 sm:w-7 lg:h-9 lg:w-9 xl:left-[18%] xl:bottom-[20%] xl:h-10 xl:w-10',
  },
] as const

function AboutStageDecorations() {
  return (
    <>
      {ABOUT_STAGE_DECORATIONS.map((decoration, index) => {
        if (decoration.kind === 'orbit') {
          return <OrbitStroke key={`orbit-${index}`} className={decoration.className} />
        }

        if (decoration.kind === 'dots') {
          return <DotCluster key={`dots-${index}`} className={decoration.className} />
        }

        return <SparkBurst key={`spark-${index}`} className={decoration.className} />
      })}
    </>
  )
}

export function AboutSection() {
  const clipPathBaseId = useId().replace(/:/g, '')
  const squiggleClipId = `${clipPathBaseId}-about-squiggle`
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const topFlowRef = useRef<HTMLDivElement>(null)
  const bottomFlowRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    if (reduceMotion) return

    const section = sectionRef.current

    if (!section) return

    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      const animateCards = (scale: number) => {
        const stage = stageRef.current
        const text = textRef.current
        const topFlow = topFlowRef.current
        const bottomFlow = bottomFlowRef.current
        const cards = cardRefs.current.slice(0, ABOUT_STAGE_GALLERY_ITEMS.length).filter(
          (card): card is HTMLDivElement => card !== null,
        )

        if (!stage || !text || !topFlow || !bottomFlow || cards.length !== ABOUT_STAGE_GALLERY_ITEMS.length) {
          return
        }

        const s = scale

        const initialOffsets = [
          { x: -76 * s, y: -56 * s, rotate: -18 },
          { x: -70 * s, y: 64 * s, rotate: -14 },
          { x: 74 * s, y: -58 * s, rotate: 17 },
          { x: 72 * s, y: 66 * s, rotate: 12 },
        ]

        const settleRotations = [-9, -4, 8, 4]

        const driftOffsets = [
          { x: -8 * s, y: -16 * s, rotate: -11 },
          { x: -6 * s, y: -12 * s, rotate: -2 },
          { x: 8 * s, y: -16 * s, rotate: 10 },
          { x: 6 * s, y: -12 * s, rotate: 6 },
        ]

        gsap.set(text, {
          autoAlpha: 0,
          y: 60 * s,
          scale: 0.985,
          transformOrigin: '50% 50%',
        })

        gsap.set(cards, {
          autoAlpha: 0,
          scale: 0.82,
          transformOrigin: '50% 50%',
        })

        cards.forEach((card, i) => {
          gsap.set(card, initialOffsets[i])
        })

        gsap.set(topFlow, {
          autoAlpha: 0,
          y: 36 * s,
          scale: 0.92,
          rotate: 4,
          transformOrigin: '50% 50%',
        })

        gsap.set(bottomFlow, {
          autoAlpha: 0,
          y: 36 * s,
          scale: 0.92,
          rotate: -4,
          transformOrigin: '50% 50%',
        })

        // cards[0]=top-left, cards[1]=bottom-left, cards[2]=top-right, cards[3]=bottom-right
        const topCards = [cards[0], cards[2]]
        const bottomCards = [cards[1], cards[3]]
        const topSettleRotations = [settleRotations[0], settleRotations[2]]
        const bottomSettleRotations = [settleRotations[1], settleRotations[3]]

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top 82%',
            end: 'bottom 20%',
            scrub: 1.2,
          },
        })

        // --- Phase 1: top row reveal (0 – 0.28) ---

        tl.to(
          topFlow,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.28,
            ease: 'power2.out',
          },
          0,
        )

        topCards.forEach((card, i) => {
          tl.to(
            card,
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              rotate: topSettleRotations[i],
              scale: 1,
              duration: 0.28,
              ease: 'power2.out',
            },
            0.02 + i * 0.02,
          )
        })

        tl.to(
          text,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.28,
            ease: 'power2.out',
          },
          0.04,
        )

        // --- Phase 2: bottom row reveal (0.35 – 0.58) ---

        bottomCards.forEach((card, i) => {
          tl.to(
            card,
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              rotate: bottomSettleRotations[i],
              scale: 1,
              duration: 0.23,
              ease: 'power2.out',
            },
            0.35 + i * 0.02,
          )
        })

        tl.to(
          bottomFlow,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.23,
            ease: 'power2.out',
          },
          0.37,
        )

        // --- Phase 3: drift for all (0.6 – 1.0) ---

        tl.to(
          topFlow,
          {
            y: -10 * s,
            rotate: 2,
            duration: 0.4,
            ease: 'sine.inOut',
          },
          0.6,
        )

        tl.to(
          text,
          {
            y: -14 * s,
            scale: 1.005,
            duration: 0.4,
            ease: 'sine.inOut',
          },
          0.6,
        )

        cards.forEach((card, i) => {
          tl.to(
            card,
            {
              x: driftOffsets[i].x,
              y: driftOffsets[i].y,
              rotate: driftOffsets[i].rotate,
              duration: 0.4,
              ease: 'sine.inOut',
            },
            0.6,
          )
        })

        tl.to(
          bottomFlow,
          {
            y: -8 * s,
            rotate: -2,
            duration: 0.4,
            ease: 'sine.inOut',
          },
          0.6,
        )
      }

      mm.add('(max-width: 639px)', () => animateCards(0.42))
      mm.add('(min-width: 640px) and (max-width: 1023px)', () => animateCards(0.65))
      mm.add('(min-width: 1024px)', () => animateCards(1))
    }, section)

    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [reduceMotion])

  return (
    <section
      ref={sectionRef}
      id="quienes-somos"
      className="relative overflow-x-clip bg-white py-16 text-neutral-950 [color-scheme:light] sm:py-20"
    >
      <div className="mx-auto max-w-[92rem]">
        <div
          ref={stageRef}
          className="relative isolate mx-auto flex min-h-[36rem] items-center justify-center py-6 sm:min-h-[42rem] sm:py-8 lg:min-h-[52rem] lg:py-12 xl:min-h-[58rem]"
        >
          <AboutClipPathDefs squiggleId={squiggleClipId} />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <AboutStageDecorations />
            {ABOUT_STAGE_GALLERY_ITEMS.map((item, index) => (
              <AboutImageCard
                key={item.src}
                item={item}
                className={cn('absolute', item.positionClassName)}
                squiggleClipId={squiggleClipId}
                containerRef={(element) => {
                  cardRefs.current[index] = element
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex w-full flex-col items-center gap-7 sm:gap-8 lg:gap-10">
            <AboutFlowImage
              item={ABOUT_TOP_FLOW_ITEM}
              className="mx-auto w-[10rem] sm:w-[12.5rem] lg:w-[14.5rem] xl:w-[15.5rem]"
              squiggleClipId={squiggleClipId}
              containerRef={topFlowRef}
            />

            <AboutTextBlock
              containerRef={textRef}
              innerClassName="max-w-[20rem] sm:max-w-[28rem] lg:max-w-[46rem] xl:max-w-[50rem]"
              headingClassName=""
              copyClassName="max-w-[20rem] sm:max-w-[28rem] lg:max-w-[46rem] xl:max-w-[50rem]"
            />

            <AboutFlowImage
              item={ABOUT_BOTTOM_FLOW_ITEM}
              className="mx-auto mt-4 w-[10rem] sm:mt-6 sm:w-[12.5rem] lg:mt-8 lg:w-[14.5rem] xl:w-[15.5rem]"
              squiggleClipId={squiggleClipId}
              containerRef={bottomFlowRef}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
