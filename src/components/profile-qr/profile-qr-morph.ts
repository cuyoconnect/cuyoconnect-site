import { createQrMatrix, LOGO_QR_QUIET_ZONE } from '@/components/logo-qr/logo-qr-field'

type Rgb = readonly [number, number, number]

export type QrMorphRect = { x: number; y: number; width: number; height: number }

export type QrMorphSpotPose = QrMorphRect & { rotate: number; scale: number; opacity: number }

export type QrMorphSpot = { from: QrMorphSpotPose; to: QrMorphSpotPose }

export type QrMorphParticle = {
  sx: number
  sy: number
  cx: number
  cy: number
  tx: number
  ty: number
  size: number
  color: Rgb
  delay: number
}

export type QrMorphLayout = {
  /** Desplazamiento vertical del overlay respecto de la tarjeta: si el QR no entra, sobresale parejo arriba y abajo. */
  top: number
  width: number
  height: number
  cell: number
  qr: QrMorphRect
  /** Nombre debajo del QR, alineado al borde visible de los módulos. */
  title: QrMorphRect
  particles: QrMorphParticle[]
  spots: QrMorphSpot[]
}

export type AvatarSampler = (u: number, v: number) => Rgb

const INK: Rgb = [11, 11, 13]
const QR_MAX_SIDE = 460
/** Alto reservado fuera del QR (header del sitio, fila del nombre, paddings) para que entre en la ventana. */
const QR_VIEWPORT_RESERVE = 300
const QR_MIN_SIDE = 220
/**
 * Tipografía del nombre: debe coincidir con `text-xl` / `sm:text-3xl`, `font-semibold` y
 * `leading-tight` de `ProfileQrMorph`.
 */
const TITLE_FONT_SIZE = { base: 20, sm: 30 }
const TITLE_LINE_HEIGHT = 1.25
const TITLE_MAX_LINES = 2
/** Espacio entre el borde visible del QR y el nombre. */
const TITLE_GAP = { base: 12, sm: 20 }
/** En pantallas angostas el borde visible del QR deja poco lugar al nombre: la fila se ensancha hasta acá. */
const TITLE_MIN_WIDTH = 340
/** Fracción de la línea de tiempo que dura el viaje de cada partícula; el resto se reparte como demora. */
const TRAVEL = 0.62
const MAX_DELAY = 1 - TRAVEL
/** Caja de la mancha amarilla en celdas: el trazo ocupa ~85 % × 73 % del viewBox 80×64. */
const SPOT_BOX_CELLS = { width: 12.5, height: 10 }
const FINDER_ROTATIONS = [-4, 5, -7]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function smoothstep(edge0: number, edge1: number, value: number) {
  const k = clamp01((value - edge0) / (edge1 - edge0))
  return k * k * (3 - 2 * k)
}

function easeInOutCubic(k: number) {
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** PRNG con semilla: el mismo perfil arma siempre la misma coreografía, de ida y de vuelta. */
function mulberry32(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tailwind v4 expone colores en oklch: el canvas los normaliza a sRGB. */
function createColorResolver() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const cache = new Map<string, Rgb>()
  return (css: string): Rgb => {
    const cached = cache.get(css)
    if (cached) return cached
    if (!ctx) return INK
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
    const rgb: Rgb = [r, g, b]
    cache.set(css, rgb)
    return rgb
  }
}

export async function loadAvatarSampler(src: string): Promise<AvatarSampler | null> {
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.src = src
    await image.decode()

    const side = 32
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    const scale = Math.max(side / image.naturalWidth, side / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    ctx.drawImage(image, (side - width) / 2, (side - height) / 2, width, height)
    const data = ctx.getImageData(0, 0, side, side).data

    return (u, v) => {
      const x = Math.min(side - 1, Math.max(0, Math.floor(u * side)))
      const y = Math.min(side - 1, Math.max(0, Math.floor(v * side)))
      const i = (y * side + x) * 4
      return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0]
    }
  } catch {
    return null
  }
}

type MorphSource = {
  rect: QrMorphRect
  kind: 'avatar' | 'ink'
  color: Rgb
  weight: number
}

type SourcePoint = { x: number; y: number; size: number; color: Rgb }

function sampleSource(source: MorphSource, avatar: AvatarSampler | null, rand: () => number): SourcePoint {
  const { rect } = source
  if (source.kind === 'avatar') {
    const angle = rand() * Math.PI * 2
    const radius = Math.sqrt(rand()) * 0.48
    const u = 0.5 + Math.cos(angle) * radius
    const v = 0.5 + Math.sin(angle) * radius
    return {
      x: rect.x + u * rect.width,
      y: rect.y + v * rect.height,
      size: 3 + rand() * 2.5,
      color: avatar ? avatar(u, v) : [120, 120, 124],
    }
  }
  return {
    x: rect.x + rand() * rect.width,
    y: rect.y + (0.15 + rand() * 0.75) * rect.height,
    size: 1.8 + rand() * 2.2,
    color: source.color,
  }
}

