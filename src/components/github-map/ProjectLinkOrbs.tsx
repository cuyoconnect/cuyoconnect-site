import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export type ProjectLink = {
  id: string
  label: string
  href: string
  icon: 'arrow' | 'github' | 'linkedin' | 'x' | 'website'
}

const ORB_SPRING = { type: 'spring', stiffness: 420, damping: 24, mass: 0.6 } as const

/** Cada marca reacciona distinto al hover: el globo gira, el resto respira. */
const ICON_MOTION: Record<ProjectLink['icon'], string> = {
  arrow:
    'transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
  website: 'transition-transform duration-700 ease-out group-hover:rotate-[360deg]',
  github: 'transition-transform duration-300 ease-out group-hover:-translate-y-0.5',
  linkedin: 'transition-transform duration-300 ease-out group-hover:-translate-y-0.5',
  x: 'transition-transform duration-300 ease-out group-hover:rotate-[-12deg]',
}

function Icon({ name }: { name: ProjectLink['icon'] }) {
  const common = {
    className: 'h-[18px] w-[18px]',
    'aria-hidden': true,
  } as const

  if (name === 'arrow') {
    // Misma marca que el CTA «Unite»: la flecha anuncia salir del sitio.
    return (
      <svg
        {...common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    )
  }

  if (name === 'github') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05A4.17 4.17 0 0 1 17.6 8.7c4 0 4.4 2.5 4.4 5.75V21h-4v-5.6c0-1.33-.02-3.05-1.9-3.05s-2.2 1.45-2.2 2.95V21h-4V9Z" />
      </svg>
    )
  }

  if (name === 'x') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.53 3h3.14l-6.86 7.84L21.9 21h-6.3l-4.94-6.46L4.99 21H1.85l7.34-8.39L2.1 3h6.46l4.47 5.9L17.53 3Zm-1.1 16.13h1.74L7.65 4.78H5.79l10.64 14.35Z" />
      </svg>
    )
  }

  return (
    <svg
      {...common}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  )
}

/**
 * Botones circulares que brotan bajo la tarjeta fijada, uno detrás de otro.
 * Misma receta que las burbujas: superficie clara, filete de un píxel y sombra
 * suave. Antes eran de vidrio, que funcionaba sobre el mapa oscuro pero
 * desaparece sobre el blanco de la página.
 */
export function ProjectLinkOrbs({
  links,
  visible,
}: {
  links: readonly ProjectLink[]
  visible: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {visible && links.length > 0 ? (
        <motion.div
          className="pointer-events-auto mt-2.5 flex items-center justify-center gap-2"
          initial={false}
        >
          {links.map((link, index) => (
            <motion.a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[rgba(29,29,31,0.10)] bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(29,29,31,0.04),0_8px_20px_rgba(29,29,31,0.10)] transition-colors hover:bg-neutral-50"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.3, y: -16, filter: 'blur(8px)' }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.3, y: -10, filter: 'blur(6px)' }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { ...ORB_SPRING, delay: index * 0.07 }
              }
              whileHover={reduceMotion ? undefined : { scale: 1.12 }}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            >
              <span
                className={
                  reduceMotion ? 'relative' : `relative ${ICON_MOTION[link.icon]}`
                }
              >
                <Icon name={link.icon} />
              </span>
            </motion.a>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
