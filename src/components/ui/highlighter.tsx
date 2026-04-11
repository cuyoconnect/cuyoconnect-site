import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { useReducedMotion } from 'framer-motion'
import { useInView } from 'motion/react'
import { annotate } from 'rough-notation'
import type { RoughAnnotation } from 'rough-notation/lib/model'
import { cn } from '@/lib/utils'

type AnnotationAction =
  | 'highlight'
  | 'underline'
  | 'box'
  | 'circle'
  | 'strike-through'
  | 'crossed-off'
  | 'bracket'

const WAVY_SVG_HEIGHT = 16

function fract01(n: number) {
  const x = Math.sin(n) * 43758.5453123
  return x - Math.floor(x)
}

/** Ruido 1D suave y determinista (misma entrada → mismo valor). */
function smoothNoise1d(t: number) {
  const i = Math.floor(t)
  const f = t - i
  const u = f * f * (3 - 2 * f)
  const a = fract01(i)
  const b = fract01(i + 1)
  return a + (b - a) * u
}

/**
 * Subrayado ondulado “a mano”: pocas ondas legibles, variación suave de tamaño
 * y trazo irregular (sin alta frecuencia que en pantalla se lea como línea recta).
 */
function buildHandDrawnWavePath(
  width: number,
  svgHeight: number,
  amplitudePx: number,
  numCycles: number,
) {
  const midY = svgHeight / 2
  const steps = Math.max(28, Math.ceil(width / 2.8))
  const parts: string[] = []

  /** Variación leve de “cuánto ondula” por tramo (no rangos extremos). */
  const freqWander = (u: number) =>
    0.78 + 0.44 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (u * 1.65 + 0.09)))

  let gMean = 0
  for (let j = 0; j < 200; j++) {
    gMean += freqWander((j + 0.5) / 200) / 200
  }
  if (gMean < 1e-6) gMean = 1

  let phase = 0

  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const x = u * width

    if (i > 0) {
      const u0 = (i - 1) / steps
      const u1 = i / steps
      const c0 = (numCycles * freqWander(u0)) / gMean
      const c1 = (numCycles * freqWander(u1)) / gMean
      const du = 1 / steps
      phase += Math.PI * (c0 + c1) * du
    }

    const ampScale = 0.58 + 0.48 * smoothNoise1d(u * 4.2 + width * 0.018)
    const amp = amplitudePx * ampScale

    let y = midY + amp * Math.sin(phase)

    /** Pequeño “temblor” de lápiz (baja amplitud; no suma otra sinusoide densa). */
    const pencil =
      amplitudePx *
      0.12 *
      (smoothNoise1d(u * 11.5 + 0.7 + width * 0.012) - 0.5) *
      2
    /** Deriva vertical lenta, no sinusoidal perfecta. */
    const meander =
      amplitudePx * 0.11 * Math.sin(2 * Math.PI * u * 1.15 + 0.35 + width * 0.004)

    y += pencil + meander

    parts.push(
      i === 0
        ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
        : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
  }
  return parts.join(' ')
}

interface HighlighterProps {
  children: React.ReactNode
  className?: string
  action?: AnnotationAction
  color?: string
  strokeWidth?: number
  animationDuration?: number
  iterations?: number
  padding?: number
  multiline?: boolean
  isView?: boolean
  /** Espera antes de dibujar la anotación (p. ej. tras un fade-in del texto). */
  annotationDelayMs?: number
  /**
   * Subrayado ondulado estilo mano alzada (SVG + trazo animado).
   * Solo aplica con `action="underline"`.
   */
  wavy?: boolean
  /** Ciclos de onda a lo largo del texto (valores bajos ≈ ondas anchas, más “dibujadas”). */
  wavyCycles?: number
  /** Amplitud pico a pico de la onda en px (mitad = amplitud del seno). */
  wavyAmplitudePx?: number
}

