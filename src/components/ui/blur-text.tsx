import { useCallback, useEffect, useMemo, useRef } from 'react'
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
  lastWordCount: number
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

/**
 * Texto que pasa de blur a foco, al estilo de los text animations de shadcn.io.
 * Usa Motion y se activa al entrar en viewport.
 */
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

  const isInView = useInView(ref, { once: true, margin: '-8%' })

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

  const tailStartAnimIndex =
    animateBy === 'word' &&
    tailHighlight &&
    tailHighlight.lastWordCount > 0 &&
    animatedSegmentCount > 0
      ? Math.max(
          0,
          animatedSegmentCount -
            Math.min(tailHighlight.lastWordCount, animatedSegmentCount),
        )
      : animatedSegmentCount

  const cutSegmentIndex =
    animateBy === 'word' && tailHighlight && tailHighlight.lastWordCount > 0
      ? findTailStartSegmentIndex(segments, tailStartAnimIndex)
      : segments.length

  const beforeSegments = segments.slice(0, cutSegmentIndex)
  const tailSegments = segments.slice(cutSegmentIndex)

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
      redrawWithoutAnimation()
    }
    const vv = window.visualViewport
    window.addEventListener('resize', handleViewportShift)
    vv?.addEventListener('resize', handleViewportShift)
    vv?.addEventListener('scroll', handleViewportShift)
    viewportListenersCleanupRef.current = () => {
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
    Boolean(tailHighlight?.lastWordCount) && tailSegments.length > 0

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
      ) : tailSegments.length > 0 ? (
        renderWordMotionSpans(tailSegments, tailStartAnimIndex, 'w')
      ) : null}
    </span>
  )
}