function countTitleLines(name: string, fontSize: number, fontFamily: string, maxWidth: number) {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return TITLE_MAX_LINES
  ctx.font = `600 ${fontSize}px ${fontFamily}`
  const lines = Math.ceil(ctx.measureText(name).width / maxWidth)
  return Math.min(TITLE_MAX_LINES, Math.max(1, lines))
}

/**
 * Mide la tarjeta (`[data-qr-source]` y `[data-qr-spot]`) y arma el viaje de cada partícula
 * hacia un módulo oscuro del QR. Coordenadas relativas al overlay (`card` desplazado `top`).
 */
export function measureQrMorph(
  card: HTMLElement,
  value: string,
  name: string,
  avatar: AvatarSampler | null,
): QrMorphLayout {
  const cardRect = card.getBoundingClientRect()
  const style = getComputedStyle(card)
  const padX = Number.parseFloat(style.paddingLeft) || 0
  const padTop = Number.parseFloat(style.paddingTop) || 0
  const width = card.clientWidth

  const matrix = createQrMatrix(value)
  const grid = matrix.size + LOGO_QR_QUIET_ZONE * 2
  const maxSide = Math.min(
    width - padX * 2,
    QR_MAX_SIDE,
    Math.max(QR_MIN_SIDE, window.innerHeight - QR_VIEWPORT_RESERVE),
  )
  const cell = Math.max(3, Math.floor(maxSide / grid))
  const side = cell * grid
  const qrX = Math.round((width - side) / 2)
  const quiet = LOGO_QR_QUIET_ZONE * cell
  const visibleSide = side - quiet * 2
  const breakpoint = window.matchMedia('(min-width: 640px)').matches ? 'sm' : 'base'
  const titleWidth = Math.max(visibleSide, Math.min(width - padX * 2, TITLE_MIN_WIDTH))
  const titleFontSize = TITLE_FONT_SIZE[breakpoint]
  const titleLines = countTitleLines(name, titleFontSize, style.fontFamily, titleWidth)
  const titleHeight = Math.ceil(titleLines * titleFontSize * TITLE_LINE_HEIGHT) + 2
  const titleGap = TITLE_GAP[breakpoint]
  const needed = Math.ceil(padTop * 2 + visibleSide + titleGap + titleHeight)
  const height = Math.max(card.offsetHeight, needed)
  const top = Math.round((card.offsetHeight - height) / 2)
  const visibleTop = Math.round(padTop + (height - needed) / 2)
  const qr: QrMorphRect = { x: qrX, y: visibleTop - quiet, width: side, height: side }
  const title: QrMorphRect = {
    x: Math.round((width - titleWidth) / 2),
    y: visibleTop + visibleSide + titleGap,
    width: titleWidth,
    height: titleHeight,
  }

  const rand = mulberry32(hashString(value))
  const relativeRect = (element: Element): QrMorphRect => {
    const rect = element.getBoundingClientRect()
    return { x: rect.left - cardRect.left, y: rect.top - cardRect.top - top, width: rect.width, height: rect.height }
  }
  const cellCenter = (row: number, col: number) => ({
    x: qr.x + (col + LOGO_QR_QUIET_ZONE) * cell + cell / 2,
    y: qr.y + (row + LOGO_QR_QUIET_ZONE) * cell + cell / 2,
  })

  const targets: Array<{ x: number; y: number }> = []
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (matrix.isDark(row, col)) targets.push(cellCenter(row, col))
    }
  }

  const resolveColor = createColorResolver()
  const sources: MorphSource[] = Array.from(card.querySelectorAll<HTMLElement>('[data-qr-source]'))
    .map((element) => {
      const rect = relativeRect(element)
      return {
        rect,
        kind: element.dataset.qrSource === 'avatar' ? ('avatar' as const) : ('ink' as const),
        color: resolveColor(getComputedStyle(element).color),
        weight: rect.width * rect.height,
      }
    })
    .filter((source) => source.weight > 0)

  const points: SourcePoint[] = []
  const totalWeight = sources.reduce((sum, source) => sum + source.weight, 0)
  sources.forEach((source, index) => {
    const remaining = targets.length - points.length
    const share = index === sources.length - 1 ? remaining : Math.round((targets.length * source.weight) / totalWeight)
    for (let i = 0; i < Math.min(share, remaining); i += 1) points.push(sampleSource(source, avatar, rand))
  })
  while (points.length < targets.length) {
    points.push({
      x: qr.x + side / 2 + (rand() - 0.5) * side * 0.4,
      y: qr.y + side / 2 + (rand() - 0.5) * side * 0.4,
      size: 2,
      color: INK,
    })
  }

  const sortedPoints = points
    .map((point) => ({ point, key: point.x + (rand() - 0.5) * 60 }))
    .sort((a, b) => a.key - b.key)
    .map(({ point }) => point)
  const sortedTargets = targets
    .map((target) => ({ target, key: target.x + (rand() - 0.5) * cell * 8 }))
    .sort((a, b) => a.key - b.key)
    .map(({ target }) => target)

  const particles: QrMorphParticle[] = sortedTargets.map((target, index) => {
    const source = sortedPoints[index]!
    const dx = target.x - source.x
    const dy = target.y - source.y
    const bend = (rand() - 0.5) * 0.7
    return {
      sx: source.x,
      sy: source.y,
      cx: (source.x + target.x) / 2 - dy * bend,
      cy: (source.y + target.y) / 2 + dx * bend - Math.hypot(dx, dy) * 0.08,
      tx: target.x,
      ty: target.y,
      size: source.size,
      color: source.color,
      delay: (0.55 * rand() + 0.45 * clamp01(source.y / height)) * MAX_DELAY,
    }
  })

  const spotWidth = SPOT_BOX_CELLS.width * cell
  const spotHeight = SPOT_BOX_CELLS.height * cell
  const finderOffset = 3
  const finders = [
    cellCenter(finderOffset, finderOffset),
    cellCenter(finderOffset, matrix.size - 1 - finderOffset),
    cellCenter(matrix.size - 1 - finderOffset, finderOffset),
  ].map<QrMorphSpotPose>((center, index) => ({
    x: center.x - spotWidth / 2,
    y: center.y - spotHeight / 2,
    width: spotWidth,
    height: spotHeight,
    rotate: FINDER_ROTATIONS[index] ?? 0,
    scale: 1,
    opacity: 1,
  }))

  const origins = Array.from(card.querySelectorAll('[data-qr-spot]')).map<QrMorphSpotPose>((element) => ({
    ...relativeRect(element),
    rotate: -6,
    scale: 0.95,
    opacity: 0.95,
  }))
  const unused = new Set(origins.keys())
  const centerOf = (pose: QrMorphRect) => ({ x: pose.x + pose.width / 2, y: pose.y + pose.height / 2 })
  const spots: QrMorphSpot[] = finders.map((to) => {
    const target = centerOf(to)
    let nearest = -1
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const index of unused) {
      const origin = centerOf(origins[index]!)
      const distance = Math.hypot(origin.x - target.x, origin.y - target.y)
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    }
    if (nearest === -1) return { from: { ...to, scale: 0.2, opacity: 0 }, to }
    unused.delete(nearest)
    return { from: origins[nearest]!, to }
  })
  const qrCenter = centerOf(qr)
  for (const index of unused) {
    const from = origins[index]!
    spots.push({
      from,
      to: {
        ...from,
        x: qrCenter.x - from.width / 2,
        y: qrCenter.y - from.height / 2,
        rotate: 0,
        scale: 0.2,
        opacity: 0,
      },
    })
  }

  return { top, width, height, cell, qr, title, particles, spots }
}

