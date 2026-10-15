import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

import {
  createLogoQrField,
  createQrMatrix,
  loadLogoMask,
  logoMaskSide,
  type LogoQrField,
} from './logo-qr-field'
import { mountLogoQr, type LogoQrColors, type LogoQrRenderer } from './logo-qr-renderer'

export type LogoQrView = 'logo' | 'qr'

export type LogoQrCodeProps = {
  /** URL (o texto) que codifica el QR. */
  value: string
  /** Imagen del logo; su silueta se convierte en el sólido 3D. */
  logoSrc?: string
  initialView?: LogoQrView
  colors?: LogoQrColors
  /** Espesor del logo en 3D, en celdas de la grilla. */
  thickness?: number
  className?: string
  /** Se muestra si WebGPU no está disponible o el render falla. */
  fallback?: ReactNode
  onViewChange?: (view: LogoQrView) => void
}

/** Distancia mínima para considerar que el gesto es un arrastre y no un click. */
const DRAG_THRESHOLD_PX = 5

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function LogoQrCanvas({
  value,
  logoSrc = '/favicon.png',
  initialView = 'logo',
  colors,
  thickness,
  className,
  fallback,
  onViewChange,
}: LogoQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<LogoQrRenderer | null>(null)
  const viewRef = useRef<LogoQrView>(initialView)
  const [view, setView] = useState<LogoQrView>(initialView)
  const [field, setField] = useState<LogoQrField | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const matrix = createQrMatrix(value)
        const mask = await loadLogoMask(logoSrc, logoMaskSide(matrix.size))
        if (!cancelled) setField(createLogoQrField(matrix, mask, { thickness }))
      } catch (error) {
        console.error('No se pudo preparar el QR 3D.', error)
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [value, logoSrc, thickness])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !field) return
    const renderer = mountLogoQr(canvas, field, {
      colors,
      reducedMotion: prefersReducedMotion(),
      onReady: () => setReady(true),
      onError: () => setFailed(true),
    })
    renderer.setFlat(viewRef.current === 'qr')
    rendererRef.current = renderer
    return () => {
      renderer.dispose()
      if (rendererRef.current === renderer) rendererRef.current = null
    }
  }, [field, colors])

  const dragRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    suppressClickRef.current = false
    if (event.button !== 0 || viewRef.current === 'qr') return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Sin captura el arrastre sigue funcionando mientras el puntero esté sobre el botón.
    }
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD_PX) return
    drag.moved = true
    rendererRef.current?.dragBy(event.clientX - drag.x, event.clientY - drag.y)
    drag.x = event.clientX
    drag.y = event.clientY
  }, [])

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (drag.moved) {
      suppressClickRef.current = true
      rendererRef.current?.endDrag()
    }
  }, [])

  const toggle = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    const next: LogoQrView = viewRef.current === 'logo' ? 'qr' : 'logo'
    viewRef.current = next
    setView(next)
    rendererRef.current?.setFlat(next === 'qr')
    onViewChange?.(next)
  }, [onViewChange])

  if (failed && fallback) return <>{fallback}</>

  return (
    <button
      type="button"
      onClick={toggle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      aria-label={view === 'logo' ? 'Mostrar el código QR' : 'Volver al logo'}
      aria-busy={!ready}
      data-logo-qr-view={view}
      style={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', touchAction: 'none' }}
      className={cn(
        'mx-auto block max-w-[18rem] select-none',
        view === 'qr' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        'rounded-[2rem] border-0 bg-transparent p-0',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-400',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }}
      />
      {!ready ? (
        <span
          aria-hidden
          className="absolute inset-4 animate-pulse rounded-[1.5rem] bg-neutral-100"
        />
      ) : null}
    </button>
  )
}

/** Remonta el canvas cuando cambia el valor para no reutilizar un contexto WebGPU viejo. */
export function LogoQrCode(props: LogoQrCodeProps) {
  return <LogoQrCanvas key={`${props.value}|${props.logoSrc ?? ''}`} {...props} />
}
