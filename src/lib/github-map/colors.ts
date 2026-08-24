import { adjacentIndexes, type Point } from '@/lib/github-map/geometry'

/**
 * Rampa monocromática de la marca: el amarillo puro es demasiado plano para
 * llenar áreas grandes, así que la escala va de crema a ámbar profundo.
 * La intensidad codifica actividad, así el color dice algo en vez de decorar.
 */
export const GITHUB_MAP_RAMP = [
  '#fffaeb',
  '#fff3c4',
  '#ffec6b',
  '#ffdf3d',
  '#ffd000',
  '#ffbe0a',
  '#f7ae00',
] as const

/** Se reserva para la región más activa: ancla la composición en blanco y negro. */
export const GITHUB_MAP_LEAD_FILL = '#1d1d1f'

export const GITHUB_MAP_SEAM = '#ffffff'
export const GITHUB_MAP_ACCENT = '#1d1d1f'
export const GITHUB_MAP_INK = '#1d1d1f'
export const GITHUB_MAP_STAGE = '#faf7ef'

export function shadeFill(hex: string, amount: number) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return hex
  const value = Number.parseInt(raw, 16)
  const mix = (channel: number, target: number) =>
    Math.round(channel * (1 - Math.abs(amount)) + target * Math.abs(amount))
  const toward = amount >= 0 ? 255 : 29
  const r = mix((value >> 16) & 255, toward)
  const g = mix((value >> 8) & 255, toward)
  const b = mix(value & 255, toward)
  return `rgb(${r} ${g} ${b})`
}

export function fillContrast(fill: string) {
  const raw = fill.replace('#', '')
  if (raw.length !== 6) return GITHUB_MAP_INK
  const value = Number.parseInt(raw, 16)
  const luminance =
    (0.299 * ((value >> 16) & 255) +
      0.587 * ((value >> 8) & 255) +
      0.114 * (value & 255)) /
    255
  return luminance > 0.55 ? GITHUB_MAP_INK : '#ffffff'
}

/**
 * Asigna la rampa por ranking de peso, no por valor absoluto: unos pocos repos
 * enormes no aplastan al resto en el mismo tono.
 */
export function rampCellsByWeight(weights: readonly number[]) {
  const order = weights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => a.weight - b.weight)

  const fills: string[] = new Array(weights.length).fill(GITHUB_MAP_RAMP[0]!)
  const steps = GITHUB_MAP_RAMP.length
  const last = Math.max(order.length - 1, 1)

  order.forEach((entry, rank) => {
    const step = Math.min(steps - 1, Math.floor((rank / last) * steps))
    fills[entry.index] = GITHUB_MAP_RAMP[step]!
  })

  const leader = order[order.length - 1]
  if (leader && weights.length > 6) fills[leader.index] = GITHUB_MAP_LEAD_FILL

  return fills.map((fill) => ({ fill, ink: fillContrast(fill) }))
}

/**
 * Variante categórica: colorea evitando que dos vecinas compartan tono.
 * Se mantiene para usos donde el peso no ordena nada.
 */
export function colorVoronoiCells(polygons: readonly Point[][]) {
  const adjacency = adjacentIndexes(polygons)
  const colors: Array<string | undefined> = new Array(polygons.length)

  const order = polygons
    .map((_, index) => index)
    .sort((a, b) => adjacency[b]!.size - adjacency[a]!.size)

  const usage = new Map<string, number>(GITHUB_MAP_RAMP.map((fill) => [fill, 0]))

  order.forEach((index) => {
    const used = new Set(
      [...adjacency[index]!]
        .map((neighbor) => colors[neighbor])
        .filter((fill): fill is string => Boolean(fill)),
    )
    const candidates = GITHUB_MAP_RAMP.filter((fill) => !used.has(fill))
    const pool = candidates.length > 0 ? candidates : GITHUB_MAP_RAMP
    const next = pool.reduce((best, fill) =>
      (usage.get(fill) ?? 0) < (usage.get(best) ?? 0) ? fill : best,
    )
    usage.set(next, (usage.get(next) ?? 0) + 1)
    colors[index] = next
  })

  return colors.map((fill) => ({
    fill: fill ?? GITHUB_MAP_RAMP[0]!,
    ink: fillContrast(fill ?? GITHUB_MAP_RAMP[0]!),
  }))
}
