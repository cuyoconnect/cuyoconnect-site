import { LogoCloud, type LogoCloudLogo } from '@/components/ui/logo-cloud-3'
import {
  COMMUNITY_STRIP_PARTNERS,
  type CommunityStripPartner,
} from '@/data/community-strip'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

function partnerToLogo(p: CommunityStripPartner): LogoCloudLogo {
  const fillCell = Boolean(p.logoCellBgClass)
  return {
    src: p.logoSrc,
    alt: p.logoAlt,
    href: p.href,
    width: 120,
    height: 40,
    linkAriaLabel: `${p.name} — sitio oficial (se abre en una pestaña nueva)`,
    imgClassName: cn(
      'grayscale',
      fillCell
        ? 'max-h-5 opacity-95 sm:max-h-6'
        : p.logoInvert
          ? 'max-h-7 invert brightness-100 sm:max-h-8'
          : p.logoColorLarge
            ? 'max-h-9 opacity-[0.98] sm:max-h-10 lg:max-h-12 xl:max-h-9'
            : 'max-h-7 brightness-90 sm:max-h-8',
      p.logoForLightBg && 'brightness-0 contrast-[0.95]',
    ),
  }
}

const HERO_PARTNER_LOGOS = COMMUNITY_STRIP_PARTNERS.map(partnerToLogo)

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
        <div className="flex items-stretch justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-2">
            <p
              id="community-strip-heading"
              className="text-center font-mono text-[11px] font-medium uppercase leading-snug tracking-wide text-neutral-600"
            >
              Algunas organizaciones que confían en nosotros.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden sm:mt-5">
          <LogoCloud
            logos={HERO_PARTNER_LOGOS}
            gap={42}
            reverse
            duration={80}
            durationOnHover={25}
          />
        </div>
      </div>
    </div>
  )
}
