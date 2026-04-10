import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { useReducedMotion } from 'framer-motion'

import { JoinCommunityModal } from '@/JoinCommunityModal'
import { OPEN_JOIN_COMMUNITY_MODAL_EVENT } from '@/lib/join-community-modal-request'
import { scrollToSectionElement } from '@/lib/section-scroll'
import { cn } from '@/lib/utils'

const SCROLL_PILL_THRESHOLD = 160

/** Dimensiones intrínsecas de public/logo.png */
const NAV_LOGO = { w: 882, h: 882 } as const

const navShellEase = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
/** Misma duración y curva en ambos sentidos (~12% más rápida que 0.68s). */
const navShellTransitionDuration = '0.6s'

function NavLogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={NAV_LOGO.w}
      height={NAV_LOGO.h}
      decoding="async"
      className={cn('w-auto shrink-0 object-contain', className)}
    />
  )
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}

const navTextLinkClass = cn(
  'shrink-0 whitespace-nowrap rounded-full font-medium transition-colors duration-[600ms] delay-0 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:duration-[240ms] hover:delay-0',
  'hover:bg-black/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
)

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
}

function tryScrollLandingSection(
  event: MouseEvent<HTMLAnchorElement>,
  _pathname: string,
  id: string,
  hash: string,
) {
  if (!isPlainLeftClick(event)) return

  const didScroll = scrollToSectionElement(id)
  if (!didScroll) return

  event.preventDefault()
  window.history.replaceState(null, '', hash)
}

