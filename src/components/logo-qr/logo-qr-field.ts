import { create as createQr } from 'qrcode'

/** Subceldas por módulo QR. */
export const LOGO_QR_SUBDIVISION = 4
/** Cada celda del QR se reparte entre TILES x TILES partículas: más definición para el logo. */
export const LOGO_QR_TILES = 4
/** Módulos vacíos alrededor del QR para que escanee bien sobre fondo blanco. */
export const LOGO_QR_QUIET_ZONE = 2
/** Fracción del lado del QR que ocupa el logo. */
const LOGO_COVERAGE = 0.92
/** Radio (en celdas del QR) del bisel redondeado del logo. */
const BEVEL_RADIUS = 9
const FLOATS_PER_PARTICLE = 12

export type LogoQrField = {
  /** Lado de la grilla del QR en celdas (incluye zona de silencio). */
  gridSize: number
  /** Cantidad de módulos del QR (sin zona de silencio). */
  moduleCount: number
  particleCount: number
  /**
   * 3 vec4 por partícula:
   *  A = posición en el logo (unidades de partícula) + orden de viaje,
   *  B = destino en el QR (celdas) + máscara de vecinos + subcelda y tesela,
   *  C = normal suave del logo + 1 si la partícula forma parte del QR.
   */
  particles: Float32Array
}

export type QrMatrix = {
  size: number
  isDark: (row: number, col: number) => boolean
}

export type LogoQrFieldOptions = {
  /** Espesor máximo del logo, en celdas del QR. */
  thickness?: number
}

export function createQrMatrix(value: string): QrMatrix {
  const qr = createQr(value, { errorCorrectionLevel: 'M' })
  const { size } = qr.modules
  return {
    size,
    isDark: (row, col) =>
      row >= 0 && col >= 0 && row < size && col < size && qr.modules.get(row, col) === 1,
  }
}

/**
 * Dibuja el logo en un canvas chico y devuelve una máscara binaria (1 = tinta).
 * Usa alfa y luminancia para que funcione tanto con fondo transparente como blanco.
 */
export async function loadLogoMask(src: string, side: number): Promise<Uint8Array> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('No se pudo leer el logo.')

  const ratio = image.naturalWidth / image.naturalHeight
  const drawWidth = ratio >= 1 ? side : side * ratio
  const drawHeight = ratio >= 1 ? side / ratio : side
  context.clearRect(0, 0, side, side)
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    (side - drawWidth) / 2,
    (side - drawHeight) / 2,
    drawWidth,
    drawHeight,
  )

  const { data } = context.getImageData(0, 0, side, side)
  const mask = new Uint8Array(side * side)
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4
    const alpha = data[offset + 3] / 255
    const luminance =
      (data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722) / 255
    mask[index] = alpha * (1 - luminance) > 0.5 ? 1 : 0
  }
  return mask
}

export function logoMaskSide(moduleCount: number): number {
  return Math.round(moduleCount * LOGO_QR_SUBDIVISION * LOGO_COVERAGE * LOGO_QR_TILES)
}

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Distancia (en celdas) de cada píxel de tinta al fondo más cercano, con chamfer 3-4. */
function distanceToBackground(mask: Uint8Array, side: number): Float32Array {
  const diagonal = Math.SQRT2
  const distance = new Float32Array(side * side)
  const at = (row: number, col: number) =>
    row < 0 || col < 0 || row >= side || col >= side ? 0 : distance[row * side + col]

  for (let row = 0; row < side; row += 1) {
    for (let col = 0; col < side; col += 1) {
      const index = row * side + col
      if (mask[index] === 0) continue
      distance[index] = Math.min(
        at(row, col - 1) + 1,
        at(row - 1, col) + 1,
        at(row - 1, col - 1) + diagonal,
        at(row - 1, col + 1) + diagonal,
        1e6,
      )
    }
  }
  for (let row = side - 1; row >= 0; row -= 1) {
    for (let col = side - 1; col >= 0; col -= 1) {
      const index = row * side + col
      if (mask[index] === 0) continue
      distance[index] = Math.min(
        distance[index],
        at(row, col + 1) + 1,
        at(row + 1, col) + 1,
        at(row + 1, col + 1) + diagonal,
        at(row + 1, col - 1) + diagonal,
      )
    }
  }
  return distance
}

type LogoVoxel = {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  key: number
}

type QrCell = {
  x: number
  z: number
  neighbors: number
  sub: number
  key: number
}

function blurHeights(source: Float32Array, side: number, passes: number) {
  let current = source
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Float32Array(side * side)
    for (let row = 0; row < side; row += 1) {
      for (let col = 0; col < side; col += 1) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const r = row + dy
            const c = col + dx
            if (r >= 0 && c >= 0 && r < side && c < side) sum += current[r * side + c]
          }
        }
        next[row * side + col] = sum / 9
      }
    }
    current = next
  }
  return current
}

