import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import useMeasure from 'react-use-measure'
import { GitCommitVertical } from 'lucide-react'

import { ProjectLinkOrbs } from '@/components/github-map/ProjectLinkOrbs'
import {
  LinkPreviewCard,
  prefetchLinkPreviews,
  prioritizeLinkPreview,
} from '@/components/ui/link-preview'
import {
  GITHUB_MAP_BUBBLE_SURFACES,
  GITHUB_MAP_EDGE,
  GITHUB_MAP_EDGE_ACTIVE,
  GITHUB_MAP_HAIRLINE,
  GITHUB_MAP_INK,
  sequentialFillsByRank,
} from '@/lib/github-map/colors'
import {
  avatarForProject,
  fitLabelInCircle,
  githubSocialImage,
  memberAvatarMap,
  memberLinksMap,
  projectLinksFor,
  projectsFromPayload,
  repoOwner,
  repoShortName,
} from '@/lib/github-map/project-display'
import { layoutBubbleGraph } from '@/lib/github-map/bubble-layout'
import { useGithubMapData } from '@/lib/github-map/use-github-map-data'
import { GITHUB_MAP_MIN_COMMITS, type GithubMapProject } from '@/lib/github-map/types'
import { computeItemWeights } from '@/lib/github-map/weights'
import { cn } from '@/lib/utils'

const EASE = [0.33, 1, 0.68, 1] as const
const CARD_WIDTH = 240
const CARD_HEIGHT = 324
const CARD_GAP = 18
const CARD_SPRING = { stiffness: 520, damping: 42, mass: 0.5 } as const
const STAGE_ASPECT = 0.52
const STAGE_MIN_HEIGHT = 380
const STAGE_MAX_HEIGHT = 640
/**
 * Umbral propio del racimo: con el mínimo del mapa entran demasiados repos y
 * las burbujas se achican hasta que ninguna etiqueta se lee.
 */
const BUBBLE_MIN_COMMITS = 20
/** La arista se mete un pelo bajo el borde para que no quede una junta visible. */
const EDGE_TUCK = 1

type EdgeLine = {
  id: string
  source: string
  target: string
  x1: number
  y1: number
  x2: number
  y2: number
}

type BubbleItem = {
  id: string
  fill: string
  ink: string
  project: GithubMapProject
  x: number
  y: number
  r: number
  label: string
  fontPx: number
  lines: string[]
}

