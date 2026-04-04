import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { CommunityBrandIcon } from '@/components/CommunityBrandIcon'
import { COMMUNITY_LINKS, openCommunityLink } from '@/lib/community-links'

type JoinCommunityModalProps = {
  open: boolean
  onClose: () => void
}

const springPanel = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 360,
  mass: 0.8,
}

export function JoinCommunityModal({ open, onClose }: JoinCommunityModalProps) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          initial={false}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            aria-label="Cerrar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex h-auto max-h-[min(85svh,calc(100svh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={reduceMotion ? { duration: 0 } : { ...springPanel, delay: 0.1 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-neutral-950"
                >
                  Conectemos
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Elegí la plataforma que más uses.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-[10px] p-2 text-neutral-500 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:duration-[240ms] hover:delay-0 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                aria-label="Cerrar"
                onClick={onClose}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="min-h-0 flex-auto list-none overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
              {COMMUNITY_LINKS.map(({ id, label, href }, i) => (
                <motion.li
                  key={id}
                  className="border-b border-neutral-100 last:border-b-0"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.38, delay: 0.12 + i * 0.055, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-3.5 text-left text-sm font-medium text-neutral-900 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:duration-[240ms] hover:delay-0 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                    onClick={() => {
                      openCommunityLink(href)
                      onClose()
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100"
                        aria-hidden
                      >
                        <CommunityBrandIcon id={id} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 truncate">{label}</span>
                    </span>
                    <svg
                      className="h-4 w-4 shrink-0 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
