import { cn } from '@/lib/utils'

type CircuitGutter = 'hero' | 'wide'

/**
 * Decoración de fondo: PNG vertical de circuitos (sin rotar).
 * - **< lg:** mismo asset a **ancho completo** (`bg-cover` sobre la sección) como textura ambiental.
 * - **lg+:** máscaras en los laterales (to_right / to_left).
 * - Halo muy suave arriba-derecha.
 *
 * `wide` encaja con `GITHUB_MAP_WIDTH_CLASS` (~78rem): tiras más angostas y un fade más corto.
 */
export function SideCircuitDecor({
  className,
  gutter = 'hero',
}: {
  className?: string
  gutter?: CircuitGutter
}) {
  const wide = gutter === 'wide'

  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-0',
          wide
            ? 'bg-[radial-gradient(ellipse_42%_28%_at_100%_18%,rgba(0,0,0,0.03),transparent_52%)]'
            : 'bg-[radial-gradient(ellipse_70%_40%_at_100%_20%,rgba(0,0,0,0.03),transparent_55%)]',
          className,
        )}
        aria-hidden
      />

      {/* Móvil: PNG vertical a todo el ancho (cover), sin rotar; por encima del bg de la sección */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-0 lg:hidden',
          "bg-[url('/banner/cuyoconnect-circuit-vertical.png')]",
          'bg-cover bg-center bg-no-repeat',
          'opacity-[0.12]',
        )}
        aria-hidden
      />

      {/* Desktop: costados */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-0 hidden select-none lg:block',
          wide
            ? 'w-[max(5.5rem,calc(50vw_-_39rem))]'
            : 'w-[calc(50vw_-_26rem)]',
          "bg-[url('/banner/cuyoconnect-circuit-vertical.png')] bg-fixed bg-no-repeat bg-[length:auto_100vh] bg-left",
          'opacity-[0.12]',
          wide
            ? '[mask-image:linear-gradient(to_right,black_48%,transparent_82%)] [-webkit-mask-image:linear-gradient(to_right,black_48%,transparent_82%)]'
            : '[mask-image:linear-gradient(to_right,black_25%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_25%,transparent_100%)]',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-0 hidden select-none lg:block',
          wide
            ? 'w-[max(5.5rem,calc(50vw_-_39rem))]'
            : 'w-[calc(50vw_-_26rem)]',
          "bg-[url('/banner/cuyoconnect-circuit-vertical.png')] bg-fixed bg-no-repeat bg-[length:auto_100vh] bg-right",
          'opacity-[0.12]',
          wide
            ? '[mask-image:linear-gradient(to_left,black_48%,transparent_82%)] [-webkit-mask-image:linear-gradient(to_left,black_48%,transparent_82%)]'
            : '[mask-image:linear-gradient(to_left,black_25%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_25%,transparent_100%)]',
        )}
        aria-hidden
      />
    </>
  )
}
