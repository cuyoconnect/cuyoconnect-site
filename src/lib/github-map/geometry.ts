export type Point = [number, number]

export function polygonArea(points: readonly Point[]) {
  let area = 0
  const count = points.length
  if (count < 3) return 0

  for (let index = 0; index < count; index += 1) {
    const [x0, y0] = points[index]!
    const [x1, y1] = points[(index + 1) % count]!
    area += x0 * y1 - x1 * y0
  }

  return area / 2
}

export function polygonCentroid(points: readonly Point[]): Point {
  const area = polygonArea(points)
  if (points.length === 0) return [0, 0]
  if (Math.abs(area) < 1e-9) {
    const sumX = points.reduce((sum, point) => sum + point[0], 0)
    const sumY = points.reduce((sum, point) => sum + point[1], 0)
    return [sumX / points.length, sumY / points.length]
  }

  let cx = 0
  let cy = 0
  const count = points.length
  for (let index = 0; index < count; index += 1) {
    const [x0, y0] = points[index]!
    const [x1, y1] = points[(index + 1) % count]!
    const cross = x0 * y1 - x1 * y0
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }

  const factor = 1 / (6 * area)
  return [cx * factor, cy * factor]
}

export function polygonPath(points: readonly Point[]) {
  if (points.length === 0) return ''
  return `M${points.map((point) => `${point[0].toFixed(2)},${point[1].toFixed(2)}`).join('L')}Z`
}

function hash01(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

/** Clip convexo, mismo winding que d3-voronoi-map: [[0,0],[0,h],[w,h],[w,0]]. */
export function mapClip(width: number, height: number, inset = 10): Point[] {
  const left = inset
  const top = inset
  const right = Math.max(width - inset, left + 32)
  const bottom = Math.max(height - inset, top + 32)
  return [
    [left, top],
    [left, bottom],
    [right, bottom],
    [right, top],
  ]
}

/**
 * Clip convexo con silueta de continente (elipse con radio ondulado).
 * Reemplaza el marco rectangular: el borde exterior lo dibujan los propios proyectos.
 */
export function organicClip(
  width: number,
  height: number,
  inset = 6,
  sides = 72,
  seed = 'cuyo-map',
): Point[] {
  const halfWidth = Math.max(width / 2 - inset, 24)
  const halfHeight = Math.max(height / 2 - inset, 24)
  const cx = width / 2
  const cy = height / 2

  const waves = [
    { freq: 2, phase: hash01(`${seed}:a`) * Math.PI * 2, amp: 0.06 },
    { freq: 3, phase: hash01(`${seed}:b`) * Math.PI * 2, amp: 0.03 },
  ]

  // Normaliza para que la silueta quede inscrita en el contenedor y no se recorte.
  const span = waves.reduce((sum, wave) => sum + wave.amp, 0)

  const points: Point[] = []
  for (let index = 0; index < sides; index += 1) {
    // Ángulo descendente para conservar el winding de mapClip.
    const angle = (-index / sides) * Math.PI * 2
    const ripple = waves.reduce(
      (sum, wave) => sum + wave.amp * Math.sin(wave.freq * angle + wave.phase),
      0,
    )
    const radius = (1 + ripple) / (1 + span)
    // Superelipse: llena más el ancho disponible que una elipse y evita el look de huevo.
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const exponent = 4.2
    const norm =
      1 /
      Math.pow(
        Math.pow(Math.abs(cos), exponent) + Math.pow(Math.abs(sin), exponent),
        1 / exponent,
      )
    points.push([
      cx + cos * norm * halfWidth * radius,
      cy + sin * norm * halfHeight * radius,
    ])
  }

  return points
}

export function fitPolygonTransform(
  points: readonly Point[],
  viewWidth: number,
  viewHeight: number,
  padding = 0.08,
) {
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const boxWidth = Math.max(maxX - minX, 1)
  const boxHeight = Math.max(maxY - minY, 1)
  const scale =
    Math.min(viewWidth / boxWidth, viewHeight / boxHeight) * (1 - padding)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return {
    scale,
    x: viewWidth / 2 - cx * scale,
    y: viewHeight / 2 - cy * scale,
  }
}

export function transformPoints(
  points: readonly Point[],
  transform: { scale: number; x: number; y: number },
): Point[] {
  return points.map(
    ([x, y]) =>
      [x * transform.scale + transform.x, y * transform.scale + transform.y] as Point,
  )
}

const WELD_EPSILON = 0.75

function weldKey(point: Point) {
  return `${Math.round(point[0] / WELD_EPSILON)}:${Math.round(point[1] / WELD_EPSILON)}`
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

type Topology = {
  positions: Point[]
  rings: number[][]
  edgeOwners: Map<string, number[]>
}

/** Ramer–Douglas–Peucker sobre una polilínea abierta. */
function simplifyChain(points: readonly Point[], tolerance: number): Point[] {
  if (points.length < 3) return points.map((point) => [point[0], point[1]] as Point)

  const first = points[0]!
  const last = points[points.length - 1]!
  const dx = last[0] - first[0]
  const dy = last[1] - first[1]
  const length = Math.hypot(dx, dy)

  let farthest = 0
  let maxDistance = -1
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index]!
    const distance =
      length < 1e-9
        ? Math.hypot(x - first[0], y - first[1])
        : Math.abs(dy * x - dx * y + last[0] * first[1] - last[1] * first[0]) /
          length
    if (distance > maxDistance) {
      maxDistance = distance
      farthest = index
    }
  }

  if (maxDistance <= tolerance) return [first, last]

  const head = simplifyChain(points.slice(0, farthest + 1), tolerance)
  const tail = simplifyChain(points.slice(farthest), tolerance)
  return [...head.slice(0, -1), ...tail]
}

