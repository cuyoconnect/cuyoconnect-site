export type BubbleInput = {
  id: string
  value: number
}

export type BubbleNode = BubbleInput & {
  x: number
  y: number
  r: number
}

export type BubbleEdge = {
  source: string
  target: string
}

export type BubbleGraph = {
  nodes: BubbleNode[]
  edges: BubbleEdge[]
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
/** Porción del lienzo cubierta por los discos: llena el ancho del contenedor. */
const AREA_FILL = 0.52
const RELAX_ITERATIONS = 420
/** Aire mínimo entre dos burbujas, para que la arista se lea entre ellas. */
const NODE_PADDING = 24
const BOUNDS_MARGIN = 6
const OVERLAP_EPSILON = 0.75

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function hash01(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

/**
 * Exponente del radio respecto del peso. Con 0.5 el área es exactamente
 * proporcional a los commits, que es lo correcto para comparar valores pero
 * aplana el racimo: entre el proyecto más y el menos activo quedan poco más de
 * dos veces de radio. Subirlo estira esa diferencia y hace que la jerarquía se
 * lea de un vistazo, a costa de exagerar un poco los extremos.
 */
const RADIUS_EXPONENT = 0.64

/**
 * Radio derivado del peso, con piso y techo atados al espacio disponible: el
 * piso para que la imagen siga legible y el techo para que una burbuja no se
 * coma el lienzo.
 */
function computeRadii(values: readonly number[], width: number, height: number) {
  const count = values.length
  const budget = AREA_FILL * width * height
  const evenRadius = Math.sqrt(budget / (count * Math.PI))
  const minRadius = clamp(evenRadius * 0.4, 28, 42)
  const maxRadius = Math.max(minRadius + 1, evenRadius * 2.4)

  const roots = values.map((value) => Math.max(value, 1) ** RADIUS_EXPONENT)
  const sumSquares = roots.reduce((sum, root) => sum + root * root, 0) || 1
  const scale = Math.sqrt(budget / (Math.PI * sumSquares))

  let radii = roots.map((root) => clamp(root * scale, minRadius, maxRadius))

  // Si el clamp infló el área total, achicamos proporcionalmente hasta entrar.
  let totalArea = radii.reduce((sum, radius) => sum + Math.PI * radius * radius, 0)
  if (totalArea > budget) {
    const shrink = Math.sqrt(budget / totalArea)
    radii = radii.map((radius) => Math.max(minRadius, radius * shrink))
    totalArea = radii.reduce((sum, radius) => sum + Math.PI * radius * radius, 0)
  }

  // Segunda pasada: si aún no entra, bajamos el techo antes de relajar posiciones.
  if (totalArea > budget * 1.02) {
    const cap = Math.sqrt((budget * 0.98) / totalArea)
    radii = radii.map((radius) => Math.max(minRadius, radius * cap))
  }

  return radii
}

/** Semilla filotáctica: los discos grandes arrancan al centro del racimo. */
function seedPositions(nodes: BubbleNode[], width: number, height: number) {
  const centerX = width / 2
  const centerY = height / 2
  const spreadX = width * 0.46
  const spreadY = height * 0.4

  nodes.forEach((node, index) => {
    const radial = Math.sqrt((index + 0.5) / nodes.length)
    const angle = index * GOLDEN_ANGLE + hash01(node.id) * 0.9
    node.x = centerX + Math.cos(angle) * radial * spreadX
    node.y = centerY + Math.sin(angle) * radial * spreadY
  })
}

function clampToBounds(nodes: BubbleNode[], width: number, height: number) {
  for (const node of nodes) {
    const margin = node.r + BOUNDS_MARGIN
    node.x = clamp(node.x, margin, width - margin)
    node.y = clamp(node.y, margin, height - margin)
  }
}

function minCenterDistance(a: BubbleNode, b: BubbleNode) {
  return a.r + b.r + NODE_PADDING
}

function hasOverlap(nodes: readonly BubbleNode[]) {
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i]!
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j]!
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      if (distance < minCenterDistance(a, b) - OVERLAP_EPSILON) return true
    }
  }
  return false
}

/** Empuja pares solapados hasta respetar el aire mínimo entre bordes. */
function resolveCollisions(nodes: BubbleNode[]) {
  let moved = false

  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i]!
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.hypot(dx, dy) || 0.01
      const minDistance = minCenterDistance(a, b)
      if (distance >= minDistance) continue

      const push = (minDistance - distance) / distance / 2
      const offsetX = dx * push
      const offsetY = dy * push
      a.x -= offsetX
      a.y -= offsetY
      b.x += offsetX
      b.y += offsetY
      moved = true
    }
  }

  return moved
}

