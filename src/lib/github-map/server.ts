import {
  GITHUB_MAP_CACHE_VERSION,
  GITHUB_MAP_MIN_COMMITS,
  type GithubMapLinks,
  type GithubMapMember,
  type GithubMapPayload,
  type GithubMapProject,
  type GithubMapRepo,
  type GithubMapScope,
} from './types'
import { aggregateMapProjects } from './projects'
import { fetchOwnerAvatar, fetchSiteMeta } from './site-meta'

const MEMBER_COLUMNS =
  'id, github_login, display_name, avatar_url, slug, is_visible, is_public'

type MemberRow = {
  id: string
  github_login: string | null
  display_name: string | null
  avatar_url: string | null
  slug: string | null
}

type GithubRepoNode = {
  nameWithOwner?: string
  homepageUrl?: string | null
  description?: string | null
  isFork?: boolean
  stargazerCount?: number
  primaryLanguage?: { name?: string } | null
  owner?: { login?: string } | null
}

type GithubContributionNode = {
  contributions?: { totalCount?: number }
  repository?: GithubRepoNode | null
}

type GithubUserResponse = {
  data?: {
    user?: {
      login?: string
      websiteUrl?: string | null
      twitterUsername?: string | null
      socialAccounts?: {
        nodes?: Array<{ provider?: string; url?: string } | null>
      } | null
      contributionsCollection?: {
        commitContributionsByRepository?: GithubContributionNode[]
      } | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

const CONTRIBUTION_MONTHS = 12

const CONTRIBUTIONS_QUERY = `
query MemberCommitRepos($login: String!, $from: DateTime!) {
  user(login: $login) {
    login
    websiteUrl
    twitterUsername
    socialAccounts(first: 10) {
      nodes {
        provider
        url
      }
    }
    contributionsCollection(from: $from) {
      commitContributionsByRepository(maxRepositories: 100) {
        contributions {
          totalCount
        }
        repository {
          nameWithOwner
          homepageUrl
          description
          isFork
          stargazerCount
          primaryLanguage {
            name
          }
          owner {
            login
          }
        }
      }
    }
  }
}
`

const MEMORY_TTL_MS = 5 * 60 * 1000
const payloadCache = new Map<
  GithubMapScope,
  { expires: number; payload: GithubMapPayload }
>()
const refreshInflight = new Map<GithubMapScope, Promise<GithubMapPayload>>()

function envValue(...keys: string[]) {
  for (const key of keys) {
    const fromProcess = process.env[key]
    if (fromProcess?.trim()) return fromProcess.trim()
    try {
      const meta = import.meta.env as Record<string, string | undefined> | undefined
      const fromMeta = meta?.[key]
      if (fromMeta?.trim()) return fromMeta.trim()
    } catch {
      // En el runtime de Vercel Node a veces no hay import.meta.env.
    }
  }
  return ''
}

function supabaseConfig() {
  return {
    url: envValue(
      'SUPABASE_URL',
      'PUBLIC_SUPABASE_URL',
      'VITE_SUPABASE_URL',
    ),
    anonKey: envValue(
      'SUPABASE_ANON_KEY',
      'PUBLIC_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    ),
  }
}

function githubToken() {
  return envValue('GITHUB_TOKEN')
}

function serviceRoleKey() {
  return envValue('SUPABASE_SERVICE_ROLE_KEY')
}

type SnapshotRow = {
  scope: string
  payload: GithubMapPayload
  fetched_at: string
}

function remember(scope: GithubMapScope, payload: GithubMapPayload) {
  payloadCache.set(scope, {
    expires: Date.now() + MEMORY_TTL_MS,
    payload,
  })
}

async function readMapSnapshot(
  scope: GithubMapScope,
): Promise<GithubMapPayload | null> {
  try {
    const rows = await supabaseRest<SnapshotRow[]>(
      `github_map_cache?scope=eq.${encodeURIComponent(scope)}&select=scope,payload,fetched_at&limit=1`,
    )
    const row = rows[0]
    if (!row?.payload?.members) return null
    if ((row.payload.cacheVersion ?? 0) < GITHUB_MAP_CACHE_VERSION) return null
    const projects = Array.isArray(row.payload.projects)
      ? row.payload.projects
      : aggregateMapProjects(row.payload.members)
    return {
      ...row.payload,
      projects,
      scope,
      fetchedAt: row.payload.fetchedAt ?? row.fetched_at,
    }
  } catch (error) {
    console.warn('GitHub map: no se pudo leer la caché.', error)
    return null
  }
}

async function writeMapSnapshot(payload: GithubMapPayload) {
  const key = serviceRoleKey()
  const config = supabaseConfig()
  if (!key || !config.url) return

  try {
    const response = await fetch(
      `${config.url.replace(/\/+$/, '')}/rest/v1/github_map_cache?on_conflict=scope`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          'accept-profile': 'public',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          scope: payload.scope,
          payload,
          fetched_at: payload.fetchedAt ?? new Date().toISOString(),
        }),
      },
    )
    if (!response.ok) {
      throw new Error((await response.text()) || `HTTP ${response.status}`)
    }
  } catch (error) {
    console.warn('GitHub map: no se pudo guardar la caché.', error)
  }
}

async function supabaseRest<T>(path: string): Promise<T> {
  const config = supabaseConfig()
  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase configuration')
  }

  const response = await fetch(`${config.url.replace(/\/+$/, '')}/rest/v1/${path}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'accept-profile': 'public',
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Supabase HTTP ${response.status}`)
  }

  return (await response.json()) as T
}