/** Suelda los vértices repetidos entre celdas para trabajar sobre una malla compartida. */
function buildTopology(polygons: readonly Point[][]): Topology {
  const index = new Map<string, number>()
  const positions: Point[] = []

  const vertexId = (point: Point) => {
    const key = weldKey(point)
    const existing = index.get(key)
    if (existing !== undefined) return existing
    const id = positions.length
    positions.push([point[0], point[1]])
    index.set(key, id)
    return id
  }

  const rings = polygons.map((points) => {
    const ring: number[] = []
    points.forEach((point) => {
      const id = vertexId(point)
      if (ring[ring.length - 1] === id) return
      ring.push(id)
    })
    if (ring.length > 1 && ring[0] === ring[ring.length - 1]) ring.pop()
    return ring
  })

  return { positions, rings, edgeOwners: buildEdgeOwners(rings) }
}

function buildEdgeOwners(rings: readonly number[][]) {
  const edgeOwners = new Map<string, number[]>()
  rings.forEach((ring, cell) => {
    for (let i = 0; i < ring.length; i += 1) {
      const key = edgeKey(ring[i]!, ring[(i + 1) % ring.length]!)
      const owners = edgeOwners.get(key)
      if (owners) owners.push(cell)
      else edgeOwners.set(key, [cell])
    }
  })
  return edgeOwners
}

/**
 * El recorte del mapa aporta decenas de micro-aristas al perímetro.
 * Las fusiona en tramos largos para que la costa tenga el mismo ritmo que el interior.
 */
