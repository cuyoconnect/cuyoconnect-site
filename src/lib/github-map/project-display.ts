import type {
  GithubMapLinks,
  GithubMapPayload,
  GithubMapProject,
} from '@/lib/github-map/types'
import { aggregateMapProjects } from '@/lib/github-map/projects'
import type { ProjectLink } from '@/components/github-map/ProjectLinkOrbs'

const EMPTY_PROJECTS: GithubMapProject[] = []

export function repoShortName(fullName: string) {
  return fullName.split('/')[1] || fullName
}

export function repoOwner(fullName: string) {
  return fullName.split('/')[0] || fullName
}

export function projectsFromPayload(payload: GithubMapPayload | null): GithubMapProject[] {
  if (!payload) return EMPTY_PROJECTS
  if (payload.projects?.length) return payload.projects
  return aggregateMapProjects(payload.members ?? [])
}

export function memberAvatarMap(payload: GithubMapPayload | null) {
  const byLogin = new Map<string, string>()
  for (const member of payload?.members ?? []) {
    if (member.githubLogin && member.avatarUrl) {
      byLogin.set(member.githubLogin.toLowerCase(), member.avatarUrl)
    }
  }
  return byLogin
}

export function memberLinksMap(payload: GithubMapPayload | null) {
  const byLogin = new Map<string, GithubMapLinks>()
  for (const member of payload?.members ?? []) {
    if (member.githubLogin && member.links) {
      byLogin.set(member.githubLogin.toLowerCase(), member.links)
    }
  }
  return byLogin
}

/**
 * Imagen social que GitHub genera para cualquier repo. Es la red final del
 * retrato: los favicons de los deploys suelen faltar (404) o medir 32px, y
 * estirados dejan la tarjeta casi gris.
 */
export function githubSocialImage(fullName: string) {
  return `https://opengraph.githubassets.com/1/${fullName}`
}

export function avatarForProject(
  project: GithubMapProject,
  memberAvatars: Map<string, string>,
) {
  const owner = repoOwner(project.fullName)
  if (!owner) return null
  return memberAvatars.get(owner.toLowerCase()) ?? project.ownerAvatarUrl ?? null
}

