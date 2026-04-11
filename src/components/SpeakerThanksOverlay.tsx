import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

type SpeakerThanksOverlayProps = {
  open: boolean
  onClose: () => void
  /**
   * `community`: tras sumarse con GitHub desde la galería (landing).
   * `proposal`: tras enviar propuesta de charla (default).
   */
  variant?: 'proposal' | 'community'
}

const springPanel = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 380,
  mass: 0.85,
}

const CONFETTI_COLORS = [
  '#1d1d1f',
  '#2a2a2a',
  '#525252',
  '#737373',
  '#a3a3a3',
] as const

type Particle = {
  id: string
  leftPct: number
  delay: number
  duration: number
  drift: number
  w: number
  h: number
  rounded: boolean
  color: string
  spin: number
}

function SpeakerMotionConfetti({ burstKey }: { burstKey: number }) {
  const particles = useMemo((): Particle[] => {
    return Array.from({ length: 56 }, (_, i) => ({
      id: `${burstKey}-${i}`,
      leftPct: Math.random() * 100,
      delay: Math.random() * 0.42,
      duration: 1.85 + Math.random() * 1.25,
      drift: (Math.random() - 0.5) * 200,
      w: 5 + Math.random() * 10,
      h: 3 + Math.random() * 7,
      rounded: Math.random() > 0.45,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      spin: (Math.random() > 0.5 ? 1 : -1) * (540 + Math.random() * 360),
    }))
  }, [burstKey])

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[205] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={cn('absolute top-0', p.rounded ? 'rounded-full' : 'rounded-sm')}
          style={{
            left: `${p.leftPct}%`,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            marginTop: '-4vh',
          }}
          initial={{ y: '0vh', x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: '118vh',
            x: p.drift,
            opacity: 0.2,
            rotate: p.spin,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.2, 0.55, 0.25, 1],
          }}
        />
      ))}
    </div>
  )
}

export function SpeakerThanksOverlay({
  open,
  onClose,
  variant = 'proposal',
}: SpeakerThanksOverlayProps) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const [burstKey, setBurstKey] = useState(0)
  const firedBurstForOpen = useRef(false)

  useEffect(() => {
    if (!open) {
      firedBurstForOpen.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open || reduceMotion) return
    if (firedBurstForOpen.current) return
    firedBurstForOpen.current = true
    setBurstKey((k) => k + 1)
  }, [open, reduceMotion])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [open])

  if (typeof document === 'undefined') return null

  const showConfetti = open && !reduceMotion
  const isCommunity = variant === 'community'

  const titleText = isCommunity ? 'Muchas gracias' : 'Gracias'
  const bodyText = isCommunity
    ? 'Te tendremos en cuenta en la comunidad. Nos vemos en los próximos eventos.'
    : 'Guardamos tu propuesta. Te tendremos en cuenta para nuestros futuros eventos.'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-[200] flex items-center justify-center',
            isCommunity ? 'p-0' : 'p-4 sm:p-6',
          )}
          role="presentation"
          initial={false}
        >
          <motion.button
            type="button"
            className={cn(
              'absolute inset-0 backdrop-blur-md',
              isCommunity ? 'bg-white/92' : 'bg-white/75',
            )}
            aria-label="Cerrar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          {showConfetti ? <SpeakerMotionConfetti burstKey={burstKey} /> : null}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'relative z-[210] flex w-full flex-col items-center text-center',
              isCommunity
                ? 'min-h-[100dvh] max-w-none justify-center px-6 py-16 sm:px-10'
                : 'max-w-lg rounded-3xl border border-neutral-200/90 bg-white px-6 py-10 shadow-xl sm:px-10 sm:py-12',
            )}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 8 }
            }
            transition={
              reduceMotion ? { duration: 0 } : { ...springPanel, delay: 0.06 }
            }
          >
            <p
              id={titleId}
              className={cn(
                'text-balance font-semibold tracking-tight text-neutral-950',
                isCommunity
                  ? 'max-w-2xl text-4xl sm:text-5xl md:text-6xl'
                  : 'text-3xl sm:text-4xl',
              )}
            >
              {titleText}
            </p>
            <p
              className={cn(
                'max-w-md text-pretty leading-relaxed text-neutral-600',
                isCommunity
                  ? 'mt-6 text-lg sm:mt-8 sm:text-xl md:max-w-xl'
                  : 'mt-4 text-base sm:text-lg',
              )}
            >
              {bodyText}
            </p>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'mt-8 inline-flex w-full max-w-xs cursor-pointer items-center justify-center rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-auto',
              )}
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
