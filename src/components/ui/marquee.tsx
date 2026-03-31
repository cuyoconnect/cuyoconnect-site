import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type MarqueeProps = HTMLAttributes<HTMLDivElement> & {
  pauseOnHover?: boolean
  children: ReactNode
}

export function Marquee({
  className,
  pauseOnHover,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div className={cn('relative flex overflow-x-hidden', className)} {...props}>
      <div
        className={cn(
          'flex w-max max-w-none shrink-0 animate-marquee items-stretch',
          'gap-[var(--gap,1rem)]',
          pauseOnHover &&
            'motion-safe:hover:[animation-play-state:paused]',
        )}
      >
        <div className="flex shrink-0 gap-[var(--gap,1rem)]">{children}</div>
        <div className="flex shrink-0 gap-[var(--gap,1rem)]" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
