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
