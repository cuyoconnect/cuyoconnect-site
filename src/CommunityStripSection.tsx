import { COMMUNITY_STRIP_PARTNERS } from '@/data/community-strip'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

const PARTNER_CELL_MIN_H = 'min-h-[3.25rem] sm:min-h-14' as const
const PARTNER_CELL_MIN_H_LARGE = 'min-h-[4.25rem] sm:min-h-[4.75rem]' as const

function PartnerCell({
  name,
  logoSrc,
  logoAlt,
  href,
  logoForLightBg,
  logoInvert,
  logoCellBgClass,
  logoColorLarge,
  hideOnMobile,
}: {
  name: string
  logoSrc: string
  logoAlt: string
  href: string
  logoForLightBg?: boolean
  logoInvert?: boolean
  logoCellBgClass?: string
  logoColorLarge?: boolean
  hideOnMobile?: boolean
}) {
  const fillCell = Boolean(logoCellBgClass)
  const cellMin = logoColorLarge ? PARTNER_CELL_MIN_H_LARGE : PARTNER_CELL_MIN_H

  const inner = (
    <img
      src={logoSrc}
      alt={logoAlt}
      width={120}
      height={40}
      loading="lazy"
      decoding="async"
      className={cn(
        'w-auto object-contain grayscale',
        fillCell
          ? 'max-h-5 max-w-[6.75rem] opacity-95 sm:max-h-6 sm:max-w-[7.5rem]'
          : logoInvert
            ? 'max-h-7 max-w-[7.5rem] invert brightness-100 sm:max-h-8 sm:max-w-[8.5rem]'
            : logoColorLarge
              ? 'max-h-12 max-w-[11rem] opacity-[0.98] sm:max-h-14 sm:max-w-[12.5rem]'
              : 'max-h-7 max-w-[7.5rem] brightness-90 sm:max-h-8 sm:max-w-[8.5rem]',
        logoForLightBg && 'brightness-0 contrast-[0.95]',
      )}
    />
  )

  return (
    <div
      className={cn(
        'flex min-w-0 items-stretch',
        cellMin,
        hideOnMobile && 'max-sm:hidden',
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex w-full flex-1 items-center justify-center px-1.5 py-2 no-underline',
          cellMin,
          logoColorLarge && 'px-1 sm:px-2',
          logoCellBgClass,
          !fillCell && 'bg-white',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
          fillCell
            ? 'focus-visible:outline-white/80'
            : 'focus-visible:outline-neutral-400',
        )}
        aria-label={`${name} — sitio oficial (se abre en una pestaña nueva)`}
      >
        {inner}
      </a>
    </div>
  )
}

type CommunityStripSectionProps = {
  className?: string
}

export function CommunityStripSection({ className }: CommunityStripSectionProps) {
  return (
    <div
      role="region"
      aria-labelledby="community-strip-heading"
      className={cn(
        'w-full shrink-0 bg-white py-10 text-neutral-950 sm:py-12',
        '[color-scheme:light]',
        className,
      )}
    >
      <div className={cn(HERO_CONTENT_WIDTH_CLASS)}>
        <div className="overflow-hidden rounded-lg border border-neutral-200/90">
          <div className="flex items-stretch justify-between border-b border-neutral-200/90">
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-2">
              <p
                id="community-strip-heading"
                className="text-center font-mono text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-600"
              >
                Algunas organizaciones que confían en nosotros.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-neutral-200/90 sm:grid-cols-3 lg:grid-cols-5">
            {COMMUNITY_STRIP_PARTNERS.map((p) => (
              <PartnerCell
                key={p.name}
                name={p.name}
                logoSrc={p.logoSrc}
                logoAlt={p.logoAlt}
                href={p.href}
                logoForLightBg={p.logoForLightBg}
                logoInvert={p.logoInvert}
                logoCellBgClass={p.logoCellBgClass}
                logoColorLarge={p.logoColorLarge}
                hideOnMobile={p.hideOnMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