async function paginateRows<T>(pathBase: string) {
  const pageSize = 1000
  const rows: T[] = []
  let offset = 0

  while (true) {
    const separator = pathBase.includes('?') ? '&' : '?'
    const page = await supabaseRest<T[]>(
      `${pathBase}${separator}limit=${pageSize}&offset=${offset}`,
    )
    rows.push(...page)
    if (page.length < pageSize) break
    offset += pageSize
  }

  return rows
}

function parseScope(value: string | null | undefined): GithubMapScope {
  return value === 'owned' ? 'owned' : 'all'
}

function contributionWindow() {
  const to = new Date()
  const from = new Date(to)
  from.setMonth(from.getMonth() - CONTRIBUTION_MONTHS)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    fromDay: from.toISOString().slice(0, 10),
    toDay: to.toISOString().slice(0, 10),
  }
}

function parseContributionTotal(html: string) {
  const heading = html.match(
    /id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions?/i,
  )
  if (heading) return Number(heading[1]!.replace(/,/g, '')) || 0

  const year = html.match(/([\d,]+)\s+contributions?\s+in the last year/i)
  if (year) return Number(year[1]!.replace(/,/g, '')) || 0

  let total = 0
  for (const match of html.matchAll(/>(\d+) contributions? on /gi)) {
    total += Number(match[1]) || 0
  }
  return total
}

async function fetchPublicContributionTotal(login: string) {
  const { fromDay, toDay } = contributionWindow()
  const response = await fetch(
    `https://github.com/users/${encodeURIComponent(login)}/contributions?from=${fromDay}&to=${toDay}`,
    {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'cuyoconnect-github-map',
      },
    },
  )
  if (!response.ok) return 0
  return parseContributionTotal(await response.text())
}

function normalizeHomepageUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function toRepo(
  repository: GithubRepoNode | null | undefined,
  login: string,
  commits: number,
): GithubMapRepo | null {
  const fullName = repository?.nameWithOwner?.trim()
  const homepageUrl = normalizeHomepageUrl(repository?.homepageUrl)
  if (!fullName || !fullName.includes('/') || commits < GITHUB_MAP_MIN_COMMITS || !homepageUrl) {
    return null
  }
  const ownerLogin = repository?.owner?.login || fullName.split('/')[0] || ''
  return {
    fullName,
    commits,
    isOwner: ownerLogin.toLowerCase() === login.toLowerCase(),
    isFork: Boolean(repository?.isFork),
    stars: repository?.stargazerCount ?? 0,
    language: repository?.primaryLanguage?.name ?? null,
    homepageUrl,
    description: repository?.description?.trim() || null,
  }
}

/** El perfil de GitHub ya guarda los enlaces sociales: no hace falta scrapear nada. */
function toLinks(user: NonNullable<GithubUserResponse['data']>['user']): GithubMapLinks {
  const accounts = (user?.socialAccounts?.nodes ?? []).filter(Boolean) as Array<{
    provider?: string
    url?: string
  }>
  const byProvider = (provider: string) =>
    accounts.find((account) => account.provider === provider)?.url?.trim() || null

  const twitter = user?.twitterUsername?.trim()
  return {
    website: normalizeHomepageUrl(user?.websiteUrl) ?? byProvider('GENERIC'),
    linkedin: byProvider('LINKEDIN'),
    x: byProvider('TWITTER') ?? (twitter ? `https://x.com/${twitter}` : null),
  }
}

async function fetchGithubProfile(
  login: string,
  token: string,
): Promise<{ repos: GithubMapRepo[]; links: GithubMapLinks }> {
  const { from } = contributionWindow()
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cuyoconnect-github-map',
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { login, from },
    }),
  })

  const body = (await response.json()) as GithubUserResponse
  if (!response.ok) {
    throw new Error(
      body.errors?.[0]?.message || `GitHub GraphQL HTTP ${response.status}`,
    )
  }

  const user = body.data?.user
  if (!user?.login) return { repos: [], links: {} }

  const repos = (user.contributionsCollection?.commitContributionsByRepository ?? [])
    .map((node) =>
      toRepo(node.repository, user.login!, node.contributions?.totalCount ?? 0),
    )
    .filter((repo): repo is GithubMapRepo => Boolean(repo))

  return { repos, links: toLinks(user) }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await mapper(items[index]!)
    }
  }

  const workers = Math.min(Math.max(limit, 1), Math.max(items.length, 1))
  await Promise.all(Array.from({ length: workers }, () => worker()))
  return results
}

