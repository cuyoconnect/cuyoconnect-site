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

import {
  DEMO_GITHUB_MAP,
  fetchGithubMap,
  readCachedGithubMap,
} from '@/lib/github-map/client'
import {
  GITHUB_MAP_ACCENT,
  GITHUB_MAP_INK,
  GITHUB_MAP_SEAM,
  GITHUB_MAP_STAGE,
  shadeFill,
} from '@/lib/github-map/colors'
import { organicClip, tessellationPaths } from '@/lib/github-map/geometry'
import { layoutVoronoiCells } from '@/lib/github-map/layout'
import { aggregateMapProjects } from '@/lib/github-map/projects'
import type {
  GithubMapLinks,
  GithubMapPayload,
  GithubMapProject,
} from '@/lib/github-map/types'
import {
  ProjectLinkOrbs,
  type ProjectLink,
} from '@/components/github-map/ProjectLinkOrbs'
import { GITHUB_MAP_MIN_COMMITS } from '@/lib/github-map/types'
import { cellLod, computeItemWeights } from '@/lib/github-map/weights'
import {
  LinkPreviewCard,
  prefetchLinkPreviews,
  prioritizeLinkPreview,
} from '@/components/ui/link-preview'
import { cn } from '@/lib/utils'

const EASE = [0.33, 1, 0.68, 1] as const
const EMPTY_PROJECTS: GithubMapProject[] = []
const MAP_INSET_FULL = 34
const MAP_INSET_TEASER = 28
// Miden la card real (cuadro + textos) para decidir si cae arriba o abajo.
const CARD_WIDTH = 240
const CARD_HEIGHT = 324
const CARD_GAP = 18
const CARD_SPRING = { stiffness: 520, damping: 42, mass: 0.5 } as const

type MapVariant = 'full' | 'teaser'
type ProjectItem = GithubMapProject & { id: string; weight: number }

function repoShortName(fullName: string) {
  return fullName.split('/')[1] || fullName
}

/** El dominio de las páginas personales es ruido: el nombre vive en el subdominio. */
const HOSTING_SUFFIX = /\.(github\.io|vercel\.app|netlify\.app|pages\.dev)$/i

/** Proporción ancho/alto del glifo medio en Inter semibold. */
const LABEL_CHAR_RATIO = 0.52
const LABEL_LINES = 2

/** El separador que queda al final de una línea no ocupa lugar real. */
function visibleLength(token: string) {
  return token.replace(/[-_.]+$/, '').length
}

function truncate(word: string, perLine: number) {
  return visibleLength(word) <= perLine
    ? word
    : `${word.slice(0, perLine - 1).replace(/[\s\-_.]+$/, '')}…`
}

/**
 * Arma la etiqueta en como mucho dos líneas cortando por los separadores del
 * nombre. Nunca parte una palabra al medio: si no entra, la trunca.
 */
function wrapLabel(name: string, widthPx: number, fontPx: number): string[] {
  const label = name.replace(HOSTING_SUFFIX, '')
  const perLine = Math.max(6, Math.floor(widthPx / (fontPx * LABEL_CHAR_RATIO)))
  const tokens = label.split(/(?<=[-_.])/)
  const lines: string[] = []
  let current = ''

  for (const token of tokens) {
    if (!current) {
      current = truncate(token, perLine)
      continue
    }
    if (current.length + visibleLength(token) <= perLine) {
      current += token
      continue
    }
    lines.push(current)
    if (lines.length === LABEL_LINES) return lines
    current = truncate(token, perLine)
  }

  if (current) lines.push(current)
  return lines
}

function repoOwner(fullName: string) {
  return fullName.split('/')[0] || fullName
}

function projectsFromPayload(payload: GithubMapPayload | null): GithubMapProject[] {
  if (!payload) return EMPTY_PROJECTS
  if (payload.projects?.length) return payload.projects
  return aggregateMapProjects(payload.members ?? [])
}

