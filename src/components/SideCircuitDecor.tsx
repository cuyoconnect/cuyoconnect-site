import { cn } from '@/lib/utils'

/**
 * Decoración de fondo reutilizable: dos franjas laterales con el patrón de
 * circuitos + uvita y un sutil halo oscuro arriba a la derecha. El conjunto
 * está diseñado para "respirar" sin competir con el contenido central.
 *
 * Uso: poner como primer hijo de un contenedor con `relative isolate` (para
 * que el `-z-10` se confine al stacking context del wrapper y quede ENCIMA
 * del `bg-white` del propio wrapper). Las franjas son `hidden lg:block` así
 * que en mobile la página se ve limpia.
 *
 * El background usa `background-attachment: fixed` con tamaño relativo al
 * viewport para que la imagen no se estire en páginas largas que scrollean
 * (Recursos, etc.) y siempre se vea a tamaño consistente.
 */
export function SideCircuitDecor({ className }: { className?: string }) {
  return (
    <>
      {/* Halo sutil oscuro arriba a la derecha para "anclar" el header. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10',
          'bg-[radial-gradient(ellipse_70%_40%_at_100%_20%,rgba(0,0,0,0.03),transparent_55%)]',
          className,
        )}
        aria-hidden
      />

      {/* Patrón de circuitos+uvita a los costados (solo desktop): rellena el aire
          fuera de la columna de contenido (misma máx. 52rem que el navbar y el hero).
          La imagen se escala al alto del viewport y queda anclada al borde externo. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 -z-10 select-none',
          'hidden lg:block',
          'w-[calc(50vw_-_26rem)]',
          "bg-[url('/banner/cuyoconnect-circuit-vertical.png')] bg-fixed bg-no-repeat bg-[length:auto_100vh] bg-left",
          'opacity-[0.12]',
          '[mask-image:linear-gradient(to_right,black_25%,transparent_100%)]',
          '[-webkit-mask-image:linear-gradient(to_right,black_25%,transparent_100%)]',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 -z-10 select-none',
          'hidden lg:block',
          'w-[calc(50vw_-_26rem)]',
          "bg-[url('/banner/cuyoconnect-circuit-vertical.png')] bg-fixed bg-no-repeat bg-[length:auto_100vh] bg-right",
          'opacity-[0.12]',
          '[mask-image:linear-gradient(to_left,black_25%,transparent_100%)]',
          '[-webkit-mask-image:linear-gradient(to_left,black_25%,transparent_100%)]',
        )}
        aria-hidden
      />
    </>
  )
}
