'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import React from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from 'motion/react'
import { ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'

type LinkPreviewProps = {
  children: React.ReactNode
  url: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
  imageUrl?: string | null
  faviconUrl?: string | null
}

/**
 * Cola de precarga con concurrencia limitada: las imágenes sociales son
 * livianas, pero pedir treinta a la vez igual pelea por ancho de banda.
 */
const PREFETCH_CONCURRENCY = 4
const prefetchQueue: string[] = []
const requestedSrc = new Set<string>()
let prefetchActive = 0

function pumpPrefetchQueue() {
  while (prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue.length > 0) {
    const src = prefetchQueue.shift()!
    prefetchActive += 1
    const img = new Image()
    img.decoding = 'async'
    const release = () => {
      prefetchActive -= 1
      pumpPrefetchQueue()
    }
    img.onload = release
    img.onerror = release
    img.src = src
  }
}

/** Precarga las imágenes sociales ya resueltas en el payload. */
export function prefetchLinkPreviews(
  srcs: ReadonlyArray<string | null | undefined>,
) {
  if (typeof window === 'undefined') return
  for (const value of srcs) {
    const src = value?.trim()
    if (!src || requestedSrc.has(src)) continue
    requestedSrc.add(src)
    prefetchQueue.push(src)
  }
  pumpPrefetchQueue()
}

/** El hover no espera la cola: su imagen pasa al frente. */
export function prioritizeLinkPreview(src: string | null | undefined) {
  if (typeof window === 'undefined') return
  const value = src?.trim()
  if (!value) return
  const queued = prefetchQueue.indexOf(value)
  if (queued > 0) {
    prefetchQueue.splice(queued, 1)
    prefetchQueue.unshift(value)
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Sin favicon en el payload queda el de raíz, que casi siempre existe. */
function rootFavicon(url: string) {
  try {
    return `${new URL(url).origin}/favicon.ico`
  } catch {
    return null
  }
}

/** Card flotante para mapas: retrato de quien lo hizo, con el sitio como sello. */
export function LinkPreviewCard({
  url,
  className,
  title,
  meta,
  imageUrl,
  faviconUrl,
  avatarUrl,
  avatarLabel,
  interactive = false,
}: {
  url: string
  className?: string
  title?: string
  /** Subtítulo bajo el nombre, p. ej. "125 commits". */
  meta?: React.ReactNode
  /** og:image / twitter:image del sitio: respaldo del favicon en el sello. */
  imageUrl?: string | null
  faviconUrl?: string | null
  avatarUrl?: string | null
  avatarLabel?: string
  /** Fijada: deja pasar el puntero para poder clickear el enlace. */
  interactive?: boolean
}) {
  const [loaded, setLoaded] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  const [iconFailed, setIconFailed] = React.useState(false)

  const icon = faviconUrl?.trim() || rootFavicon(url) || null
  const showIcon = Boolean(icon) && !iconFailed

  // Sin foto de perfil (o si falla) el cuadro lo ocupa la imagen social del
  // sitio, y recién después el favicon: nunca queda un recuadro vacío.
  const portraits = React.useMemo(() => {
    const candidates = [
      { src: avatarUrl?.trim(), fit: 'cover' as const },
      { src: imageUrl?.trim(), fit: 'cover' as const },
      { src: icon ?? undefined, fit: 'contain' as const },
    ]
    return candidates.filter(
      (candidate): candidate is { src: string; fit: 'cover' | 'contain' } =>
        Boolean(candidate.src),
    )
  }, [avatarUrl, icon, imageUrl])

  const portrait = portraits[attempt] ?? null

  React.useEffect(() => {
    setLoaded(false)
    setAttempt(0)
  }, [portraits])

  React.useEffect(() => {
    setIconFailed(false)
  }, [icon])

  return (
    <div
      className={cn(
        'w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl',
        interactive ? 'pointer-events-auto' : 'pointer-events-none',
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-neutral-100 via-[#f6f2e6] to-neutral-200">
        {portrait ? (
          <img
            key={portrait.src}
            src={portrait.src}
            alt={attempt === 0 && avatarLabel ? `Avatar de ${avatarLabel}` : ''}
            className={cn(
              'h-full w-full transition-opacity duration-300',
              portrait.fit === 'cover'
                ? 'object-cover object-center'
                : 'object-contain p-10',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
            draggable={false}
            fetchPriority="high"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setAttempt((current) => current + 1)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-500">
            {(avatarLabel || hostOf(url)).charAt(0).toUpperCase()}
          </div>
        )}

        {/* El sitio pasa a sello, salvo cuando ya es lo que llena el cuadro. */}
        {showIcon && portrait?.src !== icon ? (
          <img
            src={icon!}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute left-2 top-2 z-20 h-9 w-9 rounded-xl border-2 border-white bg-white object-contain p-1 shadow-md"
            onError={() => setIconFailed(true)}
          />
        ) : null}

        {/* Mismo tratamiento que las tarjetas de equipo: vidrio esmerilado que
            se disuelve hacia arriba y deja el texto legible sobre la foto. */}
        {title || meta ? (
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div
              aria-hidden
              className={cn(
                'absolute inset-0 -top-16',
                'bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125',
                '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
                '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
              )}
            />
            <div className="relative z-10 px-4 pb-4 pt-5 text-left">
              {title ? (
                <h3 className="truncate text-base font-semibold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
                  {title}
                </h3>
              ) : null}
              {meta ? (
                <div className="mt-0.5 flex items-center gap-1.5 text-sm leading-relaxed text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                  {meta}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Fijada, la foto entera es el enlace al sitio publicado; el sello lo anuncia. */}
        {interactive ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={title ? `Abrir ${title}` : 'Abrir el sitio del proyecto'}
            className="group absolute inset-0 z-30 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            <span className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-neutral-900 shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <ExternalLink className="h-4 w-4" aria-hidden />
            </span>
          </a>
        ) : null}
      </div>
    </div>
  )
}

export function LinkPreview({
  children,
  url,
  className,
  imageUrl,
  faviconUrl,
  open,
  onOpenChange,
  openDelay = 50,
  closeDelay = 100,
}: LinkPreviewProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen

  const springConfig = { stiffness: 100, damping: 15 }
  const x = useMotionValue(0)
  const translateX = useSpring(x, springConfig)

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect()
    const eventOffsetX = event.clientX - targetRect.left
    const offsetFromCenter = (eventOffsetX - targetRect.width / 2) / 2
    x.set(offsetFromCenter)
  }

  return (
    <HoverCardPrimitive.Root
      open={isOpen}
      openDelay={openDelay}
      closeDelay={closeDelay}
      onOpenChange={(next) => {
        if (!isControlled) setUncontrolledOpen(next)
        onOpenChange?.(next)
      }}
    >
      <HoverCardPrimitive.Trigger asChild>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onMouseMove={handleMouseMove}
          className={cn('text-black dark:text-white', className)}
        >
          {children}
        </a>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-[80] [transform-origin:var(--radix-hover-card-content-transform-origin)]"
          side="top"
          align="center"
          sideOffset={10}
        >
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                className="rounded-xl shadow-xl"
                style={{ x: translateX }}
              >
                <LinkPreviewCard
                  url={url}
                  imageUrl={imageUrl}
                  faviconUrl={faviconUrl}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  )
}
