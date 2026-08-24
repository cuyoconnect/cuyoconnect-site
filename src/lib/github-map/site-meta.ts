/**
 * Lee los metadatos sociales del sitio de cada proyecto (og:image, favicon).
 * Corre en el refresh diario: el cliente recibe las URLs ya resueltas y no
 * depende de ningún servicio de capturas de pago.
 */

export type SiteMeta = {
  imageUrl: string | null
  faviconUrl: string | null
}

const FETCH_TIMEOUT_MS = 6000
/** Los metadatos viven en el <head>; no hace falta bajar la página entera. */
const MAX_HTML_BYTES = 150_000

const IMAGE_PROPERTIES = [
  'og:image:secure_url',
  'og:image:url',
  'og:image',
  'twitter:image:src',
  'twitter:image',
]

function metaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*>`,
    'i',
  )
  const tag = html.match(pattern)?.[0]
  if (!tag) return null
  return tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() || null
}

function iconHref(html: string) {
  const links = html.match(/<link[^>]+>/gi) ?? []
  const icons: Array<{ href: string; score: number }> = []

  for (const tag of links) {
    const rel = tag.match(/rel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
    if (!rel || !rel.includes('icon')) continue
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
    if (!href) continue
    const size = Number(tag.match(/sizes\s*=\s*["'](\d+)/i)?.[1] ?? 0)
    const score = (rel.includes('apple-touch') ? 200 : 0) + size
    icons.push({ href, score })
  }

  if (icons.length === 0) return null
  return icons.sort((a, b) => b.score - a.score)[0]!.href
}

function absolute(href: string | null, base: string) {
  if (!href) return null
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

async function readCapped(response: Response) {
  const body = response.body
  if (!body) return await response.text()

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  let size = 0

  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    html += decoder.decode(value, { stream: true })
    if (/<\/head>/i.test(html)) break
  }

  await reader.cancel().catch(() => {})
  return html
}

export async function fetchSiteMeta(url: string): Promise<SiteMeta> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (compatible; cuyoconnect-map/1.0; +https://cuyoconnect.com)',
      },
    })
    if (!response.ok) return fallbackMeta(url)

    const finalUrl = response.url || url
    const html = await readCapped(response)

    const rawImage = IMAGE_PROPERTIES.map((property) =>
      metaContent(html, property),
    ).find((value) => Boolean(value))

    return {
      imageUrl: absolute(rawImage ?? null, finalUrl),
      faviconUrl:
        absolute(iconHref(html), finalUrl) ?? fallbackMeta(finalUrl).faviconUrl,
    }
  } catch {
    return fallbackMeta(url)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Cuando la cuenta no subió foto, GitHub sirve un identicon generado en la
 * misma URL. No hay forma de distinguirlo por metadatos, pero pesa una fracción
 * de lo que pesa una foto real, así que el tamaño alcanza para descartarlo.
 */
const IDENTICON_MAX_BYTES = 3000

export async function fetchOwnerAvatar(login: string): Promise<string | null> {
  const url = `https://github.com/${encodeURIComponent(login)}.png?size=240`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'cuyoconnect-github-map' },
    })
    if (!response.ok) return null
    const bytes = (await response.arrayBuffer()).byteLength
    return bytes > IDENTICON_MAX_BYTES ? response.url || url : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Sin HTML utilizable queda el favicon de raíz, que casi siempre existe. */
function fallbackMeta(url: string): SiteMeta {
  try {
    const origin = new URL(url).origin
    return { imageUrl: null, faviconUrl: `${origin}/favicon.ico` }
  } catch {
    return { imageUrl: null, faviconUrl: null }
  }
}
