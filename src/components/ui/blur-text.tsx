import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { annotate } from 'rough-notation'
import type { RoughAnnotation } from 'rough-notation/lib/model'
import { cn } from '@/lib/utils'

function isSkippableWhitespaceSegment(segment: string): boolean {
  return (
    segment === ' ' ||
    (segment.trim() === '' && segment.length > 0 && /\s/.test(segment))
  )
}

/** Resaltado tipo marcador (rough-notation) sobre las últimas N palabras, tras el blur. */
export interface BlurTextTailHighlight {
  /**
   * Últimas N palabras (fin del texto). Ignorado si `highlightWordIndex` está definido.
   */
  lastWordCount: number
  /**
   * Solo esta palabra (0 = primera) recibe el marcador; el resto queda fuera del span.
   * Tiene prioridad sobre `lastWordCount`.
   */
  highlightWordIndex?: number
  color: string
  strokeWidth?: number
  animationDuration?: number
  iterations?: number
  padding?: number
  multiline?: boolean
  /** Extra tras el blur de la última palabra (ms); por defecto 0. */
  markerDelayMs?: number
  className?: string
}

export interface BlurTextProps {
  /** Texto a animar (revelación palabra a palabra o letra a letra). */
  text: string
  className?: string
  /** Palabra completa o letra por letra. */
  animateBy?: 'word' | 'letter'
  /** Retraso inicial antes del primer segmento (s). */
  delay?: number
  /** Retraso entre segmentos (s). */
  segmentDelay?: number
  /** Duración del blur → foco por segmento (s). */
  duration?: number
  /** Intensidad inicial del blur (px). */
  blurAmount?: number
  /** Se llama una sola vez cuando termina la animación del último segmento. */
  onComplete?: () => void
  /**
   * Solo con `animateBy="word"`. Últimas N palabras van en un span común;
   * al terminar el blur se aplica la anotación en bloque.
   */
  tailHighlight?: BlurTextTailHighlight
  /**
   * Si es true, no espera al IntersectionObserver (títulos arriba del fold o islas
   * `client:load` donde el ref puede no registrar a tiempo).
   */
  inViewInitial?: boolean
  /**
   * `rootMargin` del observer. Por defecto solo recorta abajo (no el borde superior),
   * para que el primer pantallazo siga contando como visible.
   */
  inViewMargin?: string
}

function findTailStartSegmentIndex(
  segments: string[],
  tailStartAnimIndex: number,
): number {
  let animIdx = 0
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (isSkippableWhitespaceSegment(seg)) continue
    if (animIdx === tailStartAnimIndex) return i
    animIdx += 1
  }
  return segments.length
}

/** Rango de segmentos (`split` por palabras) para una sola palabra por índice animado. */
function findSingleWordHighlightBounds(
  segments: string[],
  wordIndex: number,
): { highlightStart: number; highlightEnd: number } | null {
  let w = 0
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (isSkippableWhitespaceSegment(seg)) continue
    if (w === wordIndex) {
      return { highlightStart: i, highlightEnd: i + 1 }
    }
    w += 1
  }
  return null
}

/**
 * Texto que pasa de blur a foco, al estilo de los text animations de shadcn.io.
 * Usa Motion y se activa al entrar en viewport.
 */
function isAlreadyInView(
  element: HTMLElement,
  margin = '0px 0px -8% 0px',
): boolean {
  const rect = element.getBoundingClientRect()
  const parts = margin.trim().split(/\s+/)
  const bottomToken = parts[2] ?? '0px'
  let bottomInset = 0
  if (bottomToken.endsWith('%')) {
    bottomInset = -window.innerHeight * (parseFloat(bottomToken) / 100)
  } else {
    bottomInset = -parseFloat(bottomToken)
  }
  const rootBottom = window.innerHeight - bottomInset
  return rect.top < rootBottom && rect.bottom > 0
}