export function projectLinksFor(
  project: GithubMapProject,
  memberLinks: Map<string, GithubMapLinks>,
): ProjectLink[] {
  const owner = repoOwner(project.fullName)
  const links = memberLinks.get(owner.toLowerCase()) ?? {}
  const candidates: ProjectLink[] = [
    {
      id: 'homepage',
      label: `Abrir ${repoShortName(project.fullName)}`,
      href: project.homepageUrl,
      icon: 'arrow',
    },
    {
      id: 'repo',
      label: `Ver ${project.fullName} en GitHub`,
      href: `https://github.com/${project.fullName}`,
      icon: 'github',
    },
    links.website
      ? {
          id: 'site',
          label: `Sitio personal de ${owner}`,
          href: links.website,
          icon: 'website' as const,
        }
      : null,
    links.linkedin
      ? {
          id: 'linkedin',
          label: `LinkedIn de ${owner}`,
          href: links.linkedin,
          icon: 'linkedin' as const,
        }
      : null,
    links.x
      ? { id: 'x', label: `X de ${owner}`, href: links.x, icon: 'x' as const }
      : null,
  ].filter((link): link is ProjectLink => Boolean(link))

  // La homepage va primera, así que si el sitio personal del dueño es el mismo
  // enlace queda descartado por duplicado y no se repite el botón.
  const normalize = (href: string) => href.replace(/\/+$/, '').toLowerCase()
  const seen = new Set<string>()
  return candidates.filter((link) => {
    const key = normalize(link.href)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const HOSTING_SUFFIX = /\.(github\.io|vercel\.app|netlify\.app|pages\.dev)$/i
/** Fallback cuando no hay canvas (SSR): ancho medio del glifo en Inter. */
const FALLBACK_CHAR_RATIO = 0.52
const LABEL_FONT_STACK = 'Inter, ui-sans-serif, system-ui, sans-serif'
const LABEL_WEIGHT = 500
/** Por debajo de 12px una etiqueta deja de leerse de un vistazo. */
const MIN_LABEL_FONT = 12
const MAX_LABEL_FONT = 32
/**
 * El cuerpo acompaña al radio en vez de ser fijo: refuerza la jerarquía que ya
 * marca el área y evita que una burbuja enorme lleve una etiqueta diminuta.
 */
const FONT_PER_RADIUS = 0.34
const MAX_LABEL_LINES = 3
const LINE_HEIGHT_RATIO = 1.12
/**
 * El texto se ajusta contra un disco interior, no contra el borde. Sin este
 * margen un nombre de tres líneas llena la burbuja de lado a lado y la deja
 * con aspecto de estar embutida.
 */
const LABEL_INSET = 0.8
/** Aire lateral dentro de la cuerda, para que el texto no toque el filete. */
const CHORD_PADDING = 0.9

export type FittedLabel = {
  fontPx: number
  lines: string[]
}

let measureContext: CanvasRenderingContext2D | null | undefined

/**
 * Mide el texto con la tipografía real. Estimar por cantidad de caracteres
 * falla justo donde importa: `AlphArenaFrontend` y `wallet-multichain` tienen
 * casi los mismos caracteres y ocupan anchos muy distintos.
 */
function measureLabelWidth(text: string, fontPx: number) {
  if (measureContext === undefined) {
    measureContext =
      typeof document === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d')
  }
  if (!measureContext) return text.length * fontPx * FALLBACK_CHAR_RATIO
  measureContext.font = `${LABEL_WEIGHT} ${fontPx}px ${LABEL_FONT_STACK}`
  return measureContext.measureText(text).width
}

/** Corta por separadores y por camelCase, sin perder ningún carácter. */
function tokenizeLabel(label: string) {
  return label
    .split(/(?<=[-_.])/)
    .flatMap((chunk) => chunk.split(/(?<=[a-z0-9])(?=[A-Z])/))
    .filter(Boolean)
}

/**
 * Ancho aprovechable de una línea dentro del círculo. Se mide en el borde más
 * alejado del centro, que es donde la circunferencia se cierra: usar la cuerda
 * del centro haría que las líneas de arriba y abajo se salgan del disco.
 */
function chordWidth(radius: number, offsetY: number, lineHeight: number) {
  const edge = Math.abs(offsetY) + lineHeight / 2
  const half = Math.sqrt(Math.max(radius * radius - edge * edge, 0))
  return 2 * half * CHORD_PADDING
}

/** Reparte las palabras en `lineCount` líneas, o null si no entran. */
function fillLines(
  words: readonly string[],
  radius: number,
  fontPx: number,
  lineCount: number,
): string[] | null {
  const lineHeight = fontPx * LINE_HEIGHT_RATIO
  const lines: string[] = []
  let index = 0

  for (let line = 0; line < lineCount; line += 1) {
    const offsetY = (line - (lineCount - 1) / 2) * lineHeight
    const available = chordWidth(radius, offsetY, lineHeight)
    let current = ''

    while (index < words.length) {
      const candidate = current + words[index]!
      if (measureLabelWidth(candidate, fontPx) > available) break
      current = candidate
      index += 1
    }

    if (!current) return null
    lines.push(current)
    if (index >= words.length) return lines
  }

  return null
}

/** Último recurso: una sola línea recortada en la cuerda más ancha. */
function truncateToChord(label: string, radius: number) {
  const available = chordWidth(radius, 0, MIN_LABEL_FONT * LINE_HEIGHT_RATIO)
  if (measureLabelWidth(label, MIN_LABEL_FONT) <= available) return [label]

  let text = label
  while (text.length > 1) {
    text = text.slice(0, -1)
    if (measureLabelWidth(`${text}…`, MIN_LABEL_FONT) <= available) break
  }
  return [`${text}…`]
}

/**
 * Cuánto cuerpo de letra justifica una línea extra. Sin esta penalización el
 * ajuste parte `x-reader` en `x-` y `reader` solo para ganar dos píxeles de
 * tipografía, que es peor negocio que leerlo entero un poco más chico.
 */
const LINE_ECONOMY = 0.75

/** Mejor combinación de cuerpo y líneas dentro de un disco dado, o null. */
function fitWithin(
  words: readonly string[],
  inner: number,
  startFont: number,
): FittedLabel | null {
  const options: Array<FittedLabel & { lineCount: number }> = []

  for (let lineCount = 1; lineCount <= MAX_LABEL_LINES; lineCount += 1) {
    for (let fontPx = startFont; fontPx >= MIN_LABEL_FONT; fontPx -= 1) {
      if (lineCount * fontPx * LINE_HEIGHT_RATIO > inner * 2 * CHORD_PADDING) continue
      const lines = fillLines(words, inner, fontPx, lineCount)
      if (lines) {
        options.push({ fontPx, lines, lineCount })
        break
      }
    }
  }

  if (options.length === 0) return null

  const bestFont = Math.max(...options.map((option) => option.fontPx))
  // Las opciones vienen de menos a más líneas, así que la primera que alcanza
  // el umbral es la más compacta que todavía se lee bien.
  const pick =
    options.find((option) => option.fontPx >= bestFont * LINE_ECONOMY) ?? options[0]!
  return { fontPx: pick.fontPx, lines: pick.lines }
}

/**
 * Busca el cuerpo más grande con el que el nombre completo entra en el disco.
 * El margen interior es estético: si el nombre no entra con él, se cede el
 * margen antes que recortar, porque una etiqueta cortada no dice nada.
 */
export function fitLabelInCircle(name: string, radius: number): FittedLabel {
  const label = name.replace(HOSTING_SUFFIX, '')
  const words = tokenizeLabel(label)
  const startFont = Math.round(
    Math.min(MAX_LABEL_FONT, Math.max(MIN_LABEL_FONT, radius * FONT_PER_RADIUS)),
  )

  for (const inset of [LABEL_INSET, 0.94]) {
    const fitted = fitWithin(words, radius * inset, startFont)
    if (fitted) return fitted
  }

  return { fontPx: MIN_LABEL_FONT, lines: truncateToChord(label, radius * 0.94) }
}
