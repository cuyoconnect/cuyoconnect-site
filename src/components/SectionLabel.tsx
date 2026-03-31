import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500',
        className,
      )}
    >
      {children}
    </span>
  )
}
