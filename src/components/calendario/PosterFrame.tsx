import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { POSTER_HEIGHT, POSTER_WIDTH, u } from './shared'

/**
 * Lienzo 4:5 de una placa. Define `--p` (1 px de diseño sobre base 1080) a
 * partir del ancho real, así la misma composición se ve igual en el teléfono,
 * en desktop y en el PNG de 1080×1350 que se exporta.
 */
export function PosterFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="w-full [container-type:inline-size]">
      <div
        className={cn('relative w-full overflow-hidden', className)}
        style={{
          aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}`,
          ['--p' as string]: `calc(100cqw / ${POSTER_WIDTH})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Marcador amarillo estático: un bloque apenas girado detrás del texto, como
 * el resaltador del hero pero sin animación (la placa tiene que exportarse tal cual).
 */
export function Marker({ children }: { children: ReactNode }) {
  return (
    <span className="relative isolate inline-block" style={{ paddingInline: u(6) }}>
      <span
        aria-hidden
        className="absolute -z-10 bg-sun"
        style={{
          inset: `${u(6)} ${u(-10)} ${u(-2)} ${u(-8)}`,
          transform: 'rotate(-1.1deg)',
        }}
      />
      {children}
    </span>
  )
}