function useGithubMapData() {
  const [payload, setPayload] = useState<GithubMapPayload | null>(() =>
    readCachedGithubMap('all'),
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(() => !readCachedGithubMap('all'))

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const hadCache = Boolean(readCachedGithubMap('all'))
      if (!hadCache) setIsLoading(true)
      setErrorMessage('')
      try {
        const next = await fetchGithubMap('all')
        if (cancelled) return
        if (
          next.projects.length === 0 &&
          next.members.length === 0 &&
          import.meta.env.DEV &&
          !next.fetchedAt
        ) {
          setPayload(DEMO_GITHUB_MAP)
        } else {
          setPayload(next)
        }
      } catch (error) {
        if (cancelled) return
        console.error('No se pudo cargar el mapa de GitHub.', error)
        if (readCachedGithubMap('all')) return
        if (import.meta.env.DEV) {
          setPayload(DEMO_GITHUB_MAP)
          setErrorMessage('')
        } else {
          setErrorMessage(
            'Todavía no pudimos cargar los proyectos de la comunidad.',
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { payload, errorMessage, isLoading }
}

export function GitHubMapViewer({
  variant,
  className,
}: {
  variant: MapVariant
  initialMemberSlug?: string
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [stageRef, bounds] = useMeasure()
  const { payload, errorMessage, isLoading } = useGithubMapData()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const hoverClearRef = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const stageElRef = useRef<HTMLDivElement | null>(null)

  // La card sigue al puntero con un resorte corto en vez de anclarse a la celda.
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
      // Mientras está fijada, la card no se mueve con el puntero.
      if (pinnedId) return
      const rect = event.currentTarget.getBoundingClientRect()
      placeCard(event.clientX - rect.left, event.clientY - rect.top, rect.width)
    },
    [pinnedId, placeCard],
  )

  /** Al fijar otra región la card salta al clic, no se queda en la anterior. */
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

  // Un clic fuera de la card (o Escape) la suelta.
  useEffect(() => {
    if (!pinnedId) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as (Node & Element) | null
      if (target && cardRef.current?.contains(target)) return
      // Otra región resuelve el cambio (o el cierre) en su propio clic.
      if (target?.closest?.('[data-map-cell]')) return
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

  const width = Math.max(bounds.width, 0)
  const height = Math.max(bounds.height, 0)
  const isTeaser = variant === 'teaser'
  const projects = useMemo(() => projectsFromPayload(payload), [payload])

  const clipInset = isTeaser ? MAP_INSET_TEASER : MAP_INSET_FULL
  const clip = useMemo(
    () => (width > 0 && height > 0 ? organicClip(width, height, clipInset) : []),
    [clipInset, height, width],
  )

  const projectItems = useMemo(() => {
    if (projects.length === 0 || width < 32 || height < 32) return []
    const { weights } = computeItemWeights(projects.map((project) => project.commits))
    return projects.map((project, index) => ({
      ...project,
      id: project.fullName,
      weight: weights[index] ?? GITHUB_MAP_MIN_COMMITS,
    }))
  }, [height, projects, width])

  const projectCells = useMemo(
    () => layoutVoronoiCells(projectItems, width, height, clip),
    [clip, height, projectItems, width],
  )

  // Una sola curva por frontera compartida: las regiones encajan sin solaparse.
  const cellPaths = useMemo(
    () => tessellationPaths(projectCells.map((cell) => cell.points), 'cuyo-map'),
    [projectCells],
  )

  // La celda fijada manda sobre el hover hasta que se la suelte.
  const activeId = pinnedId ?? hoveredId
  const hovered = projectCells.find((cell) => cell.id === activeId) ?? null

  // Si la persona está en la comunidad usamos su avatar cacheado; si no, el de GitHub.
  const memberAvatars = useMemo(() => {
    const byLogin = new Map<string, string>()
    for (const member of payload?.members ?? []) {
      if (member.githubLogin && member.avatarUrl) {
        byLogin.set(member.githubLogin.toLowerCase(), member.avatarUrl)
      }
    }
    return byLogin
  }, [payload])

  const memberLinks = useMemo(() => {
    const byLogin = new Map<string, GithubMapLinks>()
    for (const member of payload?.members ?? []) {
      if (member.githubLogin && member.links) {
        byLogin.set(member.githubLogin.toLowerCase(), member.links)
      }
    }
    return byLogin
  }, [payload])

  // Sin foto real (GitHub devuelve identicon) la card se queda con la imagen del sitio.
  const avatarFor = useCallback(
    (project: GithubMapProject) => {
      const owner = repoOwner(project.fullName)
      if (!owner) return null
      return (
        memberAvatars.get(owner.toLowerCase()) ?? project.ownerAvatarUrl ?? null
      )
    },
    [memberAvatars],
  )

  useEffect(() => {
    if (projects.length === 0) return
    // Los proyectos más grandes son los que más se sobrevuelan: van primero en la cola.
    const byActivity = [...projects].sort((a, b) => b.commits - a.commits)
    prefetchLinkPreviews(
      byActivity.flatMap((project) => [
        avatarFor(project),
        project.imageUrl,
        project.faviconUrl,
      ]),
    )
  }, [avatarFor, projects])

  const hoveredOwner = hovered ? repoOwner(hovered.data.fullName) : ''
  const hoveredAvatar = hovered ? avatarFor(hovered.data) : null

  // El sitio y el repo siempre están; el resto sale del perfil de quien publicó.
  const hoveredLinks = useMemo<ProjectLink[]>(() => {
    if (!hovered) return []
    const links = memberLinks.get(hoveredOwner.toLowerCase()) ?? {}
    const candidates: ProjectLink[] = [
      {
        id: 'site',
        label: 'Sitio oficial del proyecto',
        href: hovered.data.homepageUrl,
        icon: 'website',
      },
      {
        id: 'repo',
        label: `Ver ${hovered.data.fullName} en GitHub`,
        href: `https://github.com/${hovered.data.fullName}`,
        icon: 'github',
      },
      links.linkedin
        ? {
            id: 'linkedin',
            label: `LinkedIn de ${hoveredOwner}`,
            href: links.linkedin,
            icon: 'linkedin' as const,
          }
        : null,
      links.x
        ? { id: 'x', label: `X de ${hoveredOwner}`, href: links.x, icon: 'x' as const }
        : null,
    ].filter((link): link is ProjectLink => Boolean(link))

    // Varios perfiles repiten su LinkedIn en el campo de sitio web.
    const seen = new Set<string>()
    return candidates.filter((link) => {
      const key = link.href.replace(/\/+$/, '').toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [hovered, hoveredOwner, memberLinks])

  return (
    <div
      className={cn(
        'relative min-w-0',
        !isTeaser && 'h-full w-full',
        className,
      )}
    >
      <div
        ref={(node) => {
          stageRef(node)
          stageElRef.current = node
        }}
        className={cn(
          // Sin marco ni fondo: el contorno del mapa lo dibujan los propios proyectos.
          'isolate z-0 w-full min-w-0',
          isTeaser ? 'relative h-[22rem] sm:h-[26rem]' : 'absolute inset-0',
        )}
        onMouseMove={trackPointer}
      >
        {isLoading ? (
          <div
            className="absolute inset-[8%] z-[2] animate-pulse rounded-[45%]"
            style={{ backgroundColor: GITHUB_MAP_STAGE }}
          />
        ) : errorMessage ? (
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            {errorMessage}
          </p>
        ) : projects.length === 0 ? (
          <p className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-neutral-600">
            Todavía no hay proyectos publicados con suficiente actividad.
          </p>
        ) : width > 0 ? (
          <div className="absolute inset-0 z-[2]">
            {/* Capa base con las mismas curvas: sella el antialias entre regiones. */}
            <svg
              className="pointer-events-none absolute inset-0"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              aria-hidden
            >
              {projectCells.map((cell, index) => (
                <path
                  key={`base-${cell.id}`}
                  d={cellPaths[index] ?? ''}
                  // La celda activa se achica: sin ocultar su base el hueco no se vería.
                  fill={activeId === cell.id ? 'none' : cell.fill}
                />
              ))}
            </svg>
            {projectCells.map((cell, index) => {
              const project = cell.data as ProjectItem
              const lod = cellLod(cell.area, 1)
              const isHovered = activeId === cell.id
              const dimmed = activeId !== null && !isHovered
              const label = repoShortName(project.fullName)
              return (
                <MapCell
                  key={cell.id}
                  path={cellPaths[index] ?? ''}
                  fill={cell.fill}
                  ink={cell.ink}
                  centroid={cell.centroid}
                  area={cell.area}
                  hovered={isHovered}
                  dimmed={dimmed}
                  label={label}
                  detail={`${project.commits} commits`}
                  lod={lod === 'color' ? 'color' : 'name'}
                  width={width}
                  height={height}
                  onHoverStart={() => {
                    prioritizeLinkPreview(
                      avatarFor(project) ?? project.imageUrl ?? project.faviconUrl,
                    )
                    setHoveredStable(cell.id)
                  }}
                  onHoverEnd={() => setHoveredStable(null)}
                  // El clic fija la card en lugar de abrir el sitio: los enlaces
                  // viven en las burbujas, ya fijadas y clickeables.
                  onSelect={(point) => {
                    if (pinnedId === cell.id) {
                      setPinnedId(null)
                      return
                    }
                    placeCardAtClient(point, cell.centroid)
                    setPinnedId(cell.id)
                  }}
                />
              )
            })}
          </div>
        ) : null}

        <AnimatePresence>
          {hovered ? (
            <motion.div
              // Clave estable: si se remontara por proyecto, el resorte de
              // posición se cancelaría y la card quedaría clavada donde estaba.
              key="project-card"
              ref={cardRef}
              data-card-root
              // El envoltorio queda anclado al puntero y la card se desplaza con
              // un transform: si capturara el puntero, sería un rectángulo
              // invisible sobre el mapa que se traga los clics.
              className="pointer-events-none absolute left-0 top-0 z-10"
              style={
                reduceMotion
                  ? { x: pointerX, y: pointerY }
                  : { x: followX, y: followY }
              }
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{
                duration: reduceMotion ? 0 : 0.16,
                ease: EASE,
              }}
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
                  url={hovered.data.homepageUrl}
                  title={repoShortName(hovered.data.fullName)}
                  meta={
                    <>
                      <GitCommitVertical className="h-4 w-4 shrink-0" aria-hidden />
                      {hovered.data.commits} commits
                    </>
                  }
                  imageUrl={hovered.data.imageUrl}
                  faviconUrl={hovered.data.faviconUrl}
                  avatarUrl={hoveredAvatar}
                  avatarLabel={hoveredOwner}
                  interactive={Boolean(pinnedId)}
                />
                <ProjectLinkOrbs
                  links={hoveredLinks}
                  visible={Boolean(pinnedId)}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </div>
    </div>
  )
}

function MapCell({
  path,
  fill,
  ink,
  centroid,
  area,
  hovered,
  dimmed,
  label,
  detail,
  lod,
  width,
  height,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  path: string
  fill: string
  ink: string
  centroid: [number, number]
  area: number
  hovered: boolean
  dimmed: boolean
  label: string
  detail: string
  lod: 'color' | 'avatar' | 'name'
  width: number
  height: number
  onHoverStart: () => void
  onHoverEnd: () => void
  /** Sin punto (teclado) la card se ancla al centro de la región. */
  onSelect: (point: { x: number; y: number } | null) => void
}) {
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(null)
    }
  }

  const cellSize = Math.sqrt(Math.max(area, 1))
  const labelWidth = Math.min(148, Math.max(52, cellSize * 0.72))
  const fontPx = Math.min(12, Math.max(9, cellSize * 0.13))
  const labelLines = wrapLabel(label, labelWidth, fontPx)
  const gradientId = `cell-grad-${label.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}-${Math.round(centroid[0])}-${Math.round(centroid[1])}`
  const light = shadeFill(fill, 0.12)
  const deep = shadeFill(fill, -0.07)

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      animate={{ opacity: dimmed ? 0.72 : 1 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <svg
        className="pointer-events-none absolute inset-0 overflow-hidden"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          filter: hovered
            ? 'drop-shadow(0 14px 18px rgba(29,29,31,0.16))'
            : undefined,
        }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="18%"
            y1="12%"
            x2="86%"
            y2="92%"
          >
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={fill} />
            <stop offset="100%" stopColor={deep} />
          </linearGradient>
        </defs>
        <g
          role="button"
          tabIndex={0}
          aria-label={`${label}, ${detail}`}
          className="cursor-pointer outline-none"
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          onFocus={onHoverStart}
          onBlur={onHoverEnd}
          onClick={(event) => onSelect({ x: event.clientX, y: event.clientY })}
          onKeyDown={onKeyDown}
        >
          {/* Zona sensible en tamaño real: si se achicara con la forma, el puntero
              quedaría fuera al encoger y el hover entraría en bucle. */}
          <path
            d={path}
            data-map-cell
            fill="transparent"
            className="pointer-events-auto"
            style={{ pointerEvents: 'fill' }}
          />
          <motion.path
            d={path}
            fill={`url(#${gradientId})`}
            stroke={hovered ? GITHUB_MAP_ACCENT : GITHUB_MAP_SEAM}
            strokeWidth={hovered ? 2.6 : 1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="pointer-events-none"
            vectorEffect="non-scaling-stroke"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scale: hovered ? 0.94 : 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.7 }}
          />
        </g>
      </svg>
      {lod === 'name' ? (
        <div
          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
          style={{
            left: centroid[0],
            top: centroid[1],
            width: labelWidth,
            color: ink,
          }}
        >
          <span
            title={label}
            className="w-full font-semibold leading-tight whitespace-nowrap"
            style={{
              color: ink === '#ffffff' ? '#fff' : GITHUB_MAP_INK,
              fontSize: fontPx,
            }}
          >
            {labelLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </motion.div>
  )
}
