/** Piso de peso solo para items que ya pasaron el umbral de commits. */
const MIN_COMMIT_WEIGHT = 10

export function computeItemWeights(commitsList: readonly number[]) {
  const weights = commitsList.map((commits) =>
    Math.max(MIN_COMMIT_WEIGHT, Math.max(0, commits)),
  )
  return { weights }
}
