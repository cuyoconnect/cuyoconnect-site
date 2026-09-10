import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import useMeasure from 'react-use-measure'
import { ChevronLeft } from 'lucide-react'

import { ProjectFocusPanel } from '@/components/github-map/ProjectFocusPanel'
import { prefetchLinkPreviews } from '@/components/ui/link-preview'
import {
  GITHUB_MAP_BUBBLE_SURFACES,
  GITHUB_MAP_EDGE,
  GITHUB_MAP_EDGE_ACTIVE,
  GITHUB_MAP_HAIRLINE,
  GITHUB_MAP_INK,
  sequentialFillsByRank,
} from '@/lib/github-map/colors'
import {
  bubbleBackgroundCandidates,
  memberAvatarMap,
  memberLinksMap,
  projectLinksAsProfileStyle,
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
const EASE_OUT = [0.22, 1, 0.36, 1] as const
/** Ritmo de hover del resto del sitio (CTA ~420ms + 90ms). */
const HOVER_S = 0.5
const HOVER_DELAY_S = 0.09
/** El cable sale un poco más lento, después del scale down. */
const EDGE_DRAW_S = 0.84
const EDGE_DRAW_DELAY_S = 0.12
const STAGE_ASPECT = 0.54
const STAGE_MIN_HEIGHT = 380
const STAGE_MAX_HEIGHT = 560
const BUBBLE_MAX_VISIBLE = 20
const EDGE_TUCK = 1
const ART_OPACITY = 0.94
const PANEL_MAX_W = 576
/** Offset superior del panel de detalle superpuesto. */
const FOCUS_PANEL_TOP = 36
/** Avatar compacto del panel (= destino de la burbuja). */
const FOCUS_AVATAR_SIZE = 72
/** Nav volver + margen inferior hasta el avatar. */
const FOCUS_BREADCRUMB_BLOCK = 64
const FOCUS_REVEAL_DELAY = 0.24
const FOCUS_ENTER_S = 0.62
const FOCUS_BACKDROP_S = 0.45
const FOCUS_PEER_FADE_S = 0.38
/** Respaldo si onAnimationComplete no dispara al volver al mapa. */
const FOCUS_CLOSE_FALLBACK_MS = 1200
const PROJECT_FOCUS_HISTORY_KEY = 'cuyoProjectFocus'

const EDGE_VARIANTS = {
  rest: {
    pathLength: 1,
    opacity: 1,
    strokeWidth: 1.25,
    stroke: GITHUB_MAP_EDGE,
  },
  unrelated: {
    pathLength: 1,
    opacity: 0.28,
    strokeWidth: 1.1,
    stroke: GITHUB_MAP_EDGE,
  },
} as const

function GraphEdge({
  edge,
  hoveredId,
  reduceMotion,
}: {
  edge: EdgeLine
  hoveredId: string | null
  reduceMotion: boolean
}) {
  const connected = hoveredId === edge.source || hoveredId === edge.target
  const unrelated = Boolean(hoveredId) && !connected
  const fromHoveredNode =
    hoveredId === edge.target
      ? { x1: edge.x2, y1: edge.y2, x2: edge.x1, y2: edge.y1 }
      : { x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2 }

  return (
    <>
      <motion.line
        x1={edge.x1}
        y1={edge.y1}
        x2={edge.x2}
        y2={edge.y2}
        strokeLinecap="round"
        variants={EDGE_VARIANTS}
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={
          connected
            ? { opacity: 0, pathLength: 1, strokeWidth: 1.25, stroke: GITHUB_MAP_EDGE }
            : reduceMotion
              ? {
                  opacity: unrelated ? 0.28 : 1,
                  strokeWidth: 1.25,
                  stroke: GITHUB_MAP_EDGE,
                }
              : unrelated
                ? 'unrelated'
                : 'rest'
        }
        transition={
          reduceMotion || connected
            ? { duration: 0 }
            : { duration: HOVER_S, delay: HOVER_DELAY_S, ease: EASE }
        }
      />
      {connected && hoveredId ? (
        <motion.line
          key={`${edge.id}-out-${hoveredId}`}
          x1={fromHoveredNode.x1}
          y1={fromHoveredNode.y1}
          x2={fromHoveredNode.x2}
          y2={fromHoveredNode.y2}
          strokeLinecap="round"
          stroke={GITHUB_MAP_EDGE_ACTIVE}
          initial={
            reduceMotion
              ? false
              : { pathLength: 0, opacity: 1, strokeWidth: 2.2 }
          }
          animate={{ pathLength: 1, opacity: 1, strokeWidth: 2.2 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: EDGE_DRAW_S, delay: EDGE_DRAW_DELAY_S, ease: EASE }
          }
        />
      ) : null}
    </>
  )
}

type ProjectFocusHistoryState = {
  [PROJECT_FOCUS_HISTORY_KEY]?: string
}

type FocusHistoryPhase = 'idle' | 'pushed' | 'closing'

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
  imageCandidates: string[]
}

function shouldDismissFromFocusClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  if (target.closest('a, button, [role="button"], input, textarea, select, label')) {
    return false
  }

  const selection = window.getSelection()
  if (selection && selection.type === 'Range' && selection.toString().trim().length > 0) {
    return false
  }

  if (target.closest('p, h1, h2, h3, h4, h5, h6')) {
    return false
  }

  return true
}

export function GitHubProjectsBubblesViewer({
  className,
  onFocusChange,
}: {
  className?: string
  onFocusChange?: (focused: boolean) => void
}) {
  const reduceMotion = useReducedMotion()
  const [stageRef, bounds] = useMeasure()
  const [focusPanelRef, focusPanelBounds] = useMeasure()
  const { payload, errorMessage, isLoading } = useGithubMapData()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [focusPanelOpen, setFocusPanelOpen] = useState(false)
  const [handoffBubbleId, setHandoffBubbleId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const focusHistoryRef = useRef<FocusHistoryPhase>('idle')
  const focusedIdRef = useRef<string | null>(null)
  const focusPanelOpenRef = useRef(false)

  useEffect(() => {
    focusedIdRef.current = focusedId
  }, [focusedId])

  useEffect(() => {
    focusPanelOpenRef.current = focusPanelOpen
  }, [focusPanelOpen])

  const syncHistoryClose = useCallback(() => {
    focusHistoryRef.current = 'idle'
    if (focusPanelOpenRef.current) {
      setFocusPanelOpen(false)
    }
  }, [])

  const finishFocusClose = useCallback(() => {
    focusHistoryRef.current = 'idle'
    setFocusedId((current) => {
      if (current) setHandoffBubbleId(current)
      return null
    })
    setFocusPanelOpen(false)
  }, [])

  const dismissFocus = useCallback(() => {
    if (!focusedIdRef.current || !focusPanelOpenRef.current) return

    if (
      typeof window !== 'undefined' &&
      focusHistoryRef.current === 'pushed'
    ) {
      focusHistoryRef.current = 'closing'
      window.history.back()
      return
    }

    setFocusPanelOpen(false)
  }, [])

  const openFocus = useCallback((id: string) => {
    setHoveredId(null)
    setFocusedId(id)
    setFocusPanelOpen(true)

    if (typeof window === 'undefined') return

    const state: ProjectFocusHistoryState = {
      [PROJECT_FOCUS_HISTORY_KEY]: id,
    }
    window.history.pushState(state, '', window.location.href)
    focusHistoryRef.current = 'pushed'
  }, [])

  const handleFocusSurfaceClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!focusPanelOpen) return
      if (!shouldDismissFromFocusClick(event.target)) return
      dismissFocus()
    },
    [dismissFocus, focusPanelOpen],
  )

  const handleViewerShellClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!focusPanelOpen) return
      if (focusPanelRef.current?.contains(event.target as Node)) return
      if (!shouldDismissFromFocusClick(event.target)) return
      dismissFocus()
    },
    [dismissFocus, focusPanelOpen],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onPopState = () => {
      if (
        focusHistoryRef.current === 'closing' ||
        focusHistoryRef.current === 'pushed'
      ) {
        focusHistoryRef.current = 'idle'
        syncHistoryClose()
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [syncHistoryClose])

  useEffect(() => {
    if (!handoffBubbleId) return undefined
    const frame = window.requestAnimationFrame(() => setHandoffBubbleId(null))
    return () => window.cancelAnimationFrame(frame)
  }, [handoffBubbleId])

  useEffect(() => {
    if (!reduceMotion || focusPanelOpen || !focusedId) return undefined
    finishFocusClose()
    return undefined
  }, [reduceMotion, focusPanelOpen, focusedId, finishFocusClose])

  useEffect(() => {
    if (focusPanelOpen || !focusedId || reduceMotion) return undefined
    const timeout = window.setTimeout(finishFocusClose, FOCUS_CLOSE_FALLBACK_MS)
    return () => window.clearTimeout(timeout)
  }, [focusPanelOpen, focusedId, reduceMotion, finishFocusClose])

  useEffect(() => {
    if (!focusedId) return

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') dismissFocus()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focusedId, dismissFocus])

  useEffect(() => {
    onFocusChange?.(Boolean(focusedId && focusPanelOpen))
  }, [focusedId, focusPanelOpen, onFocusChange])

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

  const allProjects = useMemo(() => projectsFromPayload(payload), [payload])
  const projects = useMemo(
    () => allProjects.slice(0, BUBBLE_MAX_VISIBLE),
    [allProjects],
  )
  const memberAvatars = useMemo(() => memberAvatarMap(payload), [payload])
  const memberLinks = useMemo(() => memberLinksMap(payload), [payload])

  const stageWidth = Math.max(bounds.width, 0)
  const layoutStageHeight =
    stageWidth > 0
      ? Math.round(
          Math.min(
            Math.max(stageWidth * STAGE_ASPECT, STAGE_MIN_HEIGHT),
            STAGE_MAX_HEIGHT,
          ),
        )
      : 0

  const focusBubbleLayout = useMemo(() => {
    if (!focusedId || !focusPanelOpen || stageWidth <= 0) return null
    const panelWidth = Math.min(stageWidth, PANEL_MAX_W)
    const panelLeft = (stageWidth - panelWidth) / 2
    return {
      left: panelLeft,
      top: FOCUS_PANEL_TOP + FOCUS_BREADCRUMB_BLOCK,
      size: FOCUS_AVATAR_SIZE,
    }
  }, [focusedId, focusPanelOpen, stageWidth])

  const peersHidden = Boolean(focusedId) && focusPanelOpen

  const focusShellMinHeight = useMemo(() => {
    if (layoutStageHeight <= 0) return 0
    if (!focusedId) return layoutStageHeight
    if (focusPanelBounds.height <= 0) {
      return focusPanelOpen ? layoutStageHeight + 120 : layoutStageHeight
    }
    return Math.max(
      layoutStageHeight,
      FOCUS_PANEL_TOP + focusPanelBounds.height + 24,
    )
  }, [
    focusedId,
    focusPanelBounds.height,
    focusPanelOpen,
    layoutStageHeight,
  ])

  const graph = useMemo(() => {
    if (projects.length === 0 || stageWidth < 64 || layoutStageHeight < 64) {
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
      layoutStageHeight,
    )

    const items = layout.nodes.flatMap<BubbleItem>((node) => {
      const base = byId.get(node.id)
      if (!base) return []
      const label = repoShortName(base.project.fullName)
      return [
        {
          ...base,
          x: node.x,
          y: node.y,
          r: node.r,
          label,
          imageCandidates: bubbleBackgroundCandidates(base.project, memberAvatars),
        },
      ]
    })

    const positions = new Map(items.map((item) => [item.id, item]))
    const edges = layout.edges.flatMap<EdgeLine>((edge) => {
      const source = positions.get(edge.source)
      const target = positions.get(edge.target)
      if (!source || !target) return []

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
  }, [fontsReady, memberAvatars, projects, layoutStageHeight, stageWidth])

  const { items, edges } = graph

  useEffect(() => {
    if (projects.length === 0) return
    const byActivity = [...projects].sort((a, b) => b.commits - a.commits)
    prefetchLinkPreviews(
      byActivity.flatMap((project) =>
        bubbleBackgroundCandidates(project, memberAvatars),
      ),
    )
  }, [memberAvatars, projects])

  const focusedItem = items.find((item) => item.id === focusedId) ?? null
  const focusedOwner = focusedItem ? repoOwner(focusedItem.project.fullName) : ''
  const focusedProfileLinks = focusedItem
    ? projectLinksAsProfileStyle(focusedItem.project, memberLinks)
    : []

  const emptyMessage = (() => {
    if (!payload?.fetchedAt && allProjects.length === 0) {
      return 'Estamos sincronizando los proyectos de la comunidad. Volvé a cargar en unos minutos.'
    }
    if (allProjects.length === 0) {
      return 'Todavía no hay repos con homepage y al menos 10 commits en el último año.'
    }
    return 'Todavía no hay proyectos publicados con suficiente actividad.'
  })()

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: FOCUS_ENTER_S, ease: EASE_OUT, delay: FOCUS_REVEAL_DELAY }

  const panelExitTransition = reduceMotion
    ? { duration: 0 }
    : { duration: FOCUS_ENTER_S, ease: EASE_OUT }

  return (
    <div
      ref={stageRef}
      className={cn('relative w-full min-w-0', focusedId && 'z-20', className)}
      style={{
        minHeight: focusShellMinHeight > 0 ? focusShellMinHeight : undefined,
      }}
      onClick={handleViewerShellClick}
    >
      <div
        className="relative w-full min-w-0 overflow-visible"
        style={{
          height: layoutStageHeight > 0 ? layoutStageHeight : undefined,
          minHeight: layoutStageHeight > 0 ? undefined : '20rem',
        }}
      >
        {isLoading ? (
          <div className="absolute inset-[8%] z-[2] animate-pulse rounded-[45%] bg-neutral-100" />
        ) : errorMessage ? (
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            {errorMessage}
          </p>
        ) : items.length === 0 && stageWidth > 0 ? (
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            {emptyMessage}
          </p>
        ) : (
          <>
            <AnimatePresence>
              {focusedId ? (
                <motion.button
                  type="button"
                  key="focus-backdrop"
                  aria-label="Volver al mapa de proyectos"
                  className="absolute inset-0 z-[3] cursor-default bg-white/55"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: focusPanelOpen ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : focusPanelOpen
                        ? { duration: FOCUS_BACKDROP_S, ease: EASE_OUT }
                        : { duration: FOCUS_BACKDROP_S, ease: EASE_OUT }
                  }
                  onClick={dismissFocus}
                />
              ) : null}
            </AnimatePresence>

            <div
              className="absolute inset-0 z-[4]"
              style={{
                width: stageWidth,
                height: layoutStageHeight,
              }}
            >
              <svg
                className="pointer-events-none absolute inset-0"
                width={stageWidth}
                height={layoutStageHeight}
                viewBox={`0 0 ${stageWidth} ${layoutStageHeight}`}
                aria-hidden
              >
                {edges.map((edge) =>
                  peersHidden ? null : (
                    <GraphEdge
                      key={edge.id}
                      edge={edge}
                      hoveredId={hoveredId}
                      reduceMotion={Boolean(reduceMotion)}
                    />
                  ),
                )}
              </svg>

              {items.map((item, index) => {
                if (focusedId === item.id) return null
                return (
                  <BubbleNode
                    key={item.id}
                    item={item}
                    index={index}
                    focused={false}
                    hovered={hoveredId === item.id}
                    dimmed={Boolean(hoveredId) && hoveredId !== item.id}
                    inactive={peersHidden}
                    peerRevealDelay={false}
                    skipInitialAnimation={handoffBubbleId === item.id}
                    focusLayout={null}
                    reduceMotion={Boolean(reduceMotion)}
                    onHoverChange={(nextHovered) => {
                      setHoveredId((current) => {
                        if (nextHovered) return item.id
                        return current === item.id ? null : current
                      })
                    }}
                    onSelect={() => openFocus(item.id)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {focusedItem ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[8]"
          style={{ height: layoutStageHeight }}
        >
          <BubbleNode
            item={focusedItem}
            index={0}
            focused
            hovered={false}
            dimmed={false}
            inactive={false}
            peerRevealDelay={false}
            skipInitialAnimation={false}
            focusLayout={focusBubbleLayout}
            reduceMotion={Boolean(reduceMotion)}
            onSelect={dismissFocus}
            onReturnHomeComplete={
              !focusPanelOpen ? finishFocusClose : undefined
            }
          />
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {focusedItem && focusPanelOpen ? (
          <motion.div
            key={focusedItem.id}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: 16, transition: panelExitTransition }
            }
            transition={panelTransition}
            className="pointer-events-none absolute inset-x-0 z-[7] px-1"
            style={{ top: FOCUS_PANEL_TOP }}
          >
            <div
              ref={focusPanelRef}
              className="pointer-events-auto mx-auto w-full max-w-xl"
              onClick={handleFocusSurfaceClick}
            >
              <nav
                aria-label="Volver al mapa de proyectos"
                className="mb-8 flex justify-start"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                  onClick={dismissFocus}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Volver
                </button>
              </nav>
              <ProjectFocusPanel
                project={focusedItem.project}
                title={focusedItem.label}
                ownerHandle={focusedOwner}
                imageSrc={focusedItem.imageCandidates[0] ?? null}
                links={focusedProfileLinks}
                compact
                bubbleAvatarSlot
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function BubbleNode({
  item,
  focused,
  hovered = false,
  dimmed = false,
  inactive,
  peerRevealDelay,
  skipInitialAnimation = false,
  focusLayout,
  reduceMotion,
  onSelect,
  onHoverChange,
  onReturnHomeComplete,
}: {
  item: BubbleItem
  index: number
  focused: boolean
  hovered?: boolean
  dimmed?: boolean
  inactive: boolean
  peerRevealDelay: boolean
  skipInitialAnimation?: boolean
  focusLayout: { left: number; top: number; size: number } | null
  reduceMotion: boolean
  onSelect: () => void
  onHoverChange?: (hovered: boolean) => void
  onReturnHomeComplete?: () => void
}) {
  const diameter = item.r * 2
  const [attempt, setAttempt] = useState(0)
  const artSrc = item.imageCandidates[attempt] ?? null
  const showArt = Boolean(artSrc)
  const returnHomeCompleteRef = useRef(false)
  const springTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 180, damping: 26, mass: 1.05 }
  const isHovered = hovered && !focused && !inactive
  const hoverMotion = isHovered && !reduceMotion
  const dimMotion = dimmed && !focused && !inactive

  useEffect(() => {
    setAttempt(0)
  }, [item.imageCandidates])

  useEffect(() => {
    if (focusLayout) {
      returnHomeCompleteRef.current = false
    }
  }, [focusLayout])

  const handleLayoutAnimationComplete = () => {
    if (
      !onReturnHomeComplete ||
      returnHomeCompleteRef.current ||
      focusLayout
    ) {
      return
    }
    returnHomeCompleteRef.current = true
    onReturnHomeComplete()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <motion.button
      type="button"
      data-bubble-node
      aria-label={`${item.label}, ${item.project.commits} commits`}
      aria-pressed={focused}
      className={cn(
        'absolute flex cursor-pointer flex-col items-center justify-center rounded-full text-center outline-none',
        'focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
        inactive && 'pointer-events-none',
        focused && 'pointer-events-auto',
        !inactive && !focused && 'pointer-events-auto',
        focused ? 'overflow-visible' : 'overflow-hidden',
      )}
      style={{
        background: item.fill,
        borderStyle: 'solid',
        zIndex: focused ? 8 : isHovered ? 6 : 1,
      }}
      initial={
        reduceMotion || skipInitialAnimation
          ? false
          : {
              left: item.x - item.r,
              top: item.y - item.r,
              width: diameter,
              height: diameter,
              scale: 0.6,
              opacity: 0,
              filter: 'saturate(1)',
              borderColor: GITHUB_MAP_HAIRLINE,
              borderWidth: 1,
            }
      }
      animate={{
        left: focusLayout ? focusLayout.left : item.x - item.r,
        top: focusLayout ? focusLayout.top : item.y - item.r,
        width: focusLayout ? focusLayout.size : diameter,
        height: focusLayout ? focusLayout.size : diameter,
        scale: inactive ? 0.92 : hoverMotion ? 0.94 : 1,
        opacity: inactive ? 0 : 1,
        filter: dimMotion ? 'saturate(0.38)' : 'saturate(1)',
        borderColor: isHovered ? GITHUB_MAP_INK : GITHUB_MAP_HAIRLINE,
        borderWidth: isHovered ? 2 : 1,
        boxShadow: focused
          ? '0 8px 20px rgba(29,29,31,0.1)'
          : hoverMotion
            ? '0 6px 18px rgba(29,29,31,0.12), 0 1px 3px rgba(29,29,31,0.05)'
            : '0 1px 2px rgba(29,29,31,0.04), 0 6px 16px rgba(29,29,31,0.05)',
      }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.88 }}
      transition={{
        left: springTransition,
        top: springTransition,
        width: springTransition,
        height: springTransition,
        boxShadow: {
          duration: reduceMotion ? 0 : HOVER_S,
          delay: reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
        opacity: {
          duration: inactive || peerRevealDelay ? FOCUS_PEER_FADE_S : HOVER_S,
          delay: peerRevealDelay ? FOCUS_REVEAL_DELAY : reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
        scale: {
          duration: inactive || peerRevealDelay ? FOCUS_PEER_FADE_S : HOVER_S,
          delay: peerRevealDelay ? FOCUS_REVEAL_DELAY : reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
        filter: {
          duration: reduceMotion ? 0 : HOVER_S,
          delay: reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
        borderColor: {
          duration: reduceMotion ? 0 : HOVER_S,
          delay: reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
        borderWidth: {
          duration: reduceMotion ? 0 : HOVER_S,
          delay: reduceMotion ? 0 : HOVER_DELAY_S,
          ease: EASE,
        },
      }}
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onKeyDown={onKeyDown}
      onAnimationComplete={handleLayoutAnimationComplete}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        {showArt ? (
          <img
            key={artSrc}
            src={artSrc!}
            alt=""
            aria-hidden
            draggable={false}
            loading="lazy"
            decoding="async"
            className="pointer-events-none h-full w-full object-cover"
            style={{ opacity: ART_OPACITY }}
            onError={() =>
              setAttempt((current) =>
                current + 1 < item.imageCandidates.length ? current + 1 : current,
              )
            }
          />
        ) : null}
      </span>
    </motion.button>
  )
}
