import { motion, useReducedMotion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

const HERO_SRC = '/cuyo-connect-hero.webp'
const EASTER_SRC = '/hero-easter-qr.webp'

const HERO_WIDTH = 1664
const HERO_HEIGHT = 647
const EASTER_WIDTH = 1664
const EASTER_HEIGHT = 647

const TAP_GOAL = 3
const TAP_WINDOW_MS = 900

/** Filas de bloques (estilo vertical de Larose). Menos filas = menos nodos, más fluido. */
const PIXEL_ROWS = 10
/** delay ∝ índice Larose; igual espíritu que 0.02 del tutorial. */
const STAGGER = 0.022

type Bounds = { width: number; height: number }

type PixelMode = 'cover' | 'uncover'

/** Igual que el peor `delay` de la rejilla (cover usa `custom[1]`). */
function maxPixelDelaySteps(bounds: Bounds, mode: PixelMode): number {
  const W = bounds.width
  const H = bounds.height
  const rowCount = PIXEL_ROWS
  const blockH = H / rowCount
  const nbCols = Math.max(4, Math.ceil(W / blockH))
  let m = 0
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    for (let randomIndex = 0; randomIndex < nbCols; randomIndex++) {
      const d1 = rowCount - rowIndex + randomIndex
      const d0 = rowIndex + randomIndex
      const d = mode === 'cover' ? d1 : d0
      if (d > m) m = d
    }
  }
  return m
}

function approxPixelWaveMs(bounds: Bounds, mode: PixelMode): number {
  return Math.ceil(maxPixelDelaySteps(bounds, mode) * STAGGER * 1000 + 80)
}

/**
 * Momento del fade del pie solo en la fase `cover` (blanco tapando).
 * Mitad del cover ≈ en medio del primer tramo del pixelado, no al pasar al reveal.
 */
const CAPTION_FADE_MID_COVER_FRACTION = 0.5

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Transición tipo Oliviér Larose: bloques opacos (blanco página), solo opacity + delays,
 * duration 0 → sin “mezcla” larga. `cover`: tapa lo de abajo; `uncover`: lo revela.
 */
function PixelBlockGrid({
  mode,
  bounds,
  layoutKey,
  onComplete,
}: {
  mode: PixelMode
  bounds: Bounds
  layoutKey: string
  onComplete: () => void
}) {
  const { width: W, height: H } = bounds
  const rowCount = PIXEL_ROWS
  const blockH = H / rowCount
  const nbCols = Math.max(4, Math.ceil(W / blockH))
  const doneRef = useRef(false)

  const cells = useMemo(() => {
    const list: {
      key: string
      row: number
      colSlot: number
      custom: [number, number]
    }[] = []
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const shuffled = shuffleIndices(nbCols)
      shuffled.forEach((randomIndex, colOrder) => {
        list.push({
          key: `${layoutKey}-r${rowIndex}-s${colOrder}`,
          row: rowIndex,
          colSlot: colOrder,
          custom: [
            rowIndex + randomIndex,
            rowCount - rowIndex + randomIndex,
          ] as [number, number],
        })
      })
    }
    return list
  }, [layoutKey, W, H, rowCount, nbCols])

  const maxDelaySteps = useMemo(() => {
    let m = 0
    for (const c of cells) {
      const d = mode === 'cover' ? c.custom[1] : c.custom[0]
      if (d > m) m = d
    }
    return m
  }, [cells, mode])

  useEffect(() => {
    const ms = Math.ceil(maxDelaySteps * STAGGER * 1000 + 80)
    const id = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true
        onComplete()
      }
    }, ms)
    return () => clearTimeout(id)
  }, [maxDelaySteps, onComplete])

  const variants = useMemo(
    () => ({
      initial:
        mode === 'cover'
          ? { opacity: 0 }
          : { opacity: 1 },
      done:
        mode === 'cover'
          ? (delay: [number, number]) => ({
              opacity: 1,
              transition: {
                duration: 0,
                delay: STAGGER * delay[1],
              },
            })
          : (delay: [number, number]) => ({
              opacity: 0,
              transition: {
                duration: 0,
                delay: STAGGER * delay[0],
              },
            }),
    }),
    [mode],
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col"
      aria-hidden
    >
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div
          key={`${layoutKey}-row-${rowIndex}`}
          className="flex min-h-0 w-full flex-1"
        >
          {cells
            .filter((c) => c.row === rowIndex)
            .map((cell) => (
              <motion.div
                key={cell.key}
                custom={cell.custom}
                variants={variants}
                initial="initial"
                animate="done"
                className="min-h-0 min-w-0 flex-1 bg-white"
              />
            ))}
        </div>
      ))}
    </div>
  )
}