function simplifyCoastlines(
  rings: readonly number[][],
  positions: readonly Point[],
  seed: string,
): number[][] {
  const cellsPerVertex = new Map<number, Set<number>>()
  rings.forEach((ring, cell) => {
    ring.forEach((id) => {
      const bucket = cellsPerVertex.get(id) ?? new Set<number>()
      bucket.add(cell)
      cellsPerVertex.set(id, bucket)
    })
  })

  const isShared = (id: number) => (cellsPerVertex.get(id)?.size ?? 0) > 1

  return rings.map((ring, cell) => {
    const anchor = ring.findIndex(isShared)
    if (anchor < 0 || ring.length < 4) return ring

    // Tolerancia propia por región: unas costas quedan quebradas y otras lisas.
    const tolerance = 5 + hash01(`${seed}:detail:${cell}`) * 18

    const ordered = [...ring.slice(anchor), ...ring.slice(0, anchor)]
    const next: number[] = []

    let index = 0
    while (index < ordered.length) {
      const id = ordered[index]!
      next.push(id)
      index += 1

      const chain: number[] = []
      while (index < ordered.length && !isShared(ordered[index]!)) {
        chain.push(ordered[index]!)
        index += 1
      }
      if (chain.length === 0) continue

      const closing = ordered[index % ordered.length]!
      const simplified = simplifyChain(
        [id, ...chain, closing].map((vertex) => positions[vertex]!),
        tolerance,
      )
      // Conserva los ids originales que sobrevivieron al filtro.
      const survivors = new Set(
        simplified.slice(1, -1).map((point) => weldKey(point)),
      )
      chain.forEach((vertex) => {
        if (survivors.has(weldKey(positions[vertex]!))) next.push(vertex)
      })
    }

    return next
  })
}

/**
 * Parte las aristas del perímetro y desplaza los cortes al azar.
 * Sin esto la costa son cuerdas largas de A a B y se lee uniforme, mientras que
 * el interior tiene aristas de todos los largos. Los vértices nuevos pertenecen
 * a una sola celda, así que no tocan ninguna frontera compartida.
 */
function roughenCoastline(
  moved: Point[],
  rings: readonly number[][],
  edgeOwners: ReadonlyMap<string, number[]>,
  seed: string,
): number[][] {
  return rings.map((ring) => {
    if (ring.length < 3) return ring
    const next: number[] = []

    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      next.push(a)

      if ((edgeOwners.get(edgeKey(a, b))?.length ?? 0) !== 1) continue

      const from = moved[a]!
      const to = moved[b]!
      const dx = to[0] - from[0]
      const dy = to[1] - from[1]
      const length = Math.hypot(dx, dy)
      const cuts = length > 150 ? 3 : length > 90 ? 2 : length > 45 ? 1 : 0
      if (cuts === 0) continue

      const nx = -dy / length
      const ny = dx / length

      for (let cut = 1; cut <= cuts; cut += 1) {
        const slot = `${seed}:cut:${a}:${b}:${cut}`
        const drift = (hash01(`${slot}:t`) - 0.5) * 0.22
        const t = Math.min(0.9, Math.max(0.1, cut / (cuts + 1) + drift))
        const push = (hash01(`${slot}:n`) - 0.45) * 2 * length * 0.1
        moved.push([
          from[0] + dx * t + nx * push,
          from[1] + dy * t + ny * push,
        ])
        next.push(moved.length - 1)
      }
    }

    return next
  })
}

/**
 * El recorte del Voronoi tiene que ser convexo, así que sin esto la silueta
 * siempre sería el mismo óvalo. Cada celda del perímetro avanza o se repliega
 * por su cuenta, de modo que el contorno lo termina de dibujar la propia grilla.
 *
 * Solo mueve vértices del borde, y cada vértice se mueve una única vez, así que
 * las fronteras internas siguen compartidas y la teselación no se rompe.
 */
