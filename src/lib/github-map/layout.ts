import { voronoiMapSimulation } from 'd3-voronoi-map'

import {
  GITHUB_MAP_INK,
  GITHUB_MAP_RAMP,
  rampCellsByWeight,
} from '@/lib/github-map/colors'
import {
  organicClip,
  polygonArea,
  polygonCentroid,
  type Point,
} from '@/lib/github-map/geometry'
import type { VoronoiCell, WeightedMapItem } from '@/lib/github-map/types'

const MAX_TICKS = 250

function unwrapDatum<T extends WeightedMapItem>(value: unknown): T | null {
  const seen = new Set<unknown>()
  let current = value

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const record = current as Record<string, unknown>
    if (typeof record.id === 'string' && typeof record.weight === 'number') {
      return current as T
    }
    current = record.originalData ?? record.data ?? record.originalObject
  }

  return null
}

function hash01(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function initialSitePosition(id: string, clip: Point[]): Point {
  const xs = clip.map((point) => point[0])
  const ys = clip.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const u = 0.18 + hash01(id) * 0.64
  const v = 0.18 + hash01(`${id}:y`) * 0.64
  return [minX + (maxX - minX) * u, minY + (maxY - minY) * v]
}

function runSimulation<T extends WeightedMapItem>(data: T[], clip: Point[]) {
  const simulation = voronoiMapSimulation(data)
    .weight((item) => item.weight)
    .clip(clip)
    .maxIterationCount(MAX_TICKS)
    .convergenceRatio(0.01)
    .minWeightRatio(0.001)
    .initialPosition((item) => initialSitePosition(item.id, clip))
    .stop()

  let state = simulation.state()
  let ticks = 0
  while (!state.ended && ticks < MAX_TICKS) {
    simulation.tick()
    state = simulation.state()
    ticks += 1
  }

  return (state.polygons ?? []).filter(
    (polygon): polygon is NonNullable<typeof polygon> => Boolean(polygon),
  )
}

export function layoutVoronoiCells<T extends WeightedMapItem>(
  items: T[],
  width: number,
  height: number,
  clip: Point[] = organicClip(width, height),
): Array<VoronoiCell<T> & { fill: string; ink: string }> {
  if (items.length === 0 || width < 32 || height < 32) return []

  if (items.length === 1) {
    const [item] = items
    const area = Math.abs(polygonArea(clip))
    return [
      {
        id: item.id,
        points: clip.map((point) => [point[0], point[1]] as Point),
        centroid: polygonCentroid(clip),
        area,
        data: item,
        fill: GITHUB_MAP_RAMP[2],
        ink: GITHUB_MAP_INK,
      },
    ]
  }

  let polygons
  try {
    polygons = runSimulation(items, clip)
  } catch (error) {
    console.error('No se pudo calcular el Voronoi map.', error)
    return []
  }

  const cells = polygons.flatMap((polygon) => {
    const data = unwrapDatum<T>(polygon.site?.originalObject)
    if (!data) return []
    const points = polygon.map((point) => [point[0], point[1]] as Point)
    return [
      {
        id: data.id,
        points,
        centroid: polygonCentroid(points),
        area: Math.abs(polygonArea(points)),
        data,
      },
    ]
  })

  const colors = rampCellsByWeight(cells.map((cell) => cell.data.weight))
  return cells.map((cell, index) => ({
    ...cell,
    fill: colors[index]?.fill ?? GITHUB_MAP_RAMP[0],
    ink: colors[index]?.ink ?? GITHUB_MAP_INK,
  }))
}