/** Convierte la silueta en un sólido inflado y devuelve los puntos visibles con su normal suave. */
function buildLogoVoxels(mask: Uint8Array, side: number, thickness: number, random: () => number) {
  const distance = distanceToBackground(mask, side)
  const height = new Float32Array(side * side)
  const columns = new Int16Array(side * side)

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 0) continue
    const x = Math.min(1, Math.max(0, (distance[index] - 0.5) / (BEVEL_RADIUS * LOGO_QR_TILES)))
    const profile = Math.sqrt(1 - (1 - x) * (1 - x))
    height[index] = 1.5 + (thickness - 1.5) * profile
    columns[index] = Math.max(2, Math.round(height[index]))
  }

  const smooth = blurHeights(height, side, 4)
  const smoothAt = (row: number, col: number) =>
    row < 0 || col < 0 || row >= side || col >= side ? 0 : smooth[row * side + col]
  const columnAt = (row: number, col: number) =>
    row < 0 || col < 0 || row >= side || col >= side ? 0 : columns[row * side + col]

  const voxels: LogoVoxel[] = []
  for (let row = 0; row < side; row += 1) {
    for (let col = 0; col < side; col += 1) {
      const index = row * side + col
      const column = columns[index]
      if (column === 0) continue

      const slopeX = (smoothAt(row, col + 1) - smoothAt(row, col - 1)) * 0.5
      const slopeY = (smoothAt(row - 1, col) - smoothAt(row + 1, col)) * 0.5

      const lowestNeighbor = Math.min(
        columnAt(row, col - 1),
        columnAt(row, col + 1),
        columnAt(row - 1, col),
        columnAt(row + 1, col),
      )
      // En pendientes suaves alcanza con la capa superior; solo las paredes reales llevan capas laterales.
      const firstVisible = column - lowestNeighbor > 2 ? Math.max(0, lowestNeighbor) : column - 1

      for (let layer = firstVisible; layer < column; layer += 1) {
        const isTop = layer === column - 1
        const nx = -slopeX
        const ny = -slopeY
        const nz = 1
        const length = Math.hypot(nx, ny, nz)

        const x = col - side / 2 + 0.5 + (random() - 0.5) * 0.5
        const y = side / 2 - row - 0.5 + (random() - 0.5) * 0.5
        const z = isTop ? height[index] - 0.35 : layer + 0.5
        const key = (col + 0.5) / side + (random() - 0.5) * 0.08
        voxels.push({ x, y, z, nx: nx / length, ny: ny / length, nz: nz / length, key })
        voxels.push({ x, y, z: -z, nx: nx / length, ny: ny / length, nz: -nz / length, key })
      }
    }
  }
  return voxels
}

function buildQrCells(matrix: QrMatrix, random: () => number) {
  const sub = LOGO_QR_SUBDIVISION
  const quiet = LOGO_QR_QUIET_ZONE
  const gridSize = (matrix.size + quiet * 2) * sub
  const cells: QrCell[] = []

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const moduleRow = Math.floor(row / sub) - quiet
      const moduleCol = Math.floor(col / sub) - quiet
      if (!matrix.isDark(moduleRow, moduleCol)) continue

      let neighbors = 0
      if (matrix.isDark(moduleRow - 1, moduleCol)) neighbors |= 1
      if (matrix.isDark(moduleRow, moduleCol + 1)) neighbors |= 2
      if (matrix.isDark(moduleRow + 1, moduleCol)) neighbors |= 4
      if (matrix.isDark(moduleRow, moduleCol - 1)) neighbors |= 8

      for (let tileRow = 0; tileRow < LOGO_QR_TILES; tileRow += 1) {
        for (let tileCol = 0; tileCol < LOGO_QR_TILES; tileCol += 1) {
          cells.push({
            x: col - gridSize / 2 + (tileCol + 0.5) / LOGO_QR_TILES,
            z: row - gridSize / 2 + (tileRow + 0.5) / LOGO_QR_TILES,
            neighbors,
            sub: (col % sub) | ((row % sub) << 4) | (tileCol << 8) | (tileRow << 10),
            key: (col + (tileCol + 0.5) / LOGO_QR_TILES) / gridSize + (random() - 0.5) * 0.08,
          })
        }
      }
    }
  }
  return { cells, gridSize }
}

/**
 * Empareja cada voxel del logo con una celda oscura del QR por cuantiles de la coordenada x,
 * así los píxeles viajan en una ola en vez de cruzarse al azar.
 */
export function createLogoQrField(
  matrix: QrMatrix,
  logoMask: Uint8Array,
  options: LogoQrFieldOptions = {},
): LogoQrField {
  const thickness = ((options.thickness ?? 16) * LOGO_QR_TILES) / 2
  const random = createRandom(0x51ed)
  const logoSide = Math.round(Math.sqrt(logoMask.length))

  const voxels = buildLogoVoxels(logoMask, logoSide, thickness, random)
  const { cells, gridSize } = buildQrCells(matrix, random)
  voxels.sort((first, second) => first.key - second.key)
  cells.sort((first, second) => first.key - second.key)

  const particleCount = Math.max(voxels.length, cells.length)
  const particles = new Float32Array(particleCount * FLOATS_PER_PARTICLE)
  let lastCell = -1

  for (let index = 0; index < particleCount; index += 1) {
    const voxel = voxels[Math.floor((index * voxels.length) / particleCount)]
    const cellIndex = Math.floor((index * cells.length) / particleCount)
    const cell = cells[cellIndex]
    const isTarget = cellIndex !== lastCell
    lastCell = cellIndex

    const offset = index * FLOATS_PER_PARTICLE
    particles[offset] = voxel.x
    particles[offset + 1] = voxel.y
    particles[offset + 2] = voxel.z
    particles[offset + 3] = Math.min(1, Math.max(0, voxel.key * 0.6 + random() * 0.4))
    particles[offset + 4] = cell.x
    particles[offset + 5] = cell.z
    particles[offset + 6] = cell.neighbors
    particles[offset + 7] = cell.sub
    particles[offset + 8] = voxel.nx
    particles[offset + 9] = voxel.ny
    particles[offset + 10] = voxel.nz
    particles[offset + 11] = isTarget ? 1 : 0
  }

  return { gridSize, moduleCount: matrix.size, particleCount, particles }
}