function retreatCoastline(
  moved: Point[],
  rings: readonly number[][],
  edgeOwners: ReadonlyMap<string, number[]>,
  centroids: readonly Point[],
  seed: string,
) {
  const boundaryCells = new Map<number, Set<number>>()
  edgeOwners.forEach((owners, key) => {
    if (owners.length !== 1) return
    const cell = owners[0]!
    key.split('|').forEach((raw) => {
      const vertex = Number(raw)
      const bucket = boundaryCells.get(vertex) ?? new Set<number>()
      bucket.add(cell)
      boundaryCells.set(vertex, bucket)
    })
  })
  if (boundaryCells.size === 0) return

  // Sesgo hacia valores bajos: pocas regiones se hunden mucho, la mayoría apenas.
  const cellRetreat = rings.map(
    (_ring, cell) => Math.pow(hash01(`${seed}:retreat:${cell}`), 1.25) * 1.4,
  )

  boundaryCells.forEach((cells, vertex) => {
    const point = moved[vertex]!
    let targetX = 0
    let targetY = 0
    let reach = Infinity
    let retreat = 0

    cells.forEach((cell) => {
      const centroid = centroids[cell]!
      targetX += centroid[0]
      targetY += centroid[1]
      retreat += cellRetreat[cell]!
      reach = Math.min(reach, Math.hypot(centroid[0] - point[0], centroid[1] - point[1]))
    })

    const count = cells.size
    const dx = targetX / count - point[0]
    const dy = targetY / count - point[1]
    const distance = Math.hypot(dx, dy)
    if (distance < 1e-6) return

    // Valores negativos empujan hacia afuera: algunas regiones sobresalen del resto.
    const amount = retreat / count + (hash01(`${seed}:coast:${vertex}`) - 0.55) * 0.45
    const shift = Math.max(-0.3, Math.min(0.8, amount)) * reach * 0.55

    moved[vertex] = [
      point[0] + (dx / distance) * shift,
      point[1] + (dy / distance) * shift,
    ]
  })
}

type Curve = { c1: Point; c2: Point }

/**
 * La costa se dibuja como una sola spline por tramo, no arista por arista.
 * Cada arista suelta elegía su propia panza y las vecinas se encontraban en
 * ángulo: de ahí las puntas. Con tangentes Catmull-Rom el tramo entero pasa
 * suave por los mismos vértices y conserva el vaivén sin picos.
 */
function smoothCoastCurves(
  rings: readonly number[][],
  edgeOwners: ReadonlyMap<string, number[]>,
  moved: readonly Point[],
  curves: Map<string, Curve>,
) {
  const isCoast = (a: number, b: number) =>
    (edgeOwners.get(edgeKey(a, b))?.length ?? 0) === 1

  rings.forEach((ring) => {
    const count = ring.length
    if (count < 3) return

    for (let i = 0; i < count; i += 1) {
      const a = ring[i]!
      const b = ring[(i + 1) % count]!
      if (!isCoast(a, b)) continue

      const previous = ring[(i - 1 + count) % count]!
      const following = ring[(i + 2) % count]!
      const from = moved[a]!
      const to = moved[b]!
      // Fuera del tramo de costa no hay continuidad que preservar: la tangente
      // cae sobre la cuerda y el encuentro con el interior queda como esquina.
      const before = isCoast(previous, a) ? moved[previous]! : from
      const after = isCoast(b, following) ? moved[following]! : to

      const c1: Point = [
        from[0] + (to[0] - before[0]) / 6,
        from[1] + (to[1] - before[1]) / 6,
      ]
      const c2: Point = [
        to[0] - (after[0] - from[0]) / 6,
        to[1] - (after[1] - from[1]) / 6,
      ]

      curves.set(edgeKey(a, b), a < b ? { c1, c2 } : { c1: c2, c2: c1 })
    }
  })
}

/**
 * Curva cada frontera una sola vez y la reparte a las dos celdas que la comparten.
 * Al ser exactamente la misma curva (invertida de un lado), no hay solapes ni huecos.
 */
