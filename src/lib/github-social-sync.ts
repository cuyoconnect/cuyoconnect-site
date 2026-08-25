import { parseGithubSocialAccounts, type GithubSocialLinks } from './github-social-links.js'

type MemberSyncRow = {
  id: string
  github_login: string | null
  website_url?: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  x_url?: string | null
  display_name?: string | null
  avatar_url?: string | null
  github_url?: string | null
  location?: string | null
}

type GithubUserResponse = {
  data?: {
    user?: {
      login?: string
      name?: string | null
      avatarUrl?: string | null
      url?: string | null
      websiteUrl?: string | null
      twitterUsername?: string | null
      location?: string | null
      socialAccounts?: {
        nodes?: Array<{ provider?: string; url?: string } | null>
      } | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

const PROFILE_QUERY = `
query MemberSocialProfile($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl
    url
    websiteUrl
    twitterUsername
    location
    socialAccounts(first: 10) {
      nodes {
        provider
        url
      }
    }
  }
}
`

function envValue(...keys: string[]) {
  for (const key of keys) {
    const fromProcess = process.env[key]
    if (fromProcess?.trim()) return fromProcess.trim()
  }
  return ''
}

function supabaseConfig() {
  return {
    url: envValue('SUPABASE_URL', 'PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'),
    serviceRoleKey: envValue('SUPABASE_SERVICE_ROLE_KEY'),
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

async function supabaseRest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = supabaseConfig()
  const key = config.serviceRoleKey || config.anonKey
  if (!config.url || !key) {
    throw new Error('Missing Supabase configuration')
  }

  const response = await fetch(`${config.url.replace(/\/+$/, '')}/rest/v1/${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      'accept-profile': 'public',
      'content-profile': 'public',
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Supabase HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
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
    rows.push(...(page ?? []))
    if (!page || page.length < pageSize) break
    offset += pageSize
  }

  return rows
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

export async function fetchGithubSocialProfile(
  login: string,
  token = githubToken(),
): Promise<
  GithubSocialLinks & {
    displayName: string | null
    avatarUrl: string | null
    githubUrl: string | null
    location: string | null
  }
> {
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN')
  }

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cuyoconnect-member-sync',
    },
    body: JSON.stringify({
      query: PROFILE_QUERY,
      variables: { login },
    }),
  })

  const body = (await response.json()) as GithubUserResponse
  if (!response.ok) {
    throw new Error(body.errors?.[0]?.message || `GitHub GraphQL HTTP ${response.status}`)
  }

  const user = body.data?.user
  const links = parseGithubSocialAccounts({
    websiteUrl: user?.websiteUrl,
    twitterUsername: user?.twitterUsername,
    socialAccounts: user?.socialAccounts?.nodes,
  })

  return {
    ...links,
    displayName: user?.name?.trim() || user?.login || null,
    avatarUrl: user?.avatarUrl ?? null,
    githubUrl: user?.url ?? (user?.login ? `https://github.com/${user.login}` : null),
    location: user?.location?.trim().slice(0, 80) || null,
  }
}

function sameLink(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? null) === (right ?? null)
}

export async function persistMemberGithubLinks(
  memberId: string,
  links: GithubSocialLinks,
  identity?: {
    displayName?: string | null
    avatarUrl?: string | null
    githubUrl?: string | null
    location?: string | null
  },
  previous?: Partial<GithubSocialLinks> & {
    displayName?: string | null
    avatarUrl?: string | null
    githubUrl?: string | null
    location?: string | null
  },
) {
  if (
    previous &&
    sameLink(previous.website, links.website) &&
    sameLink(previous.linkedin, links.linkedin) &&
    sameLink(previous.instagram, links.instagram) &&
    sameLink(previous.x, links.x) &&
    (!identity || (
      sameLink(previous.displayName, identity.displayName) &&
      sameLink(previous.avatarUrl, identity.avatarUrl) &&
      sameLink(previous.githubUrl, identity.githubUrl) &&
      sameLink(previous.location, identity.location)
    ))
  ) {
    return
  }

  const payload: Record<string, string | null> = {
    website_url: links.website,
    linkedin_url: links.linkedin,
    instagram_url: links.instagram,
    x_url: links.x,
  }

  if (identity?.displayName) payload.display_name = identity.displayName
  if (identity?.avatarUrl) payload.avatar_url = identity.avatarUrl
  if (identity?.githubUrl) payload.github_url = identity.githubUrl
  if (identity && 'location' in identity) payload.location = identity.location ?? null

  await supabaseRest(`member_profiles?id=eq.${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function syncMemberGithubProfile(row: MemberSyncRow) {
  const login = row.github_login?.trim()
  if (!login) return { id: row.id, login: '', ok: false as const, reason: 'missing-login' }

  try {
    const profile = await fetchGithubSocialProfile(login)
    await persistMemberGithubLinks(
      row.id,
      profile,
      {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        githubUrl: profile.githubUrl,
        location: profile.location,
      },
      {
        website: row.website_url,
        linkedin: row.linkedin_url,
        instagram: row.instagram_url,
        x: row.x_url,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        githubUrl: row.github_url,
        location: row.location,
      },
    )
    return { id: row.id, login, ok: true as const, links: profile }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`No se pudo sincronizar el perfil de GitHub de ${login}.`, error)
    return { id: row.id, login, ok: false as const, reason }
  }
}

export async function syncAllMemberGithubProfiles() {
  const token = githubToken()
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN')
  }

  const rows = (
    await paginateRows<MemberSyncRow>(
      'member_profiles?select=id,github_login,website_url,linkedin_url,instagram_url,x_url,display_name,avatar_url,github_url,location&is_visible=eq.true&order=joined_at.desc',
    )
  ).filter((row) => row.github_login)

  const results = await mapPool(rows, 6, syncMemberGithubProfile)
  const updated = results.filter((result) => result.ok).length

  return {
    total: rows.length,
    updated,
    failed: results.filter((result) => !result.ok),
  }
}