export function Highlighter({
  children,
  className,
  action = 'highlight',
  color = '#ffd1dc',
  strokeWidth = 1.5,
  animationDuration = 1200,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  annotationDelayMs = 0,
  wavy = false,
  wavyCycles = 4,
  wavyAmplitudePx = 3.5,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const wavyPathRef = useRef<SVGPathElement>(null)
  const [waveWidth, setWaveWidth] = useState(0)
  const [delayPassed, setDelayPassed] = useState(annotationDelayMs === 0)

  const reduceMotion = useReducedMotion()

  const isInView = useInView(elementRef, {
    once: true,
    margin: '-10%',
  })

  const shouldShow = !isView || isInView
  const isWavyUnderline = wavy && action === 'underline'

  const wavePathD = useMemo(
    () =>
      waveWidth > 1
        ? buildHandDrawnWavePath(
            waveWidth,
            WAVY_SVG_HEIGHT,
            wavyAmplitudePx,
            wavyCycles,
          )
        : '',
    [waveWidth, wavyAmplitudePx, wavyCycles],
  )

  useLayoutEffect(() => {
    let cancelled = false

    const schedule = (fn: () => void) => {
      const id = requestAnimationFrame(() => {
        if (!cancelled) fn()
      })
      return () => cancelAnimationFrame(id)
    }

    if (!shouldShow || !isWavyUnderline) {
      return schedule(() => {
        setDelayPassed(annotationDelayMs === 0)
      })
    }
    if (annotationDelayMs === 0) {
      return schedule(() => {
        setDelayPassed(true)
      })
    }

    const cancelFalse = schedule(() => {
      setDelayPassed(false)
    })
    const timerId = window.setTimeout(() => {
      if (!cancelled) setDelayPassed(true)
    }, annotationDelayMs)

    return () => {
      cancelled = true
      cancelFalse()
      window.clearTimeout(timerId)
    }
  }, [shouldShow, isWavyUnderline, annotationDelayMs])

  useLayoutEffect(() => {
    if (!isWavyUnderline || !shouldShow) return undefined

    const el = elementRef.current
    if (!el) return undefined

    const measure = () => {
      const w = el.getBoundingClientRect().width
      setWaveWidth(w)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isWavyUnderline, shouldShow])

  useLayoutEffect(() => {
    if (!isWavyUnderline || !shouldShow || !delayPassed) return

    const path = wavyPathRef.current
    if (!path || waveWidth <= 1 || !wavePathD) return

    if (reduceMotion) {
      const len = path.getTotalLength()
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = '0'
      path.style.transition = 'none'
      return
    }

    const len = path.getTotalLength()
    path.style.transition = 'none'
    path.style.strokeDasharray = `${len}`
    path.style.strokeDashoffset = `${len}`

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
        path.style.strokeDashoffset = '0'
      })
    })
  }, [
    isWavyUnderline,
    shouldShow,
    delayPassed,
    waveWidth,
    wavePathD,
    animationDuration,
    reduceMotion,
  ])

  useLayoutEffect(() => {
    let annotation: RoughAnnotation | null = null
    let resizeObserver: ResizeObserver | null = null
    let showTimeoutId: number | null = null
    let redrawFrameId: number | null = null
    let detachViewportListeners: (() => void) | null = null

    if (isWavyUnderline) {
      return undefined
    }

    const element = elementRef.current
    if (!(shouldShow && element)) {
      return undefined
    }

    const annotationConfig = {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    }

    const attach = () => {
      const el = elementRef.current
      if (!el) return

      const currentAnnotation = annotate(el, annotationConfig)
      annotation = currentAnnotation
      currentAnnotation.show()

      const redrawWithoutAnimation = () => {
        if (annotation !== currentAnnotation || redrawFrameId != null) return
        redrawFrameId = window.requestAnimationFrame(() => {
          redrawFrameId = null
          if (annotation !== currentAnnotation) return
          currentAnnotation.show()
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

      const scheduleViewportGeometrySync = () => {
        if (annotation !== currentAnnotation) return
        cancelViewportRedrawRafs()
        viewportRaf1 = window.requestAnimationFrame(() => {
          viewportRaf1 = null
          viewportRaf2 = window.requestAnimationFrame(() => {
            viewportRaf2 = null
            if (annotation !== currentAnnotation) return
            currentAnnotation.show()
          })
        })
      }

      resizeObserver = new ResizeObserver(() => {
        redrawWithoutAnimation()
      })

      resizeObserver.observe(el)

      // Cuando el texto no cambia de tamaño pero el layout sí (p. ej. un
      // acordeón arriba empuja el footer), el RO del span no dispara y
      // rough-notation puede quedar desfasado: el SVG es absolute y solo
      // repinta con resize del elemento o de la ventana.
      let layoutResizeObserver: ResizeObserver | null = null
      if (typeof document !== 'undefined' && document.body) {
        layoutResizeObserver = new ResizeObserver(() => {
          redrawWithoutAnimation()
        })
        layoutResizeObserver.observe(document.body)
      }

      // `visualViewport` cubre los cambios de barras del navegador móvil que
      // mueven el texto sin disparar un resize del propio span.
      const handleViewportShift = () => {
        scheduleViewportGeometrySync()
      }
      const vv = window.visualViewport
      window.addEventListener('resize', handleViewportShift)
      vv?.addEventListener('resize', handleViewportShift)
      vv?.addEventListener('scroll', handleViewportShift)
      detachViewportListeners = () => {
        cancelViewportRedrawRafs()
        window.removeEventListener('resize', handleViewportShift)
        vv?.removeEventListener('resize', handleViewportShift)
        vv?.removeEventListener('scroll', handleViewportShift)
        layoutResizeObserver?.disconnect()
        layoutResizeObserver = null
      }
    }

    if (annotationDelayMs > 0) {
      showTimeoutId = window.setTimeout(attach, annotationDelayMs)
    } else {
      attach()
    }

    return () => {
      if (showTimeoutId != null) window.clearTimeout(showTimeoutId)
      if (redrawFrameId != null) window.cancelAnimationFrame(redrawFrameId)
      if (detachViewportListeners) {
        detachViewportListeners()
      }
      annotation?.remove()
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [
    shouldShow,
    isWavyUnderline,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
    annotationDelayMs,
  ])

  if (isWavyUnderline) {
    return (
      <span
        ref={elementRef}
        className={cn(
          'relative inline-block bg-transparent text-inherit',
          className,
          // Reserva espacio bajo la línea para la onda (el SVG es absolute y no estira el flujo).
          'pb-[0.58em]',
        )}
      >
        {children}
        {waveWidth > 1 && shouldShow && delayPassed && wavePathD ? (
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[max(0.52em,14px)] w-full overflow-visible"
            viewBox={`0 0 ${waveWidth} ${WAVY_SVG_HEIGHT}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              ref={wavyPathRef}
              d={wavePathD}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    )
  }

  return (
    <span
      ref={elementRef}
      className={cn(
        'relative inline-block bg-transparent text-inherit',
        className,
      )}
    >
      {children}
    </span>
  )
}