export function SiteHeader({ pathname }: { pathname: string }) {
  const [joinOpen, setJoinOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrolledShellWidth, setScrolledShellWidth] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()
  const scrolledMeasureRef = useRef<HTMLDivElement>(null)
  const navTransitionTiming = `${navShellTransitionDuration} ${navShellEase}`
  const isHome = pathname === '/'
  const logoHref = isHome ? '#inicio' : '/'
  const eventsHref = isHome ? '#eventos' : '/eventos'

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY >= SCROLL_PILL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onOpenJoin = () => setJoinOpen(true)
    window.addEventListener(OPEN_JOIN_COMMUNITY_MODAL_EVENT, onOpenJoin)
    return () =>
      window.removeEventListener(OPEN_JOIN_COMMUNITY_MODAL_EVENT, onOpenJoin)
  }, [])

  useLayoutEffect(() => {
    const measureElement = scrolledMeasureRef.current
    if (!measureElement) return undefined

    const syncScrolledShellWidth = () => {
      const nextWidth = Math.ceil(measureElement.getBoundingClientRect().width)
      setScrolledShellWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      )
    }

    syncScrolledShellWidth()

    const resizeObserver = new ResizeObserver(() => {
      syncScrolledShellWidth()
    })

    resizeObserver.observe(measureElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  /** Barra ancha al inicio; al hacer scroll, anima hacia un ancho medido en px para evitar saltos de layout intrínseco. */
  const navLayoutStyle: CSSProperties = {
    transition: reduceMotion
      ? 'none'
      : [
          `gap ${navTransitionTiming}`,
          `padding ${navTransitionTiming}`,
          `min-height ${navTransitionTiming}`,
        ].join(', '),
  }

  const navItemStyle: CSSProperties = {
    transition: reduceMotion
      ? 'none'
      : [
          `gap ${navTransitionTiming}`,
          `padding ${navTransitionTiming}`,
          `margin ${navTransitionTiming}`,
          `font-size ${navTransitionTiming}`,
          `color ${navTransitionTiming}`,
          `background-color ${navTransitionTiming}`,
          `box-shadow ${navTransitionTiming}`,
        ].join(', '),
  }

  const navActionsStyle: CSSProperties = {
    transition: reduceMotion ? 'none' : `gap ${navTransitionTiming}`,
  }

  const shellStyle: CSSProperties = {
    width: scrolled && scrolledShellWidth ? `${scrolledShellWidth}px` : '100%',
    maxWidth: scrolled
      ? 'min(calc(100dvw - 1.5rem), 52rem)'
      : 'min(calc(100dvw - 2rem), 52rem)',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: scrolled
      ? 'calc(1.5rem + env(safe-area-inset-top, 0px))'
      : 0,
    borderRadius: scrolled ? 9999 : 18,
    backgroundColor: scrolled
      ? 'rgba(255, 255, 255, 0.44)'
      : 'rgba(255, 255, 255, 0)',
    backdropFilter: scrolled
      ? 'blur(14px) saturate(1.08)'
      : 'blur(0px) saturate(1)',
    WebkitBackdropFilter: scrolled
      ? 'blur(14px) saturate(1.08)'
      : 'blur(0px) saturate(1)',
    boxShadow: 'none' as const,
    transition: reduceMotion
      ? 'none'
      : [
          `width ${navTransitionTiming}`,
          `max-width ${navTransitionTiming}`,
          `margin-top ${navTransitionTiming}`,
          `border-radius ${navTransitionTiming}`,
          `background-color ${navTransitionTiming}`,
          `backdrop-filter ${navTransitionTiming}`,
          `-webkit-backdrop-filter ${navTransitionTiming}`,
        ].join(', '),
  }

  return (
    <>
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
        aria-label="Principal"
      >
        <div
          className={cn(
            'pointer-events-auto isolate overflow-hidden',
            !reduceMotion && 'motion-safe:will-change-[margin-top,width]',
          )}
          style={shellStyle}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-[linear-gradient(180deg,rgb(255_255_255_/_.22)_0%,rgb(255_255_255_/_.08)_45%,transparent_100%)]"
            style={{
              opacity: scrolled ? 1 : 0,
              transition: reduceMotion
                ? 'none'
                : `opacity ${navTransitionTiming}`,
            }}
            aria-hidden
          />

          <div
            className={cn(
              'relative z-10 flex min-h-14 min-w-0 w-full items-center justify-between sm:min-h-16',
              scrolled
                ? 'gap-3 px-2 py-2 sm:gap-4 sm:px-3'
                : 'gap-2 px-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:gap-5 sm:px-6',
            )}
            style={navLayoutStyle}
          >
            <a
              href={logoHref}
              className={cn(
                'flex min-w-0 shrink items-center gap-1.5 rounded-[10px] font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 sm:shrink-0 sm:gap-2 sm:whitespace-nowrap',
                scrolled
                  ? 'px-2 py-1.5 text-sm text-[#1d1d1f] sm:gap-2 sm:px-3 sm:text-base'
                  : 'px-1 py-1 text-sm text-neutral-950 sm:gap-2.5 sm:px-0 sm:py-0 sm:text-base md:text-lg',
              )}
              aria-label="CuyoConnect — inicio"
              style={navItemStyle}
              onClick={(event) => {
                if (event.defaultPrevented) return
                tryScrollLandingSection(event, pathname, 'inicio', '#inicio')
              }}
            >
              <NavLogoMark className="h-7 shrink-0 sm:h-9" />
              {!scrolled ? (
                <span className="min-w-0 truncate sm:overflow-visible">
                  CuyoConnect
                </span>
              ) : (
                <>
                  <span className="hidden min-[380px]:inline">CuyoConnect</span>
                  <span className="min-[380px]:hidden">Cuyo</span>
                </>
              )}
            </a>

            <div
              className={cn(
                'flex shrink-0 items-center',
                scrolled ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3',
              )}
              style={navActionsStyle}
            >
              <a
                href={eventsHref}
                aria-current={pathname === '/eventos' ? 'page' : undefined}
                className={cn(
                  navTextLinkClass,
                  scrolled
                    ? 'inline-flex px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#1d1d1f] sm:px-4 sm:text-sm'
                    : 'inline-flex px-2 py-2 text-xs text-neutral-800 hover:text-neutral-950 sm:px-3 sm:text-sm',
                )}
                style={navItemStyle}
                onClick={(event) => {
                  if (event.defaultPrevented) return
                  tryScrollLandingSection(event, pathname, 'eventos', '#eventos')
                }}
              >
                Eventos
              </a>

              <button
                type="button"
                className={cn(
                  'cursor-pointer shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] font-medium text-white transition-colors duration-[600ms] delay-0 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:duration-[240ms] hover:delay-0',
                  'hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
                  scrolled
                    ? 'inline-flex h-9 gap-1 px-3 text-xs shadow-sm sm:gap-1.5 sm:h-10 sm:px-5 sm:text-sm'
                    : 'inline-flex h-9 gap-1 px-3 text-xs sm:gap-1.5 sm:h-10 sm:px-4 sm:text-sm',
                )}
                onClick={() => setJoinOpen(true)}
                style={navItemStyle}
              >
                Unite
                <ArrowUpRightIcon
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3"
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute left-0 top-0 -z-20 opacity-0"
          aria-hidden
        >
          <div
            ref={scrolledMeasureRef}
            className="relative z-10 flex min-h-14 w-max min-w-0 items-center justify-between gap-3 px-2 py-2 sm:min-h-16 sm:gap-4 sm:px-3"
          >
            <span className="flex min-w-0 shrink items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-sm font-semibold tracking-tight text-[#1d1d1f] sm:shrink-0 sm:gap-2 sm:whitespace-nowrap sm:px-3 sm:text-base">
              <NavLogoMark className="h-7 shrink-0 sm:h-9" />
              <span className="hidden min-[380px]:inline">CuyoConnect</span>
              <span className="min-[380px]:hidden">Cuyo</span>
            </span>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-[#6b6b6b] sm:px-4 sm:text-sm">
                Eventos
              </span>

              <span className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#1d1d1f] px-3 text-xs font-medium text-white shadow-sm sm:gap-1.5 sm:h-10 sm:px-5 sm:text-sm">
                Unite
                <ArrowUpRightIcon
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3"
                />
              </span>
            </div>
          </div>
        </div>
      </header>

      <JoinCommunityModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}