export function prepareQrMorphCanvas(canvas: HTMLCanvasElement, layout: QrMorphLayout) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = Math.round(layout.width * dpr)
  canvas.height = Math.round(layout.height * dpr)
  const ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

/** `t = 0` es la tarjeta, `t = 1` el QR terminado (módulos alineados a píxel entero). */
export function drawQrMorph(ctx: CanvasRenderingContext2D, layout: QrMorphLayout, t: number) {
  ctx.clearRect(0, 0, layout.width, layout.height)
  const alpha = smoothstep(0, 0.14, t)
  if (alpha <= 0) return

  const finalSize = layout.cell + 0.4
  ctx.globalAlpha = alpha
  for (const particle of layout.particles) {
    const k = clamp01((t - particle.delay) / TRAVEL)
    const e = easeInOutCubic(k)
    const inv = 1 - e
    const x = inv * inv * particle.sx + 2 * inv * e * particle.cx + e * e * particle.tx
    const y = inv * inv * particle.sy + 2 * inv * e * particle.cy + e * e * particle.ty
    const size = particle.size + (finalSize - particle.size) * e
    const mix = smoothstep(0.15, 0.85, k)
    const r = Math.round(particle.color[0] + (INK[0] - particle.color[0]) * mix)
    const g = Math.round(particle.color[1] + (INK[1] - particle.color[1]) * mix)
    const b = Math.round(particle.color[2] + (INK[2] - particle.color[2]) * mix)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x - size / 2, y - size / 2, size, size)
  }
  ctx.globalAlpha = 1
}

export function animateQrMorph({
  canvas,
  layout,
  from,
  to,
  duration,
  onUpdate,
  onDone,
}: {
  canvas: HTMLCanvasElement
  layout: QrMorphLayout
  from: number
  to: number
  duration: number
  onUpdate: (t: number) => void
  onDone: () => void
}) {
  const ctx = prepareQrMorphCanvas(canvas, layout)
  if (!ctx || duration <= 0 || from === to) {
    if (ctx) drawQrMorph(ctx, layout, to)
    onUpdate(to)
    onDone()
    return () => {}
  }

  let frameId = 0
  const start = performance.now()
  const frame = (now: number) => {
    const k = Math.min(1, (now - start) / duration)
    const t = from + (to - from) * k
    drawQrMorph(ctx, layout, t)
    onUpdate(t)
    if (k < 1) frameId = requestAnimationFrame(frame)
    else onDone()
  }
  frameId = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(frameId)
}
