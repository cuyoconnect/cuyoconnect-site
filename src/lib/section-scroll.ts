/**
 * Rutas “limpias” que deben servir index.html en el host estático y
 * alinearse con un id de sección en la landing.
 */
export const SECTION_PATH_TO_ID = {
  '/eventos': 'eventos',
  '/miembros': 'miembros',
} as const

export type SectionPathname = keyof typeof SECTION_PATH_TO_ID

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function getSectionIdFromPath(pathname: string): string | null {
  const p = normalizePathname(pathname) as SectionPathname
  return SECTION_PATH_TO_ID[p] ?? null
}

export function scrollToSectionElement(id: string): boolean {
  const target = document.getElementById(id)
  if (!target) return false

  const heading = target.querySelector<HTMLElement>('[id$="-heading"]')
  const el = heading ?? target
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
  return true
}

function tryScrollFromLocation(): boolean {
  const hash = window.location.hash
  if (hash) {
    const target = document.querySelector(hash)
    if (!target) return false
    const heading = target.querySelector<HTMLElement>('[id$="-heading"]')
    const el = heading ?? (target as HTMLElement)
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
    return true
  }

  const id = getSectionIdFromPath(window.location.pathname)
  if (!id) return false
  return scrollToSectionElement(id)
}

/**
 * Reintenta varios frames: el scroll nativo por hash suele perder la carrera
 * contra el primer paint de React.
 */
export function scheduleScrollFromLocation(): void {
  let attempts = 0
  const maxAttempts = 90
  const step = () => {
    if (tryScrollFromLocation()) return
    attempts += 1
    if (attempts < maxAttempts) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function scheduleScrollToSectionId(id: string): void {
  let attempts = 0
  const maxAttempts = 90
  const step = () => {
    if (scrollToSectionElement(id)) return
    attempts += 1
    if (attempts < maxAttempts) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
