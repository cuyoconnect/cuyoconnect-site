import { useMemo, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

export type ProjectLink = {
  id: string
  label: string
  href: string
  icon: 'arrow' | 'github' | 'linkedin' | 'x' | 'website'
}

export const ORB_SIZE = 40
const ORB_GAP = 12
const LTR_STAGGER_S = 0.04
const LTR_BASE_DELAY_S = 0.12
const EDGE_TUCK = 1

const ORB_SHADOW =
  'shadow-[0_1px_2px_rgba(29,29,31,0.06),0_4px_12px_rgba(29,29,31,0.08)]'

function orbBrandClassName(icon: ProjectLink['icon']) {
  const base = cn(
    'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border',
    ORB_SHADOW,
    'transition-[filter,opacity] duration-150',
  )

  switch (icon) {
    case 'arrow':
      return cn(
        base,
        'border-[#EAB308]/40 bg-[#FACC15] text-neutral-900 hover:brightness-[1.04]',
      )
    case 'github':
      return cn(
        base,
        'border-black/20 bg-[#1d1d1f] text-white hover:brightness-110',
      )
    case 'linkedin':
      return cn(
        base,
        'border-[#0A66C2] bg-[#0A66C2] text-white hover:brightness-110',
      )
    case 'x':
      return cn(
        base,
        'border-black/20 bg-black text-white hover:brightness-110',
      )
    case 'website':
      return cn(
        base,
        'border-[#EAB308]/40 bg-[#FACC15] text-neutral-900 hover:brightness-[1.04]',
      )
  }
}

function Icon({ name }: { name: ProjectLink['icon'] }) {
  const common = {
    className: 'h-[18px] w-[18px]',
    'aria-hidden': true,
  } as const

  if (name === 'arrow') {
    return (
      <svg
        {...common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    )
  }

  if (name === 'github') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05A4.17 4.17 0 0 1 17.6 8.7c4 0 4.4 2.5 4.4 5.75V21h-4v-5.6c0-1.33-.02-3.05-1.9-3.05s-2.2 1.45-2.2 2.95V21h-4V9Z" />
      </svg>
    )
  }

  if (name === 'x') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.53 3h3.14l-6.86 7.84L21.9 21h-6.3l-4.94-6.46L4.99 21H1.85l7.34-8.39L2.1 3h6.46l4.47 5.9L17.53 3Zm-1.1 16.13h1.74L7.65 4.78H5.79l10.64 14.35Z" />
      </svg>
    )
  }

  return (
    <svg
      {...common}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  )
}

function OrbLink({
  link,
  index,
  reduceMotion,
  className,
  style,
  stagger = false,
}: {
  link: ProjectLink
  index: number
  reduceMotion: boolean
  className?: string
  style?: CSSProperties
  stagger?: boolean
}) {
  return (
    <motion.a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      title={link.label}
      className={className ?? orbBrandClassName(link.icon)}
      style={style}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.16,
        ease: 'easeOut',
        delay: stagger && !reduceMotion ? LTR_BASE_DELAY_S + index * LTR_STAGGER_S : 0,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <Icon name={link.icon} />
    </motion.a>
  )
}

export function orbitLinkPosition(
  index: number,
  total: number,
  anchor: { x: number; y: number; r: number },
  gap = 52,
) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  const orbit = anchor.r + gap
  return {
    x: anchor.x + Math.cos(angle) * orbit,
    y: anchor.y + Math.sin(angle) * orbit,
    angle,
    orbit,
  }
}

/** Fila centrada bajo la burbuja enfocada, de izquierda a derecha. */
export function focusLinkRowPositions(
  anchor: { x: number; y: number; r: number },
  count: number,
  rowGap: number,
) {
  const rowY = anchor.y + anchor.r + rowGap + ORB_SIZE / 2
  const rowWidth = count * ORB_SIZE + Math.max(count - 1, 0) * ORB_GAP
  const startX = anchor.x - rowWidth / 2 + ORB_SIZE / 2

  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * (ORB_SIZE + ORB_GAP),
    y: rowY,
  }))
}

