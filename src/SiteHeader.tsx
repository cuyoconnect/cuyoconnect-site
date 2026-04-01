import { useEffect, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'

import { JoinCommunityModal } from '@/JoinCommunityModal'
import { cn } from '@/lib/utils'

const SCROLL_PILL_THRESHOLD = 100

/** Dimensiones reales de public/logo.png (recorte + resize) */
const NAV_LOGO = { w: 59, h: 80 } as const

const navShellEase = 'cubic-bezier(0.22, 1, 0.36, 1)'
const navTransitionDuration = '0.56s'

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

export function SiteHeader() {
  const [joinOpen, setJoinOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()
  const navTransitionTiming = `${navTransitionDuration} ${navShellEase}`

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY >= SCROLL_PILL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /** Barra ancha al inicio; al hacer scroll, ancho al contenido (`max-content`), no un % del viewport. */
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

  const navSpacerStyle: CSSProperties = {
    flexGrow: scrolled ? 0 : 1,
    transition: reduceMotion
      ? 'none'
      : [
          `flex-grow ${navTransitionTiming}`,
          `min-width ${navTransitionTiming}`,
          `opacity 0.28s linear`,
        ].join(', '),
  }

  const shellStyle: CSSProperties = {
    width: scrolled ? 'max-content' : '100%',
    maxWidth: scrolled
      ? 'min(calc(100vw - 1.5rem), 52rem)'
      : 'min(calc(100vw - 2rem), 52rem)',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: scrolled
      ? 'calc(1.5rem + env(safe-area-inset-top, 0px))'
      : 0,
    borderRadius: scrolled ? 9999 : 18,
    backgroundColor: scrolled
      ? 'rgba(255, 255, 255, 0.44)'
      : 'rgba(255, 255, 255, 0.58)',
    backdropFilter: scrolled ? 'blur(14px) saturate(1.08)' : 'blur(22px) saturate(1.2)',
    WebkitBackdropFilter: scrolled
      ? 'blur(14px) saturate(1.08)'
      : 'blur(22px) saturate(1.2)',
    boxShadow: 'none' as const,
    /* No animar width/max-width: 100% ↔ max-content interpola mal en varios engines. */
    transition: reduceMotion
      ? 'none'
      : [
          `margin-top ${navTransitionTiming}`,
          `border-radius ${navTransitionTiming}`,
          `background-color ${navTransitionTiming}`,
          `backdrop-filter ${navTransitionTiming}`,
          `-webkit-backdrop-filter ${navTransitionTiming}`,
        ].join(', '),
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50" aria-label="Principal">
        <div
          className={cn(
            'pointer-events-auto isolate overflow-hidden',
            !reduceMotion && 'motion-safe:will-change-[margin-top]',
          )}
          style={shellStyle}
        >
        {/* Tinte suave: no tapar el vidrio */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10',
            scrolled
              ? 'bg-[linear-gradient(180deg,rgb(255_255_255_/_.22)_0%,rgb(255_255_255_/_.08)_45%,transparent_100%)]'
              : 'bg-[linear-gradient(180deg,rgb(255_255_255_/_.35)_0%,rgb(255_255_255_/_.18)_45%,transparent_100%)]',
          )}
          aria-hidden
        />

        <div
          className={cn(
            'relative z-10 flex min-h-14 min-w-0 items-center sm:min-h-16',
            scrolled
              ? 'w-max max-w-full justify-start gap-3 px-2 py-2 sm:gap-4 sm:px-3'
              : 'w-full min-w-0 justify-between gap-2 px-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:gap-5 sm:px-6',
          )}
          style={navLayoutStyle}
        >
          <a
            href="#inicio"
            className={cn(
              'flex min-w-0 shrink items-center gap-1.5 rounded-[10px] font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 sm:shrink-0 sm:gap-2 sm:whitespace-nowrap',
              scrolled
                ? 'px-2 py-1.5 text-sm text-[#1d1d1f] sm:gap-2 sm:px-3 sm:text-base'
                : 'px-1 py-1 text-sm text-neutral-950 sm:gap-2.5 sm:px-0 sm:py-0 sm:text-base md:text-lg',
            )}
            aria-label="CuyoConnect — inicio"
            style={navItemStyle}
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
            aria-hidden
            className={cn(
              'basis-0 shrink',
              scrolled ? 'min-w-0 opacity-0' : 'min-w-1 opacity-100 sm:min-w-2',
            )}
            style={navSpacerStyle}
          />

          <a
            href="#nuestros-eventos"
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full font-medium transition hover:bg-black/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
              scrolled
                ? 'inline-flex px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#1d1d1f] sm:px-4 sm:text-sm'
                : 'inline-flex px-2 py-2 text-xs text-neutral-800 hover:text-neutral-950 sm:px-3 sm:text-sm',
            )}
            style={navItemStyle}
          >
            Eventos
          </a>

          <button
            type="button"
            className={cn(
              'cursor-pointer shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] font-medium text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
              scrolled
                ? 'inline-flex gap-1 px-3 py-2 text-xs shadow-sm sm:gap-1.5 sm:px-5 sm:text-sm'
                : 'ml-2 inline-flex h-9 gap-1 px-3 text-xs sm:ml-3 sm:gap-1.5 sm:px-4 sm:text-sm',
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
      </header>

      <JoinCommunityModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}
