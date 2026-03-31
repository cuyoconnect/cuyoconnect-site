import { useLayoutEffect, useRef } from 'react'
import type React from 'react'
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
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null)

  const isInView = useInView(elementRef, {
    once: true,
    margin: '-10%',
  })

  const shouldShow = !isView || isInView

  useLayoutEffect(() => {
    let annotation: RoughAnnotation | null = null
    let resizeObserver: ResizeObserver | null = null
    let showTimeoutId: ReturnType<typeof setTimeout> | null = null

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

      resizeObserver = new ResizeObserver(() => {
        currentAnnotation.hide()
        currentAnnotation.show()
      })

      resizeObserver.observe(el)
      resizeObserver.observe(document.body)
    }

    if (annotationDelayMs > 0) {
      showTimeoutId = window.setTimeout(attach, annotationDelayMs)
    } else {
      attach()
    }

    return () => {
      if (showTimeoutId != null) window.clearTimeout(showTimeoutId)
      annotation?.remove()
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
    annotationDelayMs,
  ])

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
