const WEBSITE_LABEL_MAX = 20
/** Ancho máximo del texto visible bajo cada ícono. */
export const LINK_LABEL_MAX = 18

export function truncateWithEllipsis(text: string, maxLength: number): string {
  if (maxLength < 2 || text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}…`
}

export function truncateLinkLabel(
  text: string,
  maxLength: number = LINK_LABEL_MAX,
): string {
  return truncateWithEllipsis(text, maxLength)
}

export function xHandleFromUrl(href: string): string | null {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'x.com' && host !== 'twitter.com' && !host.endsWith('.x.com')) {
      return null
    }
    const handle = url.pathname.split('/').filter(Boolean)[0]
    if (!handle || ['home', 'intent', 'share'].includes(handle.toLowerCase())) return null
    return `@${handle.replace(/^@/, '')}`
  } catch {
    return null
  }
}

export function websiteDisplayLabel(
  href: string,
  maxLength: number = WEBSITE_LABEL_MAX,
): string {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./i, '')
    const path = url.pathname.replace(/\/+$/, '')
    const withPath = path && path !== '/' ? `${host}${path}` : host
    if (withPath.length <= maxLength) return withPath
    if (host.length <= maxLength) return truncateWithEllipsis(host, maxLength)
    return truncateWithEllipsis(withPath, maxLength)
  } catch {
    const stripped = href.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
    return truncateWithEllipsis(stripped, maxLength)
  }
}

export function socialLinkDisplayLabel(
  id: string,
  href: string,
  fallback: string,
): string {
  if (id === 'x') return xHandleFromUrl(href) ?? fallback
  if (id === 'website' || id === 'site') return websiteDisplayLabel(href)
  return fallback
}
