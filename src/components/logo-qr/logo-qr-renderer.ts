import { LOGO_QR_SUBDIVISION, LOGO_QR_TILES, type LogoQrField } from './logo-qr-field'
import { LOGO_QR_SHADER } from './logo-qr-shader'

type Rgb = readonly [number, number, number]

export type LogoQrColors = {
  /** Fondo de los módulos claros del QR. */
  paper: Rgb
  /** Módulos oscuros del QR. */
  ink: Rgb
  /** Color del logo en las zonas en sombra. */
  logo: Rgb
  /** Color del logo en las zonas iluminadas. */
  logoLight: Rgb
}

export const DEFAULT_LOGO_QR_COLORS: LogoQrColors = {
  paper: [1, 1, 1],
  ink: [0.045, 0.045, 0.05],
  logo: [0.01, 0.01, 0.012],
  logoLight: [0.2, 0.2, 0.22],
}

export type LogoQrRenderer = {
  dispose: () => void
  setFlat: (flat: boolean) => void
  /** Rota el logo con el arrastre del puntero (en píxeles CSS). */
  dragBy: (deltaX: number, deltaY: number) => void
  /** Suelta el arrastre y deja que la inercia termine el giro. */
  endDrag: () => void
}

export type LogoQrRendererOptions = {
  colors?: LogoQrColors
  reducedMotion?: boolean
  onReady?: () => void
  onError?: (error: Error) => void
}

const UNIFORM_FLOATS = 28
const MSAA_SAMPLES = 4
const MAX_CANVAS_SIDE = 2048
const SPRING_RESPONSE_SECONDS = 0.9
const IDLE_PITCH = 0.3
const DRAG_RADIANS_PER_PIXEL = 0.009
const MAX_VIEW_PITCH = 1.35
const MIN_VIEW_PITCH = -1.1
const HOME_DELAY_SECONDS = 2.2
const HOME_RATE = 1.6
const INERTIA_DECAY = 3.2
const TWO_PI = Math.PI * 2

const wrapAngle = (angle: number) => angle - TWO_PI * Math.round(angle / TWO_PI)

const BUFFER_USAGE = { copyDst: 0x0008, storage: 0x0080, uniform: 0x0040 } as const
const TEXTURE_USAGE = { renderAttachment: 0x10 } as const
const SHADER_STAGE = { vertex: 0x1, fragment: 0x2 } as const

/** Resorte críticamente amortiguado: el aplanado llega suave sin rebotar. */
function stepSpring(position: number, velocity: number, target: number, dt: number) {
  const omega = -Math.log(0.01) / SPRING_RESPONSE_SECONDS
  const displacement = position - target
  const decay = Math.exp(-omega * dt)
  const next = (displacement + (velocity + omega * displacement) * dt) * decay
  const nextVelocity = (velocity - omega * (velocity + omega * displacement) * dt) * decay
  return [target + next, nextVelocity] as const
}

function createStorageBuffer(device: GPUDevice, label: string, data: Float32Array) {
  const buffer = device.createBuffer({
    label,
    size: Math.max(16, data.byteLength),
    usage: BUFFER_USAGE.copyDst | BUFFER_USAGE.storage,
    mappedAtCreation: true,
  })
  new Float32Array(buffer.getMappedRange()).set(data)
  buffer.unmap()
  return buffer
}

type Targets = { color: GPUTexture; depth: GPUTexture }

