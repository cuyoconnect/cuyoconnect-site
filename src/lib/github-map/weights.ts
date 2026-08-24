export const LOD_AVATAR_AREA = 1600
export const LOD_NAME_AREA = 5200

/** Piso de peso solo para items que ya pasaron el umbral de commits. */
const MIN_COMMIT_WEIGHT = 10

export function computeItemWeights(commitsList: readonly number[]) {
  const weights = commitsList.map((commits) =>
    Math.max(MIN_COMMIT_WEIGHT, Math.max(0, commits)),
  )
  return { weights }
}

export function cellLod(area: number, cameraScale: number): 'color' | 'avatar' | 'name' {
  const visibleArea = area * cameraScale * cameraScale
  if (visibleArea >= LOD_NAME_AREA) return 'name'
  if (visibleArea >= LOD_AVATAR_AREA) return 'avatar'
  return 'color'
}