function edgeFromAnchorToOrb(
  anchor: { x: number; y: number; r: number },
  orb: { x: number; y: number },
) {
  const dx = orb.x - anchor.x
  const dy = orb.y - anchor.y
  const distance = Math.hypot(dx, dy) || 1
  const unitX = dx / distance
  const unitY = dy / distance
  const orbRadius = ORB_SIZE / 2

  return {
    x1: anchor.x + unitX * (anchor.r - EDGE_TUCK),
    y1: anchor.y + unitY * (anchor.r - EDGE_TUCK),
    x2: orb.x - unitX * (orbRadius - EDGE_TUCK),
    y2: orb.y - unitY * (orbRadius - EDGE_TUCK),
  }
}

/**
 * Botones circulares de enlaces. En fila van bajo una tarjeta o bajo la burbuja
 * enfocada; en órbita (legacy) rodean el nodo central.
 */
export function ProjectLinkOrbs({
  links,
  visible,
  layout = 'row',
  anchor,
  rowGap = 14,
  edgeColor = 'rgba(29,29,31,0.22)',
  stageWidth = 0,
  stageHeight = 0,
}: {
  links: readonly ProjectLink[]
  visible: boolean
  layout?: 'row' | 'orbit' | 'below' | 'connected-row'
  anchor?: { x: number; y: number; r: number }
  rowGap?: number
  edgeColor?: string
  stageWidth?: number
  stageHeight?: number
}) {
  const reduceMotion = useReducedMotion()
  const rowPositions = useMemo(
    () =>
      anchor && layout === 'connected-row'
        ? focusLinkRowPositions(anchor, links.length, rowGap)
        : [],
    [anchor, layout, links.length, rowGap],
  )

  return (
    <AnimatePresence>
      {visible && links.length > 0 ? (
        layout === 'connected-row' && anchor ? (
          <>
            <svg
              className="pointer-events-none absolute left-0 top-0 z-[5]"
              width={stageWidth}
              height={stageHeight}
              viewBox={`0 0 ${stageWidth} ${stageHeight}`}
              aria-hidden
            >
              {rowPositions.map((point, index) => {
                const edge = edgeFromAnchorToOrb(anchor, point)
                return (
                  <motion.line
                    key={`edge-${links[index]!.id}`}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={edgeColor}
                    strokeLinecap="round"
                    strokeWidth={1.25}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.18,
                      ease: 'easeOut',
                      delay: reduceMotion ? 0 : LTR_BASE_DELAY_S + index * 0.03,
                    }}
                  />
                )
              })}
            </svg>
            {rowPositions.map((point, index) => (
              <OrbLink
                key={links[index]!.id}
                link={links[index]!}
                index={index}
                stagger
                reduceMotion={Boolean(reduceMotion)}
                className={cn(
                  orbBrandClassName(links[index]!.icon),
                  'absolute z-[6] pointer-events-auto',
                )}
                style={{
                  left: point.x - ORB_SIZE / 2,
                  top: point.y - ORB_SIZE / 2,
                  width: ORB_SIZE,
                  height: ORB_SIZE,
                }}
              />
            ))}
          </>
        ) : layout === 'below' && anchor ? (
          <div
            className="pointer-events-auto absolute z-[6] flex -translate-x-1/2 items-center justify-center gap-2"
            style={{
              left: anchor.x,
              top: anchor.y + anchor.r + rowGap,
            }}
          >
            {links.map((link, index) => (
              <OrbLink
                key={link.id}
                link={link}
                index={index}
                stagger
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </div>
        ) : layout === 'orbit' && anchor ? (
          <>
            {links.map((link, index) => {
              const point = orbitLinkPosition(index, links.length, anchor)
              return (
                <OrbLink
                  key={link.id}
                  link={link}
                  index={index}
                  reduceMotion={Boolean(reduceMotion)}
                  className={cn(orbBrandClassName(link.icon), 'absolute z-[6]')}
                  style={{
                    left: point.x - ORB_SIZE / 2,
                    top: point.y - ORB_SIZE / 2,
                    width: ORB_SIZE,
                    height: ORB_SIZE,
                  }}
                />
              )
            })}
          </>
        ) : (
          <div className="pointer-events-auto mt-2.5 flex items-center justify-center gap-2">
            {links.map((link, index) => (
              <OrbLink
                key={link.id}
                link={link}
                index={index}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </div>
        )
      ) : null}
    </AnimatePresence>
  )
}
