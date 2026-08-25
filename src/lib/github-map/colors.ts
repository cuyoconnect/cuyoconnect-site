/**
 * Grises de sistema para las burbujas. El área ya ordena los proyectos, así que
 * el color no necesita repetir esa información a los gritos: apenas insinúa el
 * rango con un tono más denso y deja que el peso visual lo lleve el tamaño.
 */
export const GITHUB_MAP_BUBBLE_SURFACES = [
  '#ffffff',
  '#f9f9fb',
  '#f2f2f5',
  '#ebebef',
  '#e4e4e9',
  '#dcdce2',
  '#d2d2d7',
] as const

export const GITHUB_MAP_INK = '#1d1d1f'
/** Filete de un píxel: define el borde sin dibujar un contorno. */
export const GITHUB_MAP_HAIRLINE = 'rgba(29, 29, 31, 0.10)'
export const GITHUB_MAP_EDGE = 'rgba(29, 29, 31, 0.18)'
export const GITHUB_MAP_EDGE_ACTIVE = 'rgba(29, 29, 31, 0.34)'

/**
 * Asigna la rampa por ranking de peso, no por valor absoluto: unos pocos repos
 * enormes no aplastan al resto en el mismo tono. Sin excepciones para el
 * primero, porque pintar aparte al más activo mete un color categórico en datos
 * ordenados y rompe la lectura de la escala.
 */
export function sequentialFillsByRank(
  weights: readonly number[],
  ramp: readonly string[],
) {
  const order = weights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => a.weight - b.weight)

  const fills: string[] = new Array(weights.length).fill(ramp[0]!)
  const last = Math.max(order.length - 1, 1)

  order.forEach((entry, rank) => {
    const step = Math.min(ramp.length - 1, Math.floor((rank / last) * ramp.length))
    fills[entry.index] = ramp[step]!
  })

  return fills
}
