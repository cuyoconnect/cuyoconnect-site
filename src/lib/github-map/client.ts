import {
  GITHUB_MAP_CACHE_VERSION,
  type GithubMapPayload,
  type GithubMapScope,
} from '@/lib/github-map/types'
import { aggregateMapProjects } from '@/lib/github-map/projects'

const SESSION_PREFIX = 'cuyo.github-map'

function sessionKey(scope: GithubMapScope) {
  return `${SESSION_PREFIX}.v${GITHUB_MAP_CACHE_VERSION}.${scope}`
}

function parsePayload(value: unknown, scope: GithubMapScope): GithubMapPayload | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as GithubMapPayload
  if (!Array.isArray(payload.members)) return null
  if ((payload.cacheVersion ?? 0) < GITHUB_MAP_CACHE_VERSION) return null
  const projects = Array.isArray(payload.projects)
    ? payload.projects
    : aggregateMapProjects(payload.members)
  return {
    ...payload,
    projects,
    scope: payload.scope || scope,
  }
}

export function readCachedGithubMap(
  scope: GithubMapScope = 'all',
): GithubMapPayload | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(sessionKey(scope))
    if (!raw) return null
    const parsed = parsePayload(JSON.parse(raw), scope)
    if (
      parsed &&
      parsed.projects.length === 0 &&
      parsed.members.length === 0 &&
      !parsed.fetchedAt
    ) {
      sessionStorage.removeItem(sessionKey(scope))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCachedGithubMap(payload: GithubMapPayload) {
  if (typeof sessionStorage === 'undefined') return
  // No persistir snapshots vacíos: bloquean el fallback demo en dev.
  if (
    payload.projects.length === 0 &&
    payload.members.length === 0 &&
    !payload.fetchedAt
  ) {
    return
  }
  try {
    sessionStorage.setItem(sessionKey(payload.scope), JSON.stringify(payload))
  } catch {
    // cuota / modo privado
  }
}

async function fetchFromApi(scope: GithubMapScope): Promise<GithubMapPayload> {
  const response = await fetch(`/api/github-map?scope=${scope}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!response.ok || !contentType.includes('application/json')) {
    const detail = await response.text()
    throw new Error(detail.slice(0, 280) || `HTTP ${response.status}`)
  }
  const parsed = parsePayload(await response.json(), scope)
  if (!parsed) throw new Error('El mapa de GitHub vino vacío o desactualizado.')
  return parsed
}

async function fetchFromSupabase(
  scope: GithubMapScope,
): Promise<GithubMapPayload | null> {
  const url = (
    import.meta.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.VITE_SUPABASE_URL ??
    ''
  ).trim()
  const key = (
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    ''
  ).trim()
  if (!url || !key) return null

  const response = await fetch(
    `${url.replace(/\/+$/, '')}/rest/v1/github_map_cache?scope=eq.${encodeURIComponent(scope)}&select=payload,fetched_at&limit=1`,
    {
      headers: {
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  )
  if (!response.ok) return null
  const rows = (await response.json()) as Array<{
    payload?: GithubMapPayload
    fetched_at?: string
  }>
  const row = rows[0]
  if (!row?.payload) return null
  return parsePayload(
    {
      ...row.payload,
      fetchedAt: row.payload.fetchedAt ?? row.fetched_at ?? null,
    },
    scope,
  )
}

async function refreshGithubMap(scope: GithubMapScope) {
  try {
    await fetch(`/api/github-map-refresh?scope=${scope}`, { method: 'POST' })
  } catch {
    // el read posterior falla solo si tampoco hay snapshot
  }
}

export async function fetchGithubMap(
  scope: GithubMapScope = 'all',
): Promise<GithubMapPayload> {
  const api = fetchFromApi(scope)
  const first = await Promise.any([
    api,
    fetchFromSupabase(scope).then((payload) => {
      if (!payload) return Promise.reject(new Error('sin snapshot'))
      return payload
    }),
  ]).catch(() => api)

  const needsWarm =
    first.projects.length === 0 &&
    first.members.length === 0 &&
    !first.fetchedAt

  if (needsWarm && import.meta.env.DEV) {
    await refreshGithubMap(scope)
    try {
      const warmed = await fetchFromApi(scope)
      if (warmed.projects.length > 0 || warmed.members.length > 0) {
        writeCachedGithubMap(warmed)
        return warmed
      }
    } catch {
      // cae al payload vacío / demo en el viewer
    }
  }

  writeCachedGithubMap(first)
  void api
    .then((payload) => writeCachedGithubMap(payload))
    .catch(() => undefined)
  return first
}

export const DEMO_GITHUB_MAP: GithubMapPayload = {
  scope: 'all',
  fetchedAt: null,
  cacheVersion: GITHUB_MAP_CACHE_VERSION,
  members: [
    {
      id: 'demo-1',
      slug: 'ana-cuyo',
      githubLogin: 'ana',
      displayName: 'Ana López',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      commits: 420,
      repos: [
        {
          fullName: 'ana/cuyo-app',
          commits: 280,
          isOwner: true,
          isFork: false,
          stars: 12,
          language: 'TypeScript',
          homepageUrl: 'https://cuyo-app.vercel.app',
          description: null,
        },
        {
          fullName: 'ana/notas',
          commits: 140,
          isOwner: true,
          isFork: false,
          stars: 3,
          language: 'Python',
          homepageUrl: 'https://ana-notas.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-2',
      slug: 'mati',
      githubLogin: 'mati',
      displayName: 'Matías',
      avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
      commits: 210,
      repos: [
        {
          fullName: 'mati/connect',
          commits: 210,
          isOwner: true,
          isFork: false,
          stars: 8,
          language: 'TypeScript',
          homepageUrl: 'https://mati-connect.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-3',
      slug: 'sofia',
      githubLogin: 'sofia',
      displayName: 'Sofía',
      avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4',
      commits: 88,
      repos: [
        {
          fullName: 'sofia/ui',
          commits: 50,
          isOwner: true,
          isFork: false,
          stars: 4,
          language: 'CSS',
          homepageUrl: 'https://sofia-ui.vercel.app',
          description: null,
        },
        {
          fullName: 'cuyoconnect/web',
          commits: 38,
          isOwner: false,
          isFork: false,
          stars: 20,
          language: 'TypeScript',
          homepageUrl: 'https://cuyoconnect.com',
          description: null,
        },
      ],
    },
    {
      id: 'demo-4',
      slug: 'juan',
      githubLogin: 'juan',
      displayName: 'Juan Pérez',
      avatarUrl: 'https://avatars.githubusercontent.com/u/4?v=4',
      commits: 36,
      repos: [
        {
          fullName: 'juan/bot',
          commits: 36,
          isOwner: true,
          isFork: false,
          stars: 1,
          language: 'Go',
          homepageUrl: 'https://juan-bot.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-5',
      slug: 'luna',
      githubLogin: 'luna',
      displayName: 'Luna',
      avatarUrl: 'https://avatars.githubusercontent.com/u/5?v=4',
      commits: 150,
      repos: [
        {
          fullName: 'luna/ml',
          commits: 90,
          isOwner: true,
          isFork: false,
          stars: 6,
          language: 'Python',
          homepageUrl: 'https://luna-ml.vercel.app',
          description: null,
        },
        {
          fullName: 'luna/data',
          commits: 60,
          isOwner: true,
          isFork: false,
          stars: 2,
          language: 'Python',
          homepageUrl: 'https://luna-data.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-6',
      slug: 'nico',
      githubLogin: 'nico',
      displayName: 'Nico',
      avatarUrl: 'https://avatars.githubusercontent.com/u/6?v=4',
      commits: 12,
      repos: [
        {
          fullName: 'nico/hello',
          commits: 12,
          isOwner: true,
          isFork: false,
          stars: 0,
          language: 'JavaScript',
          homepageUrl: 'https://nico-hello.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-7',
      slug: 'valentina',
      githubLogin: 'valentina',
      displayName: 'Valentina',
      avatarUrl: 'https://avatars.githubusercontent.com/u/7?v=4',
      commits: 310,
      repos: [
        {
          fullName: 'vale/api',
          commits: 200,
          isOwner: true,
          isFork: false,
          stars: 9,
          language: 'Rust',
          homepageUrl: 'https://vale-api.vercel.app',
          description: null,
        },
        {
          fullName: 'vale/cli',
          commits: 110,
          isOwner: true,
          isFork: false,
          stars: 5,
          language: 'Rust',
          homepageUrl: 'https://vale-cli.vercel.app',
          description: null,
        },
      ],
    },
    {
      id: 'demo-8',
      slug: 'tomas',
      githubLogin: 'tomas',
      displayName: 'Tomás',
      avatarUrl: 'https://avatars.githubusercontent.com/u/8?v=4',
      commits: 64,
      repos: [
        {
          fullName: 'tomas/game',
          commits: 64,
          isOwner: true,
          isFork: false,
          stars: 3,
          language: 'C#',
          homepageUrl: 'https://tomas-game.vercel.app',
          description: null,
        },
      ],
    },
  ],
  projects: [],
}

DEMO_GITHUB_MAP.projects = aggregateMapProjects(DEMO_GITHUB_MAP.members)