export function tessellationPaths(
  polygons: readonly Point[][],
  seed = 'cells',
): string[] {
  if (polygons.length === 0) return []
  if (polygons.length === 1) return [polygonPath(polygons[0]!)]

  const { positions, rings: rawRings } = buildTopology(polygons)
  const rings = simplifyCoastlines(rawRings, positions, seed)
  const edgeOwners = buildEdgeOwners(rings)

  const incidentMin = new Map<number, number>()
  edgeOwners.forEach((_owners, key) => {
    const [a, b] = key.split('|').map(Number) as [number, number]
    const length = Math.hypot(
      positions[a]![0] - positions[b]![0],
      positions[a]![1] - positions[b]![1],
    )
    incidentMin.set(a, Math.min(incidentMin.get(a) ?? Infinity, length))
    incidentMin.set(b, Math.min(incidentMin.get(b) ?? Infinity, length))
  })

  // Un vértice compartido se mueve una sola vez: la malla se deforma sin romperse.
  const moved: Point[] = positions.map((point, id) => {
    const budget = Math.min((incidentMin.get(id) ?? 0) * 0.18, 6)
    if (budget <= 0.01) return [point[0], point[1]]
    const angle = hash01(`${seed}:v:${id}`) * Math.PI * 2
    const radius = hash01(`${seed}:r:${id}`) * budget
    return [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius]
  })

  const centroids = rings.map((ring) =>
    polygonCentroid(ring.map((id) => moved[id]!)),
  )

  retreatCoastline(moved, rings, edgeOwners, centroids, seed)

  const roughRings = roughenCoastline(moved, rings, edgeOwners, seed)
  const roughEdges = buildEdgeOwners(roughRings)

  const curves = new Map<string, Curve>()

  roughEdges.forEach((owners, key) => {
    // La costa se resuelve aparte, encadenada: acá van las fronteras internas.
    if (owners.length === 1) return

    const [a, b] = key.split('|').map(Number) as [number, number]
    const from = moved[a]!
    const to = moved[b]!
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length

    const ratio = 0.1 + hash01(`${seed}:e:${key}`) * 0.12
    const amplitude = Math.min(length * ratio, 32)

    // Curvatura mínima garantizada: sin esto algunas aristas salen casi rectas
    // y el conjunto se lee como polígonos apenas redondeados.
    const swingSeed = hash01(`${seed}:s:${key}`)
    const bend = (swingSeed < 0.5 ? -1 : 1) * (0.5 + Math.abs(swingSeed * 2 - 1) * 0.5)
    const swing = (hash01(`${seed}:w:${key}`) - 0.5) * 0.5
    const offset1 = (bend + swing) * amplitude
    const offset2 = (bend - swing) * amplitude

    curves.set(key, {
      c1: [from[0] + dx / 3 + nx * offset1, from[1] + dy / 3 + ny * offset1],
      c2: [to[0] - dx / 3 + nx * offset2, to[1] - dy / 3 + ny * offset2],
    })
  })

  smoothCoastCurves(roughRings, roughEdges, moved, curves)

  const fixed = (value: number) => value.toFixed(2)

  return roughRings.map((ring) => {
    if (ring.length < 3) return polygonPath(ring.map((id) => moved[id]!))
    const start = moved[ring[0]!]!
    let d = `M${fixed(start[0])},${fixed(start[1])}`
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      const curve = curves.get(edgeKey(a, b))!
      const end = moved[b]!
      const [c1, c2] = a < b ? [curve.c1, curve.c2] : [curve.c2, curve.c1]
      d += `C${fixed(c1[0])},${fixed(c1[1])} ${fixed(c2[0])},${fixed(c2[1])} ${fixed(end[0])},${fixed(end[1])}`
    }
    return `${d}Z`
  })
}

/** Vecindad real: dos celdas son vecinas si comparten una arista, no un vértice suelto. */
export function adjacentIndexes(polygons: readonly Point[][]) {
  const adjacency = polygons.map(() => new Set<number>())
  if (polygons.length < 2) return adjacency

  const { edgeOwners } = buildTopology(polygons)
  edgeOwners.forEach((owners) => {
    for (let i = 0; i < owners.length; i += 1) {
      for (let j = i + 1; j < owners.length; j += 1) {
        const a = owners[i]!
        const b = owners[j]!
        if (a === b) continue
        adjacency[a]!.add(b)
        adjacency[b]!.add(a)
      }
    }
  })

  return adjacency
}