export function mountLogoQr(
  canvas: HTMLCanvasElement,
  field: LogoQrField,
  options: LogoQrRendererOptions = {},
): LogoQrRenderer {
  const colors = options.colors ?? DEFAULT_LOGO_QR_COLORS
  const reducedMotion = options.reducedMotion ?? false

  let closed = false
  let frame = 0
  let device: GPUDevice | undefined
  let context: GPUCanvasContext | undefined
  let targets: Targets | undefined
  let progress = 0
  let velocity = 0
  let target = 0
  let userYaw = 0
  let userPitch = 0
  let spinYaw = 0
  let spinPitch = 0
  let dragging = false
  let lastInteraction = -Infinity
  const startTime = performance.now()
  let lastTime = startTime

  const destroyTargets = () => {
    targets?.color.destroy()
    targets?.depth.destroy()
    targets = undefined
  }

  const start = async () => {
    if (!('gpu' in navigator)) throw new Error('Este navegador no soporta WebGPU.')
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) throw new Error('No hay un adaptador WebGPU disponible.')
    const gpuDevice = await adapter.requestDevice()
    const gpuContext = canvas.getContext('webgpu')
    if (!gpuContext) {
      gpuDevice.destroy()
      throw new Error('No se pudo crear el contexto WebGPU.')
    }
    if (closed) {
      gpuDevice.destroy()
      return
    }
    device = gpuDevice
    context = gpuContext
    const format = navigator.gpu.getPreferredCanvasFormat()

    const module = gpuDevice.createShaderModule({ code: LOGO_QR_SHADER, label: 'logo-qr' })
    const compilation = await module.getCompilationInfo()
    const errors = compilation.messages.filter((message) => message.type === 'error')
    if (errors.length > 0) {
      throw new Error(
        `Falló el shader del QR: ${errors.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join(' | ')}`,
      )
    }

    const visibility = SHADER_STAGE.vertex | SHADER_STAGE.fragment
    const layout = gpuDevice.createBindGroupLayout({
      entries: [
        { binding: 0, visibility, buffer: { type: 'uniform' } },
        { binding: 1, visibility, buffer: { type: 'read-only-storage' } },
      ],
    })
    const pipeline = gpuDevice.createRenderPipeline({
      label: 'logo-qr-pipeline',
      layout: gpuDevice.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
      multisample: { count: MSAA_SAMPLES, alphaToCoverageEnabled: true },
    })

    const uniformBuffer = gpuDevice.createBuffer({
      label: 'logo-qr-uniforms',
      size: UNIFORM_FLOATS * 4,
      usage: BUFFER_USAGE.copyDst | BUFFER_USAGE.uniform,
    })
    const particlesBuffer = createStorageBuffer(gpuDevice, 'logo-qr-particles', field.particles)
    const bindGroup = gpuDevice.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: particlesBuffer } },
      ],
    })

    const uniforms = new Float32Array(UNIFORM_FLOATS)
    const writeColor = (offset: number, color: Rgb) => {
      uniforms[offset] = color[0]
      uniforms[offset + 1] = color[1]
      uniforms[offset + 2] = color[2]
      uniforms[offset + 3] = 1
    }

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.min(MAX_CANVAS_SIDE, Math.max(1, Math.floor(canvas.clientWidth * ratio)))
      const height = Math.min(MAX_CANVAS_SIDE, Math.max(1, Math.floor(canvas.clientHeight * ratio)))
      if (canvas.width === width && canvas.height === height && targets) return
      canvas.width = width
      canvas.height = height
      gpuContext.configure({ device: gpuDevice, format, alphaMode: 'opaque' })
      destroyTargets()
      targets = {
        color: gpuDevice.createTexture({
          size: [width, height],
          format,
          sampleCount: MSAA_SAMPLES,
          usage: TEXTURE_USAGE.renderAttachment,
        }),
        depth: gpuDevice.createTexture({
          size: [width, height],
          format: 'depth24plus',
          sampleCount: MSAA_SAMPLES,
          usage: TEXTURE_USAGE.renderAttachment,
        }),
      }
    }

    const draw = (now: number) => {
      if (closed) return
      const dt = Math.min(0.05, Math.max(0, now - lastTime) / 1000)
      lastTime = now

      if (reducedMotion) {
        progress = target
        velocity = 0
      } else {
        const [nextProgress, nextVelocity] = stepSpring(progress, velocity, target, dt)
        progress = nextProgress
        velocity = nextVelocity
        if (Math.abs(progress - target) < 0.0005 && Math.abs(velocity) < 0.006) {
          progress = target
          velocity = 0
        }
      }

      if (!dragging) {
        if (!reducedMotion) {
          userYaw += spinYaw * dt
          userPitch += spinPitch * dt
          const damping = Math.exp(-INERTIA_DECAY * dt)
          spinYaw *= damping
          spinPitch *= damping
        }
        const resting = Math.hypot(spinYaw, spinPitch) < 0.05
        if (resting && (now - lastInteraction) / 1000 > HOME_DELAY_SECONDS) {
          const pull = 1 - Math.exp(-HOME_RATE * dt)
          userYaw -= wrapAngle(userYaw) * pull
          userPitch -= userPitch * pull
        }
      }
      userPitch = Math.min(MAX_VIEW_PITCH - IDLE_PITCH, Math.max(MIN_VIEW_PITCH - IDLE_PITCH, userPitch))
      if (target === 1 && progress === 1) {
        userYaw = 0
        userPitch = 0
        spinYaw = 0
        spinPitch = 0
      }

      resizeCanvas()
      if (!targets) return
      const time = now / 1000
      const idle = (1 - progress) * (reducedMotion ? 0 : 1)
      const sway = Math.exp(-Math.abs(wrapAngle(userYaw)) * 2.5)

      uniforms[0] = canvas.width / Math.max(1, canvas.height)
      uniforms[1] = time
      uniforms[2] = progress
      uniforms[3] = field.gridSize
      uniforms[4] = reducedMotion ? 99 : (now - startTime) / 2200
      uniforms[5] = 1.78 + 0.1 * progress
      uniforms[6] = LOGO_QR_SUBDIVISION
      uniforms[9] = LOGO_QR_TILES
      uniforms[7] = (Math.sin(time * 0.55) * 0.42 * sway * idle + userYaw * (1 - progress))
      uniforms[8] =
        (IDLE_PITCH + userPitch + Math.sin(time * 0.4) * 0.05 * sway * idle) * (1 - progress) +
        (Math.PI / 2) * progress
      writeColor(12, colors.paper)
      writeColor(16, colors.ink)
      writeColor(20, colors.logo)
      writeColor(24, colors.logoLight)
      gpuDevice.queue.writeBuffer(uniformBuffer, 0, uniforms)

      const encoder = gpuDevice.createCommandEncoder()
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: targets.color.createView(),
            resolveTarget: gpuContext.getCurrentTexture().createView(),
            clearValue: { r: colors.paper[0], g: colors.paper[1], b: colors.paper[2], a: 1 },
            loadOp: 'clear',
            storeOp: 'discard',
          },
        ],
        depthStencilAttachment: {
          view: targets.depth.createView(),
          depthClearValue: 1,
          depthLoadOp: 'clear',
          depthStoreOp: 'discard',
        },
      })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.draw(6, field.particleCount)
      pass.end()
      gpuDevice.queue.submit([encoder.finish()])

      frame = requestAnimationFrame(draw)
    }

    resizeCanvas()
    frame = requestAnimationFrame(draw)
    options.onReady?.()
  }

  start().catch((reason: unknown) => {
    if (closed) return
    const error = reason instanceof Error ? reason : new Error('Falló el render WebGPU del QR.')
    console.error('LogoQr:', error)
    options.onError?.(error)
  })

  return {
    dispose: () => {
      closed = true
      cancelAnimationFrame(frame)
      destroyTargets()
      context?.unconfigure()
      device?.destroy()
      device = undefined
      context = undefined
    },
    setFlat: (flat) => {
      const next = flat ? 1 : 0
      if (next === target) return
      target = next
      if (flat) {
        userYaw = wrapAngle(userYaw)
        spinYaw = 0
        spinPitch = 0
        dragging = false
      }
    },
    dragBy: (deltaX, deltaY) => {
      if (target === 1) return
      dragging = true
      lastInteraction = performance.now()
      const yaw = deltaX * DRAG_RADIANS_PER_PIXEL
      const pitch = deltaY * DRAG_RADIANS_PER_PIXEL
      userYaw += yaw
      userPitch += pitch
      const blend = 0.35
      spinYaw = spinYaw * (1 - blend) + (yaw / 0.016) * blend
      spinPitch = spinPitch * (1 - blend) + (pitch / 0.016) * blend
    },
    endDrag: () => {
      dragging = false
      lastInteraction = performance.now()
    },
  }
}
