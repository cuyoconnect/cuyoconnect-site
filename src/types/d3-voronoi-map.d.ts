declare module 'd3-voronoi-map' {
  type Point = [number, number]

  type VoronoiMapPolygon<T> = Point[] & {
    site: {
      x: number
      y: number
      weight: number
      originalObject: T
    }
  }

  type VoronoiMapState<T> = {
    ended: boolean
    polygons: Array<VoronoiMapPolygon<T> | undefined>
    iterationCount: number
    convergenceRatio: number
  }

  type VoronoiMapSimulation<T> = {
    weight(accessor: (datum: T) => number): VoronoiMapSimulation<T>
    clip(polygon: Point[]): VoronoiMapSimulation<T>
    maxIterationCount(count: number): VoronoiMapSimulation<T>
    convergenceRatio(ratio: number): VoronoiMapSimulation<T>
    minWeightRatio(ratio: number): VoronoiMapSimulation<T>
    initialPosition(
      accessor: (datum: T, clip: Point[]) => Point | null,
    ): VoronoiMapSimulation<T>
    stop(): VoronoiMapSimulation<T>
    tick(): VoronoiMapSimulation<T>
    state(): VoronoiMapState<T>
  }

  export function voronoiMapSimulation<T>(data: T[]): VoronoiMapSimulation<T>
}