export function BlurText({
  text,
  className,
  animateBy = 'word',
  delay = 0,
  segmentDelay = 0.12,
  duration = 0.88,
  blurAmount = 14,
  onComplete,
  tailHighlight,
  inViewInitial = false,
  inViewMargin,
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const tailRef = useRef<HTMLSpanElement>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const redrawFrameRef = useRef<number | null>(null)
  const viewportListenersCleanupRef = useRef<(() => void) | null>(null)
  const completeRef = useRef(false)
  const annotationStartedRef = useRef(false)
  const lastWordRevealDoneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const tailHighlightRef = useRef(tailHighlight)
  onCompleteRef.current = onComplete
  tailHighlightRef.current = tailHighlight

  const resolvedMargin = inViewMargin ?? '0px 0px -8% 0px'
  const isInViewFromObserver = useInView(ref, {
    once: true,
    margin: resolvedMargin,
    initial: inViewInitial,
  })
  const [isInViewOnMount, setIsInViewOnMount] = useState(inViewInitial)

  useEffect(() => {
    if (inViewInitial || isInViewFromObserver || isInViewOnMount) return
    const el = ref.current
    if (!el) return

    const syncInView = () => {
      if (isAlreadyInView(el, resolvedMargin)) {
        setIsInViewOnMount(true)
      }
    }

    syncInView()
    const raf = window.requestAnimationFrame(syncInView)
    window.addEventListener('scroll', syncInView, { passive: true })
    window.addEventListener('resize', syncInView, { passive: true })
    const vv = window.visualViewport
    vv?.addEventListener('scroll', syncInView, { passive: true })
    vv?.addEventListener('resize', syncInView, { passive: true })

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', syncInView)
      window.removeEventListener('resize', syncInView)
      vv?.removeEventListener('scroll', syncInView)
      vv?.removeEventListener('resize', syncInView)
    }
  }, [
    inViewInitial,
    isInViewFromObserver,
    isInViewOnMount,
    resolvedMargin,
  ])

  const isInView = isInViewFromObserver || isInViewOnMount

  const segments = useMemo(
    () =>
      animateBy === 'word'
        ? text.split(/(\s+)/).filter((s) => s.length > 0)
        : [...text],
    [animateBy, text],
  )

  const animatedSegmentCount = useMemo(
    () => segments.filter((s) => !isSkippableWhitespaceSegment(s)).length,
    [segments],
  )

  const lastGlobalAnimIndex =
    animatedSegmentCount > 0 ? animatedSegmentCount - 1 : -1

  const {
    beforeSegments,
    tailSegments,
    afterSegments,
    tailStartAnimIndex,
    afterStartAnimIndex,
  } = useMemo(() => {
    if (animateBy !== 'word' || !tailHighlight) {
      return {
        beforeSegments: segments,
        tailSegments: [] as string[],
        afterSegments: [] as string[],
        tailStartAnimIndex: 0,
        afterStartAnimIndex: 0,
      }
    }

    const th = tailHighlight
    if (
      th.highlightWordIndex !== undefined &&
      th.highlightWordIndex >= 0 &&
      animatedSegmentCount > 0
    ) {
      const bounds = findSingleWordHighlightBounds(
        segments,
        th.highlightWordIndex,
      )
      if (!bounds) {
        return {
          beforeSegments: segments,
          tailSegments: [] as string[],
          afterSegments: [] as string[],
          tailStartAnimIndex: 0,
          afterStartAnimIndex: 0,
        }
      }
      const { highlightStart, highlightEnd } = bounds
      return {
        beforeSegments: segments.slice(0, highlightStart),
        tailSegments: segments.slice(highlightStart, highlightEnd),
        afterSegments: segments.slice(highlightEnd),
        tailStartAnimIndex: th.highlightWordIndex,
        afterStartAnimIndex: th.highlightWordIndex + 1,
      }
    }

    if (th.lastWordCount > 0 && animatedSegmentCount > 0) {
      const tsi = Math.max(
        0,
        animatedSegmentCount -
          Math.min(th.lastWordCount, animatedSegmentCount),
      )
      const cut = findTailStartSegmentIndex(segments, tsi)
      return {
        beforeSegments: segments.slice(0, cut),
        tailSegments: segments.slice(cut),
        afterSegments: [] as string[],
        tailStartAnimIndex: tsi,
        afterStartAnimIndex: animatedSegmentCount,
      }
    }

    return {
      beforeSegments: segments,
      tailSegments: [] as string[],
      afterSegments: [] as string[],
      tailStartAnimIndex: 0,
      afterStartAnimIndex: 0,
    }
  }, [animateBy, tailHighlight, segments, animatedSegmentCount])

  const totalBlurMs = useMemo(() => {
    if (animatedSegmentCount === 0) return 0
    const totalSec =
      delay + Math.max(0, animatedSegmentCount - 1) * segmentDelay + duration
    return Math.ceil(totalSec * 1000)
  }, [animatedSegmentCount, delay, segmentDelay, duration])

  const tryStartAnnotation = useCallback(() => {
    if (annotationStartedRef.current) return
    const th = tailHighlightRef.current
    if (!th || animateBy !== 'word') return
    const el = tailRef.current
    if (!el) return

    annotationStartedRef.current = true

    annotationRef.current?.remove()
    resizeObserverRef.current?.disconnect()
    viewportListenersCleanupRef.current?.()
    if (redrawFrameRef.current != null) {
      window.cancelAnimationFrame(redrawFrameRef.current)
      redrawFrameRef.current = null
    }

    const ann = annotate(el, {
      type: 'highlight',
      color: th.color,
      strokeWidth: th.strokeWidth ?? 1.5,
      animationDuration: th.animationDuration ?? 1200,
      iterations: th.iterations ?? 2,
      padding: th.padding ?? 2,
      multiline: th.multiline ?? true,
    })
    annotationRef.current = ann

    // rough-notation: un segundo `show()` mientras ya está `showing` vuelve a
    // pintar con `animate: false` (sin trazo). Nuestro ResizeObserver y el RO
    // interno del paquete pueden disparar eso al cerrar el blur; bloqueamos
    // esas repeticiones hasta terminar la animación del marcador.
    const rawShow = ann.show.bind(ann)
    const guardMs =
      (th.animationDuration ?? 1200) + Math.max(400, (th.iterations ?? 2) * 120)
    let markerShowGuardStart = 0
    ann.show = () => {
      const wasShowing = ann.isShowing()
      const now = Date.now()
      if (
        wasShowing &&
        markerShowGuardStart !== 0 &&
        now - markerShowGuardStart < guardMs
      ) {
        return
      }
      rawShow()
      if (!wasShowing) {
        markerShowGuardStart = now
      }
    }

    ann.show()

    const redrawWithoutAnimation = () => {
      if (annotationRef.current !== ann || redrawFrameRef.current != null) return
      redrawFrameRef.current = window.requestAnimationFrame(() => {
        redrawFrameRef.current = null
        if (annotationRef.current !== ann) return
        ann.show()
      })
    }

    let viewportRaf1: number | null = null
    let viewportRaf2: number | null = null

    const cancelViewportRedrawRafs = () => {
      if (viewportRaf1 != null) {
        window.cancelAnimationFrame(viewportRaf1)
        viewportRaf1 = null
      }
      if (viewportRaf2 != null) {
        window.cancelAnimationFrame(viewportRaf2)
        viewportRaf2 = null
      }
    }

    /**
     * iOS/Safari: la barra del navegador mueve el layout sin pasar siempre
     * por el guard de `ann.show()` (que silencia repeticiones durante la
     * animación inicial). Hay que usar `rawShow` tras dos rAF para medir
     * después del reflow del motor.
     */
    const scheduleViewportGeometrySync = () => {
      if (annotationRef.current !== ann) return
      cancelViewportRedrawRafs()
      viewportRaf1 = window.requestAnimationFrame(() => {
        viewportRaf1 = null
        viewportRaf2 = window.requestAnimationFrame(() => {
          viewportRaf2 = null
          if (annotationRef.current !== ann) return
          rawShow()
        })
      })
    }

    // Solo el span del tail: observar `document.body` disparaba hide/show al
    // interactuar con el DOME (layout/WebGL) y repetía la animación del marcador.
    const ro = new ResizeObserver(() => {
      redrawWithoutAnimation()
    })
    resizeObserverRef.current = ro
    ro.observe(el)

    // En Safari/iOS puede cambiar la barra del navegador y mover el texto sin
    // redimensionar el span. Escuchar `visualViewport` mantiene el marcador
    // alineado sin volver a animarlo.
    const handleViewportShift = () => {
      scheduleViewportGeometrySync()
    }
    const vv = window.visualViewport
    window.addEventListener('resize', handleViewportShift)
    vv?.addEventListener('resize', handleViewportShift)
    vv?.addEventListener('scroll', handleViewportShift)
    viewportListenersCleanupRef.current = () => {
      cancelViewportRedrawRafs()
      window.removeEventListener('resize', handleViewportShift)
      vv?.removeEventListener('resize', handleViewportShift)
      vv?.removeEventListener('scroll', handleViewportShift)
    }
  }, [animateBy])

  const fireOnCompleteOnce = useCallback(() => {
    if (completeRef.current) return
    if (!onCompleteRef.current) return
    completeRef.current = true
    onCompleteRef.current()
  }, [])

  const scheduleAnnotationAfterLastBlur = useCallback(() => {
    const th = tailHighlightRef.current
    if (!th || animateBy !== 'word') return
    const extra = th.markerDelayMs ?? 0
    if (extra > 0) {
      window.setTimeout(() => tryStartAnnotation(), extra)
    } else {
      requestAnimationFrame(() => tryStartAnnotation())
    }
  }, [animateBy, tryStartAnnotation])

  const handleLastAnimatedWordDone = useCallback(() => {
    if (!isInView || lastWordRevealDoneRef.current) return
    lastWordRevealDoneRef.current = true
    fireOnCompleteOnce()
    scheduleAnnotationAfterLastBlur()
  }, [
    fireOnCompleteOnce,
    isInView,
    scheduleAnnotationAfterLastBlur,
  ])

  /**
   * Limpieza del marcador + fallback por si `onAnimationComplete` no dispara.
   * El arranque normal es `handleLastAnimatedWordDone` en la última palabra.
   */
  useEffect(() => {
    if (!isInView) return

    if (animatedSegmentCount === 0) {
      fireOnCompleteOnce()
      return undefined
    }

    annotationStartedRef.current = false
    lastWordRevealDoneRef.current = false

    const fallbackMs = totalBlurMs + 80
    const id = window.setTimeout(() => {
      fireOnCompleteOnce()
      if (tailHighlightRef.current && animateBy === 'word') {
        tryStartAnnotation()
      }
    }, fallbackMs)

    return () => {
      window.clearTimeout(id)
      annotationRef.current?.remove()
      resizeObserverRef.current?.disconnect()
      viewportListenersCleanupRef.current?.()
      if (redrawFrameRef.current != null) {
        window.cancelAnimationFrame(redrawFrameRef.current)
      }
      annotationRef.current = null
      resizeObserverRef.current = null
      viewportListenersCleanupRef.current = null
      redrawFrameRef.current = null
    }
  }, [
    animateBy,
    animatedSegmentCount,
    fireOnCompleteOnce,
    isInView,
    totalBlurMs,
    tryStartAnnotation,
  ])

  function renderWordMotionSpans(
    segs: string[],
    startAnimIndex: number,
    keyPrefix: string,
  ) {
    let localAnim = 0
    const needsLastHook = Boolean(onComplete || tailHighlight)
    return segs.map((segment, i) => {
      if (isSkippableWhitespaceSegment(segment)) {
        return (
          <span key={`${keyPrefix}-ws-${i}`}>
            {segment}
          </span>
        )
      }
      const animIndex = startAnimIndex + localAnim
      localAnim += 1
      const isLastWord = animIndex === lastGlobalAnimIndex
      return (
        <motion.span
          key={`${keyPrefix}-${i}-${segment}`}
          className="inline-block"
          style={{ willChange: 'filter, opacity' }}
          initial={{
            filter: `blur(${blurAmount}px)`,
            opacity: 0,
          }}
          animate={
            isInView
              ? { filter: 'blur(0px)', opacity: 1 }
              : { filter: `blur(${blurAmount}px)`, opacity: 0 }
          }
          transition={{
            duration,
            delay: delay + animIndex * segmentDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={
            needsLastHook && isLastWord
              ? handleLastAnimatedWordDone
              : undefined
          }
        >
          {segment}
        </motion.span>
      )
    })
  }

  /** Modo letra: sin tail highlight fragmentado (un solo flujo). */
  if (animateBy === 'letter') {
    let segmentAnimIndex = 0
    const needsLastHook = Boolean(onComplete || tailHighlight)
    return (
      <span ref={ref} className={cn('inline', className)}>
        {segments.map((segment, i) => {
          if (isSkippableWhitespaceSegment(segment)) {
            return <span key={`ws-${i}`}>{segment}</span>
          }
          const animIndex = segmentAnimIndex
          segmentAnimIndex += 1
          const isLastWord = animIndex === lastGlobalAnimIndex
          return (
            <motion.span
              key={`letter-${i}-${segment}`}
              className="inline"
              style={{ willChange: 'filter, opacity' }}
              initial={{
                filter: `blur(${blurAmount}px)`,
                opacity: 0,
              }}
              animate={
                isInView
                  ? { filter: 'blur(0px)', opacity: 1 }
                  : { filter: `blur(${blurAmount}px)`, opacity: 0 }
              }
              transition={{
                duration,
                delay: delay + animIndex * segmentDelay,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={
                needsLastHook && isLastWord
                  ? handleLastAnimatedWordDone
                  : undefined
              }
            >
              {segment}
            </motion.span>
          )
        })}
      </span>
    )
  }

  const showTailWrap =
    Boolean(
      tailHighlight &&
        (tailHighlight.lastWordCount > 0 ||
          (tailHighlight.highlightWordIndex !== undefined &&
            tailHighlight.highlightWordIndex >= 0)),
    ) && tailSegments.length > 0

  return (
    <span ref={ref} className={cn('inline', className)}>
      {renderWordMotionSpans(beforeSegments, 0, 'b')}
      {showTailWrap ? (
        <span
          ref={tailRef}
          className={cn(
            'inline bg-transparent text-inherit',
            tailHighlight?.className,
          )}
        >
          {renderWordMotionSpans(
            tailSegments,
            tailStartAnimIndex,
            'w',
          )}
        </span>
      ) : tailSegments.length > 0 && afterSegments.length === 0 ? (
        renderWordMotionSpans(tailSegments, tailStartAnimIndex, 'w')
      ) : null}
      {afterSegments.length > 0
        ? renderWordMotionSpans(afterSegments, afterStartAnimIndex, 'a')
        : null}
    </span>
  )
}
