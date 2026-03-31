import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import {
  COMMUNITY_STRIP_PARTNERS,
  type CommunityStripPartner,
} from '@/data/community-strip'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

const SM_QUERY = '(min-width: 640px)'

function subscribeToMedia(cb: () => void) {
  const mql = window.matchMedia(SM_QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function getIsDesktop() {
  if (typeof window === 'undefined') return true
  return window.matchMedia(SM_QUERY).matches
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeToMedia, getIsDesktop, () => true)
}

function buildSets(
  logos: CommunityStripPartner[],
  perSet: number,
): CommunityStripPartner[][] {
  const sets: CommunityStripPartner[][] = []
  for (let i = 0; i < logos.length; i += perSet) {
    const set = logos.slice(i, i + perSet)
    while (set.length < perSet) {
      set.push(logos[set.length % logos.length])
    }
    sets.push(set)
  }
  return sets
}

const CYCLE_MS = 4000

type CommunityStripSectionProps = {
  className?: string
}

export function CommunityStripSection({
  className,
}: CommunityStripSectionProps) {
  const isDesktop = useIsDesktop()
  const perSet = isDesktop ? 3 : 4
  const sets = useMemo(
    () => buildSets(COMMUNITY_STRIP_PARTNERS, perSet),
    [perSet],
  )

  const [activeSet, setActiveSet] = useState(0)

  useEffect(() => {
    setActiveSet(0)
  }, [perSet])

  const nextSet = useCallback(() => {
    setActiveSet((prev) => (prev + 1) % sets.length)
  }, [sets.length])

  useEffect(() => {
    const id = setInterval(nextSet, CYCLE_MS)
    return () => clearInterval(id)
  }, [nextSet])

  return (
    <div
      role="region"
      aria-labelledby="community-strip-heading"
      className={cn(
        // Misma línea que el hero en sm-; esta banda vive fuera del px-4 del bloque superior.
        'w-full shrink-0 bg-white px-4 py-10 text-neutral-950 sm:px-0 sm:py-12',
        '[color-scheme:light]',
        className,
      )}
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS)}>
        <p
          id="community-strip-heading"
          className="bg-gradient-to-r from-neutral-600 to-neutral-400 bg-clip-text text-center font-mono text-[11px] font-medium uppercase leading-snug tracking-wide text-transparent"
        >
          Algunas organizaciones que confían en nosotros
        </p>

        {/* Altura fija + overflow para que el ciclo de logos no mueva el flujo ni desborde al animar */}
        <div className="relative mt-12 min-h-[6.5rem] h-[6.5rem] [contain:layout] sm:mt-16 sm:min-h-14 sm:h-14">
          <AnimatePresence mode="wait" presenceAffectsLayout={false}>
            <motion.div
              key={`${perSet}-${activeSet}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
                exit: { transition: { staggerChildren: 0.05 } },
              }}
              className="absolute inset-0 grid grid-cols-2 items-center justify-items-stretch gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-0 sm:gap-y-0"
            >
              {sets[activeSet].map(
                (partner: CommunityStripPartner, i: number) => (
                  <motion.div
                    key={`${partner.name}-${i}`}
                    className="flex min-w-0 items-center justify-center max-sm:px-3"
                    variants={{
                      hidden: { y: 40, filter: 'blur(10px)', opacity: 0 },
                      visible: { y: 0, filter: 'blur(0px)', opacity: 1 },
                      exit: { y: -40, filter: 'blur(10px)', opacity: 0 },
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <LogoItem partner={partner} />
                  </motion.div>
                ),
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function getLogoFilter(partner: CommunityStripPartner): string {
  if (partner.logoColorLarge) return 'grayscale(100%)'
  if (partner.logoInvert || partner.logoForLightBg) return 'brightness(0)'
  return 'grayscale(100%) brightness(0.9)'
}

function LogoItem({ partner }: { partner: CommunityStripPartner }) {
  const img = (
    <img
      src={partner.logoSrc}
      alt={partner.logoAlt}
      width={120}
      height={40}
      loading="lazy"
      style={{ filter: getLogoFilter(partner) }}
      className={cn(
        'h-auto max-h-7 w-auto max-w-full min-w-0 select-none object-contain sm:max-h-10',
        partner.logoColorLarge && 'max-h-9 sm:max-h-12',
        partner.imgClassName,
      )}
    />
  )

  if (partner.href) {
    return (
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full min-w-0 items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        aria-label={`${partner.name} — sitio oficial (se abre en una pestaña nueva)`}
      >
        {img}
      </a>
    )
  }

  return (
    <span className="inline-flex max-w-full min-w-0 items-center justify-center">
      {img}
    </span>
  )
}
