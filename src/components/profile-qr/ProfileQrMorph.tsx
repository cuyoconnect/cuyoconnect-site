import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'

import {
  animateQrMorph,
  drawQrMorph,
  prepareQrMorphCanvas,
  type QrMorphLayout,
  type QrMorphSpotPose,
} from './profile-qr-morph'

export type QrMorphPhase = 'idle' | 'to-qr' | 'qr' | 'to-page'

const TO_QR_MS = 1400
const TO_PAGE_MS = 1050
const SPOT_EASE = [0.65, 0, 0.35, 1] as const
/** Margen del resplandor blanco: el `blur-2xl` se come ~40 px, así que debe sobrar para que el QR quede sobre blanco pleno. */
const BACKDROP_BLEED = 32

function spotMotion(pose: QrMorphSpotPose) {
  return {
    x: pose.x,
    y: pose.y,
    width: pose.width,
    height: pose.height,
    rotate: pose.rotate,
    scale: pose.scale,
    opacity: pose.opacity,
  }
}

export function ProfileQrMorph({
  layout,
  phase,
  reducedMotion,
  name,
  spot,
  onSettled,
  onClose,
}: {
  layout: QrMorphLayout
  phase: Exclude<QrMorphPhase, 'idle'>
  reducedMotion: boolean
  name: string
  /** Mancha amarilla de los links; se reutiliza en las esquinas del QR. */
  spot: ReactNode
  onSettled: (phase: 'qr' | 'idle') => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const progressRef = useRef(0)
  const showQr = phase === 'to-qr' || phase === 'qr'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (phase === 'qr') {
      const ctx = prepareQrMorphCanvas(canvas, layout)
      if (ctx) drawQrMorph(ctx, layout, 1)
      progressRef.current = 1
      return
    }
    const target = phase === 'to-qr' ? 1 : 0
    const fullDuration = phase === 'to-qr' ? TO_QR_MS : TO_PAGE_MS
    return animateQrMorph({
      canvas,
      layout,
      from: progressRef.current,
      to: target,
      duration: reducedMotion ? 0 : fullDuration * Math.abs(target - progressRef.current),
      onUpdate: (t) => {
        progressRef.current = t
      },
      onDone: () => onSettled(phase === 'to-qr' ? 'qr' : 'idle'),
    })
  }, [layout, phase, reducedMotion, onSettled])

  useEffect(() => {
    if (phase === 'qr') closeRef.current?.focus({ preventScroll: true })
  }, [phase])

  return (
    <div
      className="pointer-events-none absolute left-0 z-20"
      style={{ top: layout.top, width: layout.width, height: layout.height }}
    >
      <motion.div
        aria-hidden
        className="absolute rounded-[3rem] bg-white blur-2xl"
        style={{
          left: Math.min(layout.qr.x, layout.title.x) - BACKDROP_BLEED,
          top: layout.qr.y - BACKDROP_BLEED,
          width: Math.max(layout.qr.width, layout.title.width) + BACKDROP_BLEED * 2,
          height: layout.title.y + layout.title.height - layout.qr.y + BACKDROP_BLEED * 2,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showQr ? 1 : 0 }}
        transition={{
          duration: reducedMotion ? 0 : showQr ? 0.5 : 0.45,
          delay: showQr || reducedMotion ? 0 : 0.5,
        }}
      />
      {layout.spots.map((item, index) => (
        <motion.div
          key={index}
          aria-hidden
          className="absolute left-0 top-0"
          initial={spotMotion(item.from)}
          animate={spotMotion(showQr ? item.to : item.from)}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: showQr ? 1 : 0.85,
                  delay: showQr ? 0.1 + index * 0.04 : 0,
                  ease: SPOT_EASE,
                }
          }
        >
          {spot}
        </motion.div>
      ))}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute left-0 top-0"
        style={{ width: layout.width, height: layout.height }}
      />
      <motion.h2
        className="absolute line-clamp-2 text-balance break-words text-center text-xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-3xl"
        style={{
          left: layout.title.x,
          top: layout.title.y,
          width: layout.title.width,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showQr ? 1 : 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          delay: showQr && !reducedMotion ? 0.75 : 0,
        }}
      >
        {name}
      </motion.h2>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        disabled={!showQr}
        className="absolute left-0 top-0 cursor-pointer bg-transparent focus:outline-none"
        style={{
          width: layout.width,
          height: layout.height,
          pointerEvents: phase === 'qr' ? 'auto' : 'none',
        }}
      >
        <span className="sr-only">Volver al perfil</span>
      </button>
    </div>
  )
}
