import { ProfileSocialLinkRow } from '@/components/ProfileSocialLinkRow'
import { cn } from '@/lib/utils'
import type { ProfileStyleSocialLink } from '@/components/ProfileSocialLinkRow'
import type { GithubMapProject } from '@/lib/github-map/types'

const COMPACT_AVATAR_CLASS = 'h-[4.5rem] w-[4.5rem]'
const COMPACT_ROW_MIN_H = 'min-h-[4.5rem]'

type ProjectFocusPanelProps = {
  project: GithubMapProject
  title: string
  ownerHandle: string
  imageSrc: string | null
  links: readonly ProfileStyleSocialLink[]
  /** Menos aire vertical cuando va debajo del zoom del mapa. */
  compact?: boolean
  /** La burbuja animada ocupa el hueco del avatar en el mapa. */
  bubbleAvatarSlot?: boolean
  className?: string
}

export function ProjectFocusPanel({
  project,
  title,
  ownerHandle,
  imageSrc,
  links,
  compact = false,
  bubbleAvatarSlot = false,
  className,
}: ProjectFocusPanelProps) {
  const profileHref = ownerHandle ? `https://github.com/${ownerHandle}` : null

  if (compact) {
    return (
      <div className={cn('mx-auto w-full max-w-xl text-left', className)}>
        <header className="w-full">
          <div className="flex items-center gap-4">
            <div className={cn('shrink-0 self-center', COMPACT_AVATAR_CLASS)}>
              {bubbleAvatarSlot ? (
                <div className={cn('rounded-full', COMPACT_AVATAR_CLASS)} aria-hidden />
              ) : (
                <img
                  src={imageSrc ?? '/logo.png'}
                  alt=""
                  width={72}
                  height={72}
                  className={cn(
                    'rounded-full border border-neutral-200/80 bg-neutral-50 object-cover',
                    COMPACT_AVATAR_CLASS,
                  )}
                />
              )}
            </div>
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col justify-center gap-0.5',
                COMPACT_ROW_MIN_H,
              )}
            >
              <h3 className="text-balance text-lg font-semibold leading-tight tracking-tight text-neutral-950 sm:text-xl">
                {title}
              </h3>
              {ownerHandle && profileHref ? (
                <p className="text-sm leading-none text-neutral-500">
                  <a
                    href={profileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-700 underline decoration-neutral-400 underline-offset-[3px] transition-colors hover:text-neutral-950 hover:decoration-neutral-700"
                  >
                    @{ownerHandle}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          {project.description ? (
            <p className="mt-5 text-pretty text-sm leading-relaxed text-neutral-600">
              {project.description}
            </p>
          ) : links.length > 0 ? (
            <div className="mt-5" aria-hidden />
          ) : null}

          {links.length > 0 ? (
            <>
              <div className="my-3 border-t border-dashed border-neutral-200" aria-hidden />
              <ProfileSocialLinkRow
                links={links}
                ariaLabel="Enlaces del proyecto"
                className="justify-center"
              />
            </>
          ) : null}
        </header>
      </div>
    )
  }

  return (
    <div className={cn('mx-auto w-full max-w-xl text-center', className)}>
      <header className="flex w-full flex-col items-center gap-5">
        <div className="shrink-0">
          <img
            src={imageSrc ?? '/logo.png'}
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 rounded-full border border-neutral-200/80 bg-neutral-50 object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-balance text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {title}
          </h3>
          {ownerHandle && profileHref ? (
            <p className="mt-1.5 text-sm text-neutral-500">
              <a
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-700 underline decoration-neutral-400 underline-offset-[3px] transition-colors hover:text-neutral-950 hover:decoration-neutral-700"
              >
                @{ownerHandle}
              </a>
            </p>
          ) : null}
          {project.description ? (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-neutral-600">
              {project.description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="my-5 border-t border-dashed border-neutral-200" aria-hidden />

      <ProfileSocialLinkRow
        links={links}
        ariaLabel="Enlaces del proyecto"
        className="justify-center"
      />
    </div>
  )
}