export function GitHubProjectsBubblesViewer({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [stageRef, bounds] = useMeasure()
  const { payload, errorMessage, isLoading } = useGithubMapData()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const hoverClearRef = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const stageElRef = useRef<HTMLDivElement | null>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const followX = useSpring(pointerX, CARD_SPRING)
  const followY = useSpring(pointerY, CARD_SPRING)
  const [cardBelow, setCardBelow] = useState(false)

  const placeCard = useCallback(
    (x: number, y: number, stageWidth: number) => {
      const half = CARD_WIDTH / 2
      pointerX.set(Math.min(Math.max(x, half), Math.max(stageWidth - half, half)))
      pointerY.set(y)
      setCardBelow(y < CARD_HEIGHT + CARD_GAP)
    },
    [pointerX, pointerY],
  )

  const trackPointer = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (pinnedId) return
      const rect = event.currentTarget.getBoundingClientRect()
      placeCard(event.clientX - rect.left, event.clientY - rect.top, rect.width)
    },
    [pinnedId, placeCard],
  )

  /** Sin puntero (teclado) la card se ancla al centro de la burbuja. */
  const placeCardAtClient = useCallback(
    (point: { x: number; y: number } | null, fallback: [number, number]) => {
      const rect = stageElRef.current?.getBoundingClientRect()
      if (!rect) return
      if (!point) {
        placeCard(fallback[0], fallback[1], rect.width)
        return
      }
      placeCard(point.x - rect.left, point.y - rect.top, rect.width)
    },
    [placeCard],
  )

  useEffect(() => {
    if (!pinnedId) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as (Node & Element) | null
      if (target && cardRef.current?.contains(target)) return
      if (target?.closest?.('[data-bubble-node]')) return
      setPinnedId(null)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPinnedId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pinnedId])

  const setHoveredStable = useCallback((id: string | null) => {
    if (hoverClearRef.current != null) {
      window.clearTimeout(hoverClearRef.current)
      hoverClearRef.current = null
    }
    if (id !== null) {
      setHoveredId(id)
      return
    }
    hoverClearRef.current = window.setTimeout(() => {
      setHoveredId(null)
      hoverClearRef.current = null
    }, 140)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverClearRef.current != null) {
        window.clearTimeout(hoverClearRef.current)
      }
    }
  }, [])

  // La primera medición puede caer antes de que Inter esté disponible, y con
  // métricas de otra fuente los saltos de línea quedan mal calculados.
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const projects = useMemo(
    () =>
      projectsFromPayload(payload).filter(
        (project) => project.commits >= BUBBLE_MIN_COMMITS,
      ),
    [payload],
  )
  const memberAvatars = useMemo(() => memberAvatarMap(payload), [payload])
  const memberLinks = useMemo(() => memberLinksMap(payload), [payload])

  const stageWidth = Math.max(bounds.width, 0)
  const stageHeight =
    stageWidth > 0
      ? Math.round(
          Math.min(
            Math.max(stageWidth * STAGE_ASPECT, STAGE_MIN_HEIGHT),
            STAGE_MAX_HEIGHT,
          ),
        )
      : 0

  const graph = useMemo(() => {
    if (projects.length === 0 || stageWidth < 64 || stageHeight < 64) {
      return { items: [] as BubbleItem[], edges: [] as EdgeLine[] }
    }

    const { weights } = computeItemWeights(projects.map((project) => project.commits))
    const palette = sequentialFillsByRank(weights, GITHUB_MAP_BUBBLE_SURFACES)

    const byId = new Map(
      projects.map((project, index) => [
        project.fullName,
        {
          id: project.fullName,
          fill: palette[index] ?? GITHUB_MAP_BUBBLE_SURFACES[0],
          ink: GITHUB_MAP_INK,
          project,
        },
      ]),
    )

    const layout = layoutBubbleGraph(
      projects.map((project, index) => ({
        id: project.fullName,
        value: weights[index] ?? GITHUB_MAP_MIN_COMMITS,
      })),
      stageWidth,
      stageHeight,
    )

    const items = layout.nodes.flatMap<BubbleItem>((node) => {
      const base = byId.get(node.id)
      if (!base) return []
      const label = repoShortName(base.project.fullName)
      // Se resuelve acá y no al pintar: medir texto necesita el canvas y no
      // tiene por qué repetirse en cada hover.
      const fitted = fitLabelInCircle(label, node.r)
      return [
        {
          ...base,
          x: node.x,
          y: node.y,
          r: node.r,
          label,
          fontPx: fitted.fontPx,
          lines: fitted.lines,
        },
      ]
    })

    const positions = new Map(items.map((item) => [item.id, item]))
    const edges = layout.edges.flatMap<EdgeLine>((edge) => {
      const source = positions.get(edge.source)
      const target = positions.get(edge.target)
      if (!source || !target) return []

      // De borde a borde, no de centro a centro: al atenuar un nodo su fondo
      // queda translúcido y una arista que lo cruzara se vería por debajo.
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.hypot(dx, dy) || 1
      const unitX = dx / distance
      const unitY = dy / distance

      return [
        {
          id: `${source.id}--${target.id}`,
          source: source.id,
          target: target.id,
          x1: source.x + unitX * (source.r - EDGE_TUCK),
          y1: source.y + unitY * (source.r - EDGE_TUCK),
          x2: target.x - unitX * (target.r - EDGE_TUCK),
          y2: target.y - unitY * (target.r - EDGE_TUCK),
        },
      ]
    })

    return { items, edges }
  }, [fontsReady, projects, stageHeight, stageWidth])

  const { items, edges } = graph

  const avatarFor = useCallback(
    (project: GithubMapProject) => avatarForProject(project, memberAvatars),
    [memberAvatars],
  )

  useEffect(() => {
    if (projects.length === 0) return
    const byActivity = [...projects].sort((a, b) => b.commits - a.commits)
    prefetchLinkPreviews(
      byActivity.flatMap((project) => {
        const avatar = avatarFor(project)
        return [
          avatar,
          project.imageUrl,
          // Solo se pide cuando de verdad va a hacer falta: si el proyecto ya
          // tiene retrato propio, la imagen de GitHub nunca llega a mostrarse.
          avatar || project.imageUrl
            ? null
            : githubSocialImage(project.fullName),
          project.faviconUrl,
        ]
      }),
    )
  }, [avatarFor, projects])

  const activeId = pinnedId ?? hoveredId
  const activeItem = items.find((item) => item.id === activeId) ?? null
  const hoveredOwner = activeItem ? repoOwner(activeItem.project.fullName) : ''
  const hoveredAvatar = activeItem ? avatarFor(activeItem.project) : null
  const hoveredLinks = activeItem
    ? projectLinksFor(activeItem.project, memberLinks)
    : []

  return (
    <div className={cn('relative min-w-0', className)}>
      <div
        ref={(node) => {
          stageRef(node)
          stageElRef.current = node
        }}
        className="relative w-full min-w-0"
        style={{
          height: stageHeight > 0 ? stageHeight : undefined,
          minHeight: '22rem',
        }}
        onMouseMove={trackPointer}
      >
        {isLoading ? (
          <div className="absolute inset-[8%] z-[2] animate-pulse rounded-[45%] bg-neutral-100" />
        ) : errorMessage ? (
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            {errorMessage}
          </p>
        ) : items.length === 0 && stageWidth > 0 ? (
          // El ancho recién se conoce tras medir: sin esa guarda, el primer
          // frame anuncia que no hay proyectos aunque los haya.
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            Todavía no hay proyectos publicados con suficiente actividad.
          </p>
        ) : (
          <div className="absolute inset-0 z-[2]">
            <svg
              className="pointer-events-none absolute inset-0"
              width={stageWidth}
              height={stageHeight}
              viewBox={`0 0 ${stageWidth} ${stageHeight}`}
              aria-hidden
            >
              {edges.map((edge) => {
                const linked =
                  activeId === edge.source || activeId === edge.target
                return (
                  <motion.line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    // Filete, no cable: la conexión sugiere el racimo y se
                    // corre del paso cuando mirás un proyecto.
                    stroke={linked ? GITHUB_MAP_EDGE_ACTIVE : GITHUB_MAP_EDGE}
                    strokeLinecap="round"
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: activeId && !linked ? 0.35 : 1,
                      strokeWidth: linked ? 2 : 1.25,
                    }}
                    transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
                  />
                )
              })}
            </svg>

            {items.map((item, index) => (
              <BubbleNode
                key={item.id}
                item={item}
                index={index}
                hovered={activeId === item.id}
                dimmed={activeId !== null && activeId !== item.id}
                reduceMotion={Boolean(reduceMotion)}
                onHoverStart={() => {
                  prioritizeLinkPreview(
                    avatarFor(item.project) ??
                      item.project.imageUrl ??
                      item.project.faviconUrl,
                  )
                  setHoveredStable(item.id)
                }}
                onHoverEnd={() => setHoveredStable(null)}
                onSelect={(point) => {
                  if (pinnedId === item.id) {
                    setPinnedId(null)
                    return
                  }
                  placeCardAtClient(point, [item.x, item.y])
                  setPinnedId(item.id)
                }}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {activeItem ? (
            <motion.div
              key="project-card"
              ref={cardRef}
              data-card-root
              className="pointer-events-none absolute left-0 top-0 z-10"
              style={
                reduceMotion
                  ? { x: pointerX, y: pointerY }
                  : { x: followX, y: followY }
              }
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
            >
              <div
                className={pinnedId ? 'pointer-events-auto' : 'pointer-events-none'}
                style={{
                  transform: cardBelow
                    ? `translate(-50%, ${CARD_GAP}px)`
                    : `translate(-50%, calc(-100% - ${CARD_GAP}px))`,
                }}
              >
                <LinkPreviewCard
                  url={activeItem.project.homepageUrl}
                  title={repoShortName(activeItem.project.fullName)}
                  meta={
                    <>
                      <GitCommitVertical className="h-4 w-4 shrink-0" aria-hidden />
                      {activeItem.project.commits} commits
                    </>
                  }
                  imageUrl={
                    activeItem.project.imageUrl ??
                    githubSocialImage(activeItem.project.fullName)
                  }
                  faviconUrl={activeItem.project.faviconUrl}
                  avatarUrl={hoveredAvatar}
                  avatarLabel={hoveredOwner}
                  interactive={Boolean(pinnedId)}
                />
                <ProjectLinkOrbs links={hoveredLinks} visible={Boolean(pinnedId)} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function BubbleNode({
  item,
  index,
  hovered,
  dimmed,
  reduceMotion,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  item: BubbleItem
  index: number
  hovered: boolean
  dimmed: boolean
  reduceMotion: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onSelect: (point: { x: number; y: number } | null) => void
}) {
  const diameter = item.r * 2

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(null)
    }
  }

  return (
    <motion.button
      type="button"
      data-bubble-node
      aria-label={`${item.label}, ${item.project.commits} commits`}
      className={cn(
        'absolute flex cursor-pointer flex-col items-center justify-center rounded-full text-center outline-none',
        'focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
      )}
      style={{
        left: item.x - item.r,
        top: item.y - item.r,
        width: diameter,
        height: diameter,
        // Relleno plano: un degradado haría que el mismo valor se lea distinto
        // según qué parte del disco mires.
        background: item.fill,
        // La superficie se separa del fondo por profundidad, no por contorno.
        border: `1px solid ${GITHUB_MAP_HAIRLINE}`,
        zIndex: hovered ? 3 : 2,
        boxShadow: hovered
          ? '0 2px 4px rgba(29,29,31,0.05), 0 18px 36px rgba(29,29,31,0.13)'
          : '0 1px 2px rgba(29,29,31,0.04), 0 6px 16px rgba(29,29,31,0.05)',
        transition: 'box-shadow 220ms cubic-bezier(0.33, 1, 0.68, 1)',
      }}
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{
        scale: hovered ? 1.04 : 1,
        opacity: dimmed ? 0.4 : 1,
      }}
      transition={{
        scale: { type: 'spring', stiffness: 340, damping: 24, mass: 0.6 },
        opacity: { duration: 0.22, ease: EASE },
        default: { delay: reduceMotion ? 0 : index * 0.02 },
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={(event) => onSelect({ x: event.clientX, y: event.clientY })}
      onKeyDown={onKeyDown}
    >
      <span
        title={item.label}
        className="font-data font-medium"
        style={{
          fontSize: item.fontPx,
          lineHeight: 1.12,
          letterSpacing: '-0.012em',
          color: item.ink,
        }}
      >
        {item.lines.map((line, index) => (
          <span key={`${line}-${index}`} className="block whitespace-pre">
            {line}
          </span>
        ))}
      </span>
    </motion.button>
  )
}