/** Separa solapes y compacta el racimo hacia el centro. */
function relax(nodes: BubbleNode[], width: number, height: number) {
  const centerX = width / 2
  const centerY = height / 2

  for (let step = 0; step < RELAX_ITERATIONS; step += 1) {
    const gravityX = 0.01 * (height / width)
    const gravityY = 0.01

    for (const node of nodes) {
      node.x += (centerX - node.x) * gravityX
      node.y += (centerY - node.y) * gravityY
    }

    resolveCollisions(nodes)
    clampToBounds(nodes, width, height)
    resolveCollisions(nodes)
  }
}

/** Pasada final hasta eliminar solapes residuales (p. ej. tras clamp al borde). */
function enforceNonOverlap(nodes: BubbleNode[], width: number, height: number) {
  for (let step = 0; step < 160; step += 1) {
    const moved = resolveCollisions(nodes)
    clampToBounds(nodes, width, height)
    resolveCollisions(nodes)
    if (!moved && !hasOverlap(nodes)) break
  }
}

function shrinkRadii(nodes: BubbleNode[], factor: number) {
  for (const node of nodes) {
    node.r *= factor
  }
}

/**
 * Árbol de expansión mínima sobre la distancia entre bordes: conecta todo el
 * racimo con las aristas más cortas, como los tallos del isotipo.
 */
function spanningEdges(nodes: BubbleNode[]) {
  const count = nodes.length
  const edges: BubbleEdge[] = []
  if (count < 2) return edges

  const gapBetween = (a: BubbleNode, b: BubbleNode) =>
    Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r)

  const inTree = new Array<boolean>(count).fill(false)
  const bestCost = new Array<number>(count).fill(Number.POSITIVE_INFINITY)
  const parent = new Array<number>(count).fill(-1)
  bestCost[0] = 0

  for (let iteration = 0; iteration < count; iteration += 1) {
    let next = -1
    for (let i = 0; i < count; i += 1) {
      if (!inTree[i] && (next === -1 || bestCost[i]! < bestCost[next]!)) next = i
    }
    if (next === -1) break

    inTree[next] = true
    const from = parent[next]!
    if (from >= 0) {
      edges.push({ source: nodes[from]!.id, target: nodes[next]!.id })
    }

    for (let other = 0; other < count; other += 1) {
      if (inTree[other]) continue
      const cost = gapBetween(nodes[next]!, nodes[other]!)
      if (cost < bestCost[other]!) {
        bestCost[other] = cost
        parent[other] = next
      }
    }
  }

  return edges
}

/** Cierra algunos triángulos: un árbol puro se ve más pobre que el isotipo. */
function bridgeEdges(nodes: BubbleNode[], existing: BubbleEdge[]) {
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const taken = new Set(existing.map((edge) => key(edge.source, edge.target)))
  const degree = new Map<string, number>()
  for (const edge of existing) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1)
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1)
  }

  const candidates: Array<{ gap: number; a: BubbleNode; b: BubbleNode }> = []
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!
      const b = nodes[j]!
      if (taken.has(key(a.id, b.id))) continue
      candidates.push({
        gap: Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r),
        a,
        b,
      })
    }
  }
  candidates.sort((left, right) => left.gap - right.gap)

  const extras: BubbleEdge[] = []
  const budget = Math.round(nodes.length * 0.28)

  for (const candidate of candidates) {
    if (extras.length >= budget) break
    const { a, b } = candidate
    if ((degree.get(a.id) ?? 0) >= 3 || (degree.get(b.id) ?? 0) >= 3) continue
    extras.push({ source: a.id, target: b.id })
    taken.add(key(a.id, b.id))
    degree.set(a.id, (degree.get(a.id) ?? 0) + 1)
    degree.set(b.id, (degree.get(b.id) ?? 0) + 1)
  }

  return extras
}

/** Racimo de burbujas conectadas: área por commits, aristas por cercanía. */
export function layoutBubbleGraph(
  items: readonly BubbleInput[],
  width: number,
  height: number,
): BubbleGraph {
  if (items.length === 0 || width <= 0 || height <= 0) {
    return { nodes: [], edges: [] }
  }

  const ordered = [...items].sort((a, b) => b.value - a.value)
  const radii = computeRadii(
    ordered.map((item) => item.value),
    width,
    height,
  )
  const nodes: BubbleNode[] = ordered.map((item, index) => ({
    ...item,
    r: radii[index]!,
    x: 0,
    y: 0,
  }))

  seedPositions(nodes, width, height)
  relax(nodes, width, height)
  enforceNonOverlap(nodes, width, height)

  let safety = 0
  while (hasOverlap(nodes) && safety < 6) {
    shrinkRadii(nodes, 0.96)
    enforceNonOverlap(nodes, width, height)
    safety += 1
  }

  const tree = spanningEdges(nodes)
  return { nodes, edges: [...tree, ...bridgeEdges(nodes, tree)] }
}