export type HeroEasterEggSurface = 'hero' | 'qr'

type StablePhase = HeroEasterEggSurface

/** Secuencial: cubrir → revelar (nunca hero y QR animando a la vez). */
type Phase =
  | StablePhase
  | 'h2q_cover'
  | 'h2q_reveal'
  | 'q2h_cover'
  | 'q2h_reveal'

type LoadGate = null | 'qr' | 'hero'

export function HeroEasterEggImage({
  className,
  imgClassName,
  onCaptionSurfaceChange,
}: {
  className?: string
  imgClassName?: string
  /**
   * Durante la fase `cover` (~mitad de ese tramo): el pie hace fade mientras sigue el pixel,
   * no al terminar el destape.
   */
  onCaptionSurfaceChange?: (surface: HeroEasterEggSurface) => void
}) {
  const reduceMotion = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tapCount, setTapCount] = useState(0)
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captionTimerRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<Phase>('hero')
  const [loadGate, setLoadGate] = useState<LoadGate>(null)
  const loadGateRef = useRef<LoadGate>(null)
  const [frozenBounds, setFrozenBounds] = useState<Bounds | null>(null)
  const [gridKey, setGridKey] = useState(0)

  const clearCaptionTimer = useCallback(() => {
    if (captionTimerRef.current != null) {
      clearTimeout(captionTimerRef.current)
      captionTimerRef.current = null
    }
  }, [])

  const scheduleTapReset = useCallback(() => {
    if (tapResetRef.current) clearTimeout(tapResetRef.current)
    tapResetRef.current = setTimeout(() => setTapCount(0), TAP_WINDOW_MS)
  }, [])

  const startHeroToQr = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    if (reduceMotion) {
      onCaptionSurfaceChange?.('qr')
      setPhase('qr')
      return
    }
    clearCaptionTimer()
    const b = { width: rect.width, height: rect.height }
    const coverMs = approxPixelWaveMs(b, 'cover')
    const captionMs = Math.round(
      Math.max(100, coverMs * CAPTION_FADE_MID_COVER_FRACTION),
    )
    captionTimerRef.current = window.setTimeout(() => {
      captionTimerRef.current = null
      onCaptionSurfaceChange?.('qr')
    }, captionMs)
    setFrozenBounds(b)
    setGridKey((k) => k + 1)
    setPhase('h2q_cover')
  }, [clearCaptionTimer, reduceMotion, onCaptionSurfaceChange])

  const startQrToHero = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    if (reduceMotion) {
      onCaptionSurfaceChange?.('hero')
      setPhase('hero')
      return
    }
    clearCaptionTimer()
    const b = { width: rect.width, height: rect.height }
    const coverMs = approxPixelWaveMs(b, 'cover')
    const captionMs = Math.round(
      Math.max(100, coverMs * CAPTION_FADE_MID_COVER_FRACTION),
    )
    captionTimerRef.current = window.setTimeout(() => {
      captionTimerRef.current = null
      onCaptionSurfaceChange?.('hero')
    }, captionMs)
    setFrozenBounds(b)
    setGridKey((k) => k + 1)
    setPhase('q2h_cover')
  }, [clearCaptionTimer, reduceMotion, onCaptionSurfaceChange])

  const onActivate = useCallback(() => {
    const stable = phase === 'hero' || phase === 'qr'
    if (!stable || loadGate) return

    const next = tapCount + 1
    if (next >= TAP_GOAL) {
      if (tapResetRef.current) {
        clearTimeout(tapResetRef.current)
        tapResetRef.current = null
      }
      setTapCount(0)
      const gate: LoadGate = phase === 'hero' ? 'qr' : 'hero'
      loadGateRef.current = gate
      setLoadGate(gate)
    } else {
      setTapCount(next)
      scheduleTapReset()
    }
  }, [phase, tapCount, loadGate, scheduleTapReset])

  const handleEasterReady = useCallback(() => {
    if (loadGateRef.current !== 'qr') return
    loadGateRef.current = null
    setLoadGate(null)
    startHeroToQr()
  }, [startHeroToQr])

  const handleHeroReady = useCallback(() => {
    if (loadGateRef.current !== 'hero') return
    loadGateRef.current = null
    setLoadGate(null)
    startQrToHero()
  }, [startQrToHero])

  const handleEasterError = useCallback(() => {
    loadGateRef.current = null
    setLoadGate(null)
  }, [])

  const handleHeroError = useCallback(() => {
    loadGateRef.current = null
    setLoadGate(null)
  }, [])

  const onH2qCoverDone = useCallback(() => {
    clearCaptionTimer()
    setGridKey((k) => k + 1)
    setPhase('h2q_reveal')
  }, [clearCaptionTimer])

  const onH2qRevealDone = useCallback(() => {
    setPhase('qr')
    setFrozenBounds(null)
  }, [])

  const onQ2hCoverDone = useCallback(() => {
    clearCaptionTimer()
    setGridKey((k) => k + 1)
    setPhase('q2h_reveal')
  }, [clearCaptionTimer])

  const onQ2hRevealDone = useCallback(() => {
    setPhase('hero')
    setFrozenBounds(null)
  }, [])

  useEffect(
    () => () => {
      if (tapResetRef.current) clearTimeout(tapResetRef.current)
      if (captionTimerRef.current != null) {
        clearTimeout(captionTimerRef.current)
        captionTimerRef.current = null
      }
    },
    [],
  )

  const imgShared = cn(
    'pointer-events-none absolute inset-0 mx-0 mt-0 mb-0 block h-full w-full max-h-none min-h-0 min-w-0 max-w-full',
    'object-cover object-[center_center] select-none',
    'max-sm:rounded-none',
    imgClassName,
  )

  const heroPreload = phase === 'qr' && loadGate === 'hero'
  const easterPreload = phase === 'hero' && loadGate === 'qr'

  const showHeroImg =
    phase === 'hero' ||
    phase === 'h2q_cover' ||
    phase === 'q2h_cover' ||
    phase === 'q2h_reveal' ||
    heroPreload

  const showEasterImg =
    phase === 'qr' ||
    phase === 'h2q_reveal' ||
    phase === 'q2h_cover' ||
    easterPreload

  const heroImgOpacity =
    heroPreload || phase === 'q2h_cover' ? 0 : phase === 'q2h_reveal' || phase === 'hero' || phase === 'h2q_cover' ? 1 : 0

  const easterImgOpacity =
    easterPreload ? 0 : phase === 'qr' || phase === 'h2q_reveal' || phase === 'q2h_cover' ? 1 : 0

  const tapEnabled =
    (phase === 'hero' || phase === 'qr') && loadGate === null

  return (
    <div
      ref={wrapRef}
      onClick={tapEnabled ? onActivate : undefined}
      className={cn('relative isolate w-full overflow-hidden', className)}
      style={{ aspectRatio: `${HERO_WIDTH} / ${HERO_HEIGHT}` }}
    >
      {showHeroImg ? (
        <img
          src={HERO_SRC}
          alt=""
          width={HERO_WIDTH}
          height={HERO_HEIGHT}
          decoding="async"
          fetchPriority={phase === 'hero' && !loadGate ? 'high' : 'low'}
          loading={
            phase === 'hero' && !easterPreload ? 'eager' : heroPreload ? 'eager' : 'lazy'
          }
          draggable={false}
          className={imgShared}
          style={{
            zIndex: 0,
            opacity: heroImgOpacity,
          }}
          onLoad={heroPreload ? handleHeroReady : undefined}
          onError={heroPreload ? handleHeroError : undefined}
        />
      ) : null}

      {showEasterImg ? (
        <img
          src={EASTER_SRC}
          alt=""
          width={EASTER_WIDTH}
          height={EASTER_HEIGHT}
          decoding="async"
          fetchPriority="low"
          loading={easterPreload ? 'eager' : 'lazy'}
          draggable={false}
          className={imgShared}
          style={{
            zIndex: 1,
            opacity: easterImgOpacity,
          }}
          onLoad={easterPreload ? handleEasterReady : undefined}
          onError={easterPreload ? handleEasterError : undefined}
        />
      ) : null}

      {phase === 'h2q_cover' && frozenBounds ? (
        <PixelBlockGrid
          mode="cover"
          bounds={frozenBounds}
          layoutKey={`h2q-c-${gridKey}`}
          onComplete={onH2qCoverDone}
        />
      ) : null}

      {phase === 'h2q_reveal' && frozenBounds ? (
        <PixelBlockGrid
          mode="uncover"
          bounds={frozenBounds}
          layoutKey={`h2q-u-${gridKey}`}
          onComplete={onH2qRevealDone}
        />
      ) : null}

      {phase === 'q2h_cover' && frozenBounds ? (
        <PixelBlockGrid
          mode="cover"
          bounds={frozenBounds}
          layoutKey={`q2h-c-${gridKey}`}
          onComplete={onQ2hCoverDone}
        />
      ) : null}

      {phase === 'q2h_reveal' && frozenBounds ? (
        <PixelBlockGrid
          mode="uncover"
          bounds={frozenBounds}
          layoutKey={`q2h-u-${gridKey}`}
          onComplete={onQ2hRevealDone}
        />
      ) : null}
    </div>
  )
}
