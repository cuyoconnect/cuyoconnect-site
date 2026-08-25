import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { ShareProjectsModal } from '@/components/github-map/ShareProjectsModal'
import { cn } from '@/lib/utils'

const buttonFocus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900'

const ACTIONS_FADE_S = 0.38
const ACTIONS_EASE = [0.22, 1, 0.36, 1] as const

export function GitHubProjectsSectionActions({
  className,
  visible = true,
}: {
  className?: string
  visible?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('thanks') !== 'proyectos') return

    setModalOpen(true)
    params.delete('thanks')
    const qs = params.toString()
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  }, [])

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          gridTemplateRows: visible ? '1fr' : '0fr',
        }}
        transition={{
          duration: reduceMotion ? 0 : ACTIONS_FADE_S,
          ease: ACTIONS_EASE,
        }}
        aria-hidden={!visible}
        className={cn('grid min-h-0', className)}
      >
        <div className={cn('overflow-hidden', !visible && 'pointer-events-none')}>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              tabIndex={visible ? 0 : -1}
              onClick={() => setModalOpen(true)}
              className={cn(
                'inline-flex w-fit max-w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 sm:px-6',
                buttonFocus,
              )}
            >
              Subir mis proyectos
            </button>
          </div>
        </div>
      </motion.div>

      <ShareProjectsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