/** Resuelve og:image, favicon y foto de quien publica: una sola vez, en el refresh. */
async function withSiteMeta(projects: GithubMapProject[]) {
  const owners = [...new Set(projects.map((project) => repoOwner(project.fullName)))]
  const avatars = new Map(
    await mapPool(owners, 6, async (owner) => {
      return [owner, await fetchOwnerAvatar(owner)] as const
    }),
  )

  return mapPool(projects, 6, async (project) => {
    const meta = await fetchSiteMeta(project.homepageUrl)
    return {
      ...project,
      ...meta,
      ownerAvatarUrl: avatars.get(repoOwner(project.fullName)) ?? null,
    }
  })
}

function repoOwner(fullName: string) {
  return fullName.split('/')[0] || fullName
}

function toMember(
  row: MemberRow,
  repos: GithubMapRepo[],
  commitsOverride?: number,
  links?: GithubMapLinks,
): GithubMapMember {
  const sorted = [...repos].sort((a, b) => b.commits - a.commits)
  const fromRepos = sorted.reduce((sum, repo) => sum + repo.commits, 0)
  return {
    id: row.id,
    slug: row.slug || row.github_login || row.id,
    githubLogin: row.github_login ?? '',
    displayName: (row.display_name || row.github_login || '').trim(),
    avatarUrl: row.avatar_url ?? '',
    commits: commitsOverride ?? fromRepos,
    repos: sorted,
    links,
  }
}

async function fetchFreshPayload(
  scope: GithubMapScope,
  rows: MemberRow[],
): Promise<GithubMapPayload> {
  const token = githubToken()
  const fetchedAt = new Date().toISOString()

  if (!token) {
    const members = (
      await mapPool(rows, 8, async (row) => {
        try {
          const commits = await fetchPublicContributionTotal(row.github_login!)
          return toMember(row, [], commits)
        } catch (error) {
          console.error(
            `GitHub map: no se pudo leer el calendario de ${row.github_login}.`,
            error,
          )
          return toMember(row, [], 0)
        }
      })
    ).filter((member) => member.commits >= GITHUB_MAP_MIN_COMMITS)
    return {
      scope,
      fetchedAt,
      members,
      projects: [],
      cacheVersion: GITHUB_MAP_CACHE_VERSION,
    }
  }

  const members = await mapPool(rows, 8, async (row) => {
    try {
      const { repos, links } = await fetchGithubProfile(row.github_login!, token)
      const visible = scope === 'owned' ? repos.filter((repo) => repo.isOwner) : repos
      return toMember(row, visible, undefined, links)
    } catch (error) {
      console.error(`GitHub map: no se pudieron leer repos de ${row.github_login}.`, error)
      return toMember(row, [])
    }
  })

  const projects = await withSiteMeta(aggregateMapProjects(members))
  const visibleMembers = members.filter(
    (member) => member.commits >= GITHUB_MAP_MIN_COMMITS,
  )

  return {
    scope,
    fetchedAt,
    members: visibleMembers,
    projects,
    cacheVersion: GITHUB_MAP_CACHE_VERSION,
  }
}

async function refreshFromGithub(scope: GithubMapScope): Promise<GithubMapPayload> {
  const pending = refreshInflight.get(scope)
  if (pending) return pending

  const job = (async () => {
    const rows = (
      await paginateRows<MemberRow>(
        `member_profiles?select=${encodeURIComponent(MEMBER_COLUMNS)}&is_visible=eq.true&is_public=eq.true&order=joined_at.desc`,
      )
    ).filter((row) => row.github_login)

    const payload = await fetchFreshPayload(scope, rows)
    remember(scope, payload)
    await writeMapSnapshot(payload)
    return payload
  })()

  refreshInflight.set(scope, job)
  try {
    return await job
  } finally {
    refreshInflight.delete(scope)
  }
}

export async function refreshGithubMapPayload(
  scopeInput?: string | null,
): Promise<GithubMapPayload> {
  return refreshFromGithub(parseScope(scopeInput))
}

/** Solo lee el último snapshot. Nunca llama a GitHub. */
export async function readGithubMapPayload(
  scopeInput?: string | null,
): Promise<GithubMapPayload> {
  const scope = parseScope(scopeInput)
  const cached = payloadCache.get(scope)
  if (
    cached &&
    cached.expires > Date.now() &&
    (cached.payload.cacheVersion ?? 0) >= GITHUB_MAP_CACHE_VERSION
  ) {
    return cached.payload
  }

  const snapshot = await readMapSnapshot(scope)
  if (snapshot) {
    remember(scope, snapshot)
    return snapshot
  }

  return {
    scope,
    members: [],
    projects: [],
    fetchedAt: null,
    cacheVersion: GITHUB_MAP_CACHE_VERSION,
  }
}
