import { cn } from '@/lib/utils'

export function PaperField({
  children,
  className,
  quiet = false,
}: {
  children: React.ReactNode
  className?: string
  quiet?: boolean
}) {
  return (
    <div
      className={cn(
        'relative isolate text-ink',
        quiet ? 'bg-white' : 'bg-paper',
        className,
      )}
    >
      {quiet ? null : (
        <div
          className="cuyo-paper-fiber pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        />
      )}
      {children}
      <div
        className={cn(
          'cuyo-graph-overlay pointer-events-none absolute inset-0 z-20',
          quiet && 'opacity-25',
        )}
        aria-hidden
      />
    </div>
  )
}
