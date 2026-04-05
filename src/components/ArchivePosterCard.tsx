import { useState } from 'react'

import { cn } from '@/lib/utils'

/** Marco SVG (esquina redondeada) que “dibujado” al hover; solo `variant="grid"`. */
function PosterGridFrame({
  active,
  reduceMotion,
}: {
  active: boolean
  reduceMotion: boolean | null
}) {
  const stroke = 'rgba(253, 224, 71, 0.92)' // yellow-300
  const inactiveDash = reduceMotion === true ? 0 : 100

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[5] size-full rounded-2xl"
      viewBox="0 0 100 125"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect
        x="1.25"
        y="1.25"
        width="97.5"
        height="122.5"
        rx="3.35"
        ry="3.35"
        fill="none"
        stroke={stroke}
        strokeWidth={0.85}
        vectorEffect="nonScalingStroke"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={active ? 0 : inactiveDash}
        strokeLinecap="round"
        className={
          reduceMotion === true
            ? 'transition-opacity duration-300 ease-out'
            : 'transition-[stroke-dashoffset] duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)]'
        }
        style={
          reduceMotion === true ? { opacity: active ? 0.45 : 0 } : undefined
        }
      />
    </svg>
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

function CalendarIcon({ className }: { className?: string }) {
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
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

export type ArchivePosterVariant = 'slider' | 'grid'

export type ArchivePosterCardProps = {
  variant: ArchivePosterVariant
  imageSrc: string
  title: string
  dateLabel: string
  /** Si está definido, la fecha se renderiza como `<time dateTime={…}>`. */
  dateTime?: string
  href: string
  ariaLabel: string
  external?: boolean
  cardIndex: number
  hoveredIndex: number | null
  /** En el slider, anula el hover mientras se arrastra. */
  isDragging?: boolean
  reduceMotion: boolean | null
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/** Tarjeta tipo póster (imagen 4/5, título y fecha sobre degradado): usada en el slider de eventos pasados y en `/recursos`. */
export function ArchivePosterCard({
  variant,
  imageSrc,
  title,
  dateLabel,
  dateTime,
  href,
  ariaLabel,
  external = false,
  cardIndex,
  hoveredIndex,
  isDragging = false,
  reduceMotion,
  onMouseEnter,
  onMouseLeave,
}: ArchivePosterCardProps) {
  const [linkFocused, setLinkFocused] = useState(false)
  const effectiveHovered = isDragging ? null : hoveredIndex
  const isHoveredCard = effectiveHovered === cardIndex
  const isPeerDimmed =
    effectiveHovered !== null && effectiveHovered !== cardIndex

  const sat =
    effectiveHovered === null
      ? linkFocused && variant === 'grid'
        ? 1
        : 0.85
      : isHoveredCard
        ? 1
        : 0.48
  const gray = isPeerDimmed ? 0.42 : 0
  const filterValue = `saturate(${sat}) grayscale(${gray})`

  const isActiveCard = isHoveredCard || linkFocused

  const articleStyle =
    reduceMotion === true
      ? {
          filter: filterValue,
          WebkitFilter: filterValue,
          boxShadow: isActiveCard
            ? '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06)',
        }
      : {
          filter: filterValue,
          WebkitFilter: filterValue,
          boxShadow: isActiveCard
            ? '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          transitionProperty: 'filter, box-shadow, transform',
          transitionDuration: effectiveHovered === null ? '420ms' : '280ms',
          transitionDelay: effectiveHovered === null ? '90ms' : '0ms',
          transitionTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
        }

  const articleLift =
    reduceMotion !== true && variant === 'grid' && isActiveCard
      ? { transform: 'translateY(-4px)' as const }
      : undefined

  return (
    <article
      className={cn(
        'relative rounded-2xl border border-neutral-200 bg-white select-none',
        variant === 'grid' && 'group/poster',
        variant === 'slider' && 'shrink-0 w-52 sm:w-60 md:w-68',
        variant === 'grid' && 'h-full min-h-0 w-full min-w-0',
      )}
      style={{ ...articleStyle, ...articleLift }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          'pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4',
          'flex size-8 items-center justify-center rounded-full bg-yellow-300 text-neutral-950',
          'ring-1 ring-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]',
          'sm:size-9',
        )}
        style={{
          opacity: isActiveCard ? 1 : 0,
          transform:
            reduceMotion === true
              ? undefined
              : isActiveCard
                ? 'scale(1.06) rotate(-6deg)'
                : 'scale(0.92) rotate(0deg)',
          transition:
            'opacity 320ms cubic-bezier(0.33, 1, 0.68, 1), transform 420ms cubic-bezier(0.33, 1, 0.68, 1)',
        }}
        aria-hidden
      >
        <ArrowUpRightIcon className="size-3.5 shrink-0 sm:size-4" />
      </div>

      <a
        href={href}
        className={cn(
          'absolute inset-0 z-30 rounded-2xl',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
        )}
        aria-label={ariaLabel}
        draggable={false}
        onFocus={() => setLinkFocused(true)}
        onBlur={() => setLinkFocused(false)}
        {...(external
          ? {
              target: '_blank',
              rel: 'noopener noreferrer',
            }
          : {})}
      />

      <div className="relative z-0 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-200">
        {variant === 'grid' ? (
          <PosterGridFrame active={isActiveCard} reduceMotion={reduceMotion} />
        ) : null}
        <img
          src={imageSrc}
          alt={title}
          className={cn(
            'relative z-0 size-full object-cover object-center will-change-transform',
            variant === 'grid' &&
              reduceMotion !== true &&
              'transition-transform duration-[750ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/poster:scale-[1.07] group-focus-within/poster:scale-[1.07]',
            variant === 'grid' &&
              reduceMotion === true &&
              isActiveCard &&
              'scale-[1.03]',
          )}
          style={
            variant === 'grid' && reduceMotion === true
              ? {
                  transition: 'transform 400ms cubic-bezier(0.33, 1, 0.68, 1)',
                }
              : undefined
          }
          width={400}
          height={500}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div
            className={cn(
              'absolute inset-0 -top-16 bg-neutral-950/40 backdrop-blur-md backdrop-saturate-125 sm:-top-22',
              '[mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
              '[-webkit-mask-image:linear-gradient(to_top,rgb(0_0_0)_0%,rgb(0_0_0)_45%,rgba(0,0,0,0.3)_75%,transparent_100%)]',
            )}
            aria-hidden
          />
          <div className="relative z-10 px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
            <h3 className="text-balance text-sm font-semibold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:text-base">
              {title}
            </h3>
            <p
              className={cn(
                'mt-0.5 flex items-center gap-1 text-[11px] font-normal leading-relaxed text-white/90',
                'sm:mt-1 sm:gap-1.5 sm:text-xs',
                '[text-shadow:0_1px_2px_rgba(0,0,0,0.45)]',
              )}
            >
              <CalendarIcon className="block size-2.5 shrink-0 text-current opacity-90 sm:size-3" />
              {dateTime ? (
                <time dateTime={dateTime} className="leading-none">
                  {dateLabel}
                </time>
              ) : (
                <span className="leading-none">{dateLabel}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
