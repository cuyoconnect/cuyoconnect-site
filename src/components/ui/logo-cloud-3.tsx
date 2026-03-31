import type { ComponentProps } from 'react'

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { cn } from '@/lib/utils'

export type LogoCloudLogo = {
  src: string
  alt: string
  width?: number
  height?: number
  href?: string
  /** Clases extra para la imagen (contraste, tamaño, etc.) */
  imgClassName?: string
  /** Etiqueta accesible del enlace; por defecto se arma desde alt */
  linkAriaLabel?: string
}

type LogoCloudProps = ComponentProps<'div'> & {
  logos: LogoCloudLogo[]
  gap?: number
  reverse?: boolean
  duration?: number
  durationOnHover?: number
}

export function LogoCloud({
  className,
  logos,
  gap = 42,
  reverse,
  duration = 80,
  durationOnHover = 25,
  ...props
}: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        'overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent_0%,black_12%,black_88%,transparent_100%)]',
        className,
      )}
    >
      <InfiniteSlider
        gap={gap}
        reverse={reverse}
        duration={duration}
        durationOnHover={durationOnHover}
      >
        {logos.map((logo) => {
          const img = (
            <img
              alt={logo.alt}
              className={cn(
                'h-auto w-auto max-w-full shrink-0 select-none object-contain',
                'pointer-events-none',
                logo.imgClassName,
              )}
              height={logo.height}
              loading="lazy"
              src={logo.src}
              width={logo.width}
            />
          )

          const itemKey = `${logo.src}-${logo.alt}`

          if (logo.href) {
            return (
              <a
                key={itemKey}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                aria-label={
                  logo.linkAriaLabel ??
                  `${logo.alt} — sitio oficial (se abre en una pestaña nueva)`
                }
              >
                {img}
              </a>
            )
          }

          return (
            <span key={itemKey} className="inline-flex shrink-0 items-center">
              {img}
            </span>
          )
        })}
      </InfiniteSlider>
    </div>
  )
}
