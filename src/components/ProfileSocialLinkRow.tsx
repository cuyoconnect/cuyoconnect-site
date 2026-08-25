import { ArrowUpRight } from 'lucide-react'

import { MemberProfileSocialIcon } from '@/components/MemberProfileSocialIcon'
import type { MemberProfileSocialLinkId } from '@/lib/member-profiles'
import { cn } from '@/lib/utils'

export type ProfileStyleSocialLink = {
  id: string
  /** Accesibilidad y tooltip */
  label: string
  /** Texto visible bajo el ícono */
  displayLabel: string
  href: string
  icon: MemberProfileSocialLinkId
}

function ProfileSocialMarkerTextureDefs() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden focusable="false">
      <defs>
        <filter id="profile-social-marker-roughen" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08 0.18" numOctaves="4" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="3.4" />
        </filter>
        <filter id="profile-social-ink-roughen" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="0.75" />
        </filter>
        <mask id="profile-social-marker-wear" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="64">
          <rect width="80" height="64" fill="white" />
          <path d="M9 18c13-5 33-7 58-3" stroke="black" strokeWidth="2.6" strokeLinecap="round" opacity="0.38" />
          <path d="M14 42c16 4 30 4 52-2" stroke="black" strokeWidth="2.2" strokeLinecap="round" opacity="0.28" />
          <path d="M20 28h9M43 22h7M51 36h12M28 47h7" stroke="black" strokeWidth="2.8" strokeLinecap="round" opacity="0.34" />
          <circle cx="17" cy="34" r="2.4" fill="black" opacity="0.32" />
          <circle cx="61" cy="25" r="1.9" fill="black" opacity="0.3" />
          <circle cx="39" cy="45" r="1.4" fill="black" opacity="0.24" />
        </mask>
      </defs>
    </svg>
  )
}

function ProfileSocialMarkerSpot({ className }: { className?: string }) {
  return (
    <svg
      className={cn('absolute inset-0 overflow-visible', className)}
      viewBox="0 0 80 64"
      fill="none"
      aria-hidden
    >
      <g filter="url(#profile-social-marker-roughen)" mask="url(#profile-social-marker-wear)">
        <path
          d="M12.5 14.5C23 7.8 44.7 6.1 63.5 11.9C73.8 15.1 74 27.5 66.8 37.1C58.5 48.1 38.9 54.5 22.8 50.4C9.8 47.1 4.2 34.7 8.1 25.1C9.4 21.9 10.6 17.7 12.5 14.5Z"
          fill="#fae673"
        />
        <path
          d="M16 18.9C29.8 11.8 49.9 11.7 62.6 16.4C69 18.8 68.7 25.7 63.8 31.8C55.7 41.8 35.4 47.7 20.8 43.5C10.8 40.6 9.4 28.4 16 18.9Z"
          fill="#ebd85a"
          opacity="0.72"
        />
      </g>
    </svg>
  )
}

const LINK_SLOT_WIDTH_CLASS = 'w-[5.25rem] shrink-0 sm:w-[6rem]'

export function ProfileSocialLinkRow({
  links,
  className,
  ariaLabel = 'Links sociales',
}: {
  links: readonly ProfileStyleSocialLink[]
  className?: string
  ariaLabel?: string
}) {
  if (links.length === 0) return null

  return (
    <div className={cn('relative', className)}>
      <ProfileSocialMarkerTextureDefs />
      <nav
        className="flex w-full flex-row flex-wrap items-start justify-center gap-4 sm:gap-8"
        aria-label={ariaLabel}
      >
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group inline-flex flex-col items-center gap-3 text-center text-neutral-950 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-neutral-400',
              LINK_SLOT_WIDTH_CLASS,
            )}
            aria-label={link.label}
            title={link.label}
          >
            <span className="relative flex h-16 w-20 items-center justify-center">
              <ProfileSocialMarkerSpot className="-rotate-6 scale-95 opacity-95 transition-transform group-hover:-rotate-3 group-hover:scale-100" />
              <MemberProfileSocialIcon
                id={link.icon}
                className="relative h-9 w-9 text-neutral-950 [filter:url(#profile-social-ink-roughen)] transition-transform group-hover:scale-105"
              />
            </span>
            <span className="inline-flex w-full min-w-0 items-center justify-center gap-1">
              <span className="min-w-0 truncate text-xs font-medium leading-none underline decoration-neutral-950/45 decoration-1 underline-offset-4">
                {link.displayLabel}
              </span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-neutral-950/50 transition-colors group-hover:text-neutral-950/80"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}
