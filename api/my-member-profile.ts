import { randomUUID } from 'node:crypto'

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { syncMemberGithubProfile } from '../src/lib/github-social-sync.js'

const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'

type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, string | undefined>
}

type MemberProfileRow = {
  id: string
  user_id: string | null
  github_login: string | null
}

type SupabaseConfig = {
  url: string
  anonKey: string
  serviceRoleKey: string
}

function getSupabaseConfig(): SupabaseConfig {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ''
  ).trim()
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    ''
  ).trim()
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  return { url, anonKey, serviceRoleKey }
}

function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  const match = value?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as {
      role?: unknown
    }
  } catch {
    return null
  }
}

function hasServiceRoleKey(config: SupabaseConfig) {
  if (!config.serviceRoleKey || config.serviceRoleKey === config.anonKey) return false

  const payload = decodeJwtPayload(config.serviceRoleKey)
  if (!payload) {
    return !config.serviceRoleKey.startsWith('sb_publishable_')
  }

  return payload.role === 'service_role'
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

async function getAuthenticatedUser(input: SupabaseConfig & { accessToken: string }) {
  const upstream = await fetch(`${input.url.replace(/\/+$/, '')}/auth/v1/user`, {
    headers: {
      Accept: 'application/json',
      apikey: input.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
    },
  })

  if (!upstream.ok) {
    throw new Error('No pudimos validar la sesion.')
  }

  return (await upstream.json()) as AuthUser
}

function buildDefaultProfileInsert(user: AuthUser) {
  const identity = buildGithubIdentity(user)

  return {
    id: randomUUID(),
    user_id: user.id,
    ...identity,
    is_visible: true,
    is_public: true,
  }
}

function buildGithubIdentity(user: AuthUser) {
  const meta = user.user_metadata ?? {}
  const githubLogin =
    meta.user_name ?? meta.preferred_username ?? user.email?.split('@')[0] ?? ''
  const displayName = meta.full_name ?? meta.name ?? githubLogin
  const githubUrl =
    typeof meta.html_url === 'string'
      ? meta.html_url
      : githubLogin
        ? `https://github.com/${githubLogin}`
        : ''

  return {
    github_login: githubLogin,
    display_name: displayName,
    avatar_url: meta.avatar_url ?? '',
    github_url: githubUrl,
    slug: normalizeSlug(githubLogin || `miembro-${user.id.slice(0, 8)}`),
  }
}

async function supabaseRest(input: {
  config: SupabaseConfig
  accessToken: string
  path: string
  useServiceRole?: boolean
  init?: RequestInit
}) {
  const base = input.config.url.replace(/\/+$/, '')
  const useServiceRole = input.useServiceRole && hasServiceRoleKey(input.config)
  const bearer = useServiceRole ? input.config.serviceRoleKey : input.accessToken
  const apiKey = useServiceRole ? input.config.serviceRoleKey : input.config.anonKey
  return fetch(`${base}/rest/v1/${input.path}`, {
    ...input.init,
    headers: {
      Accept: 'application/json',
      apikey: apiKey,
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      'accept-profile': 'public',
      'content-profile': 'public',
      Prefer: 'return=representation',
      ...input.init?.headers,
    },
  })
}

async function readRows<T>(response: Response) {
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Supabase HTTP ${response.status}`)
  }

  return (await response.json()) as T[]
}

async function findOrCreateProfile(input: {
  config: SupabaseConfig
  accessToken: string
  user: AuthUser
}): Promise<{ profile: MemberProfileRow; shouldSync: boolean }> {
  const defaultInsert = buildDefaultProfileInsert(input.user)
  const select = encodeURIComponent(MEMBER_PROFILE_COLUMNS)
  const canUseServiceRole = hasServiceRoleKey(input.config)

  const byUser = await supabaseRest({
    config: input.config,
    accessToken: input.accessToken,
    path: `member_profiles?select=${select}&user_id=eq.${input.user.id}&limit=1`,
    useServiceRole: canUseServiceRole,
  })
  const ownRows = await readRows<MemberProfileRow>(byUser)

  if (ownRows[0]) return { profile: ownRows[0], shouldSync: false }

  if (canUseServiceRole && defaultInsert.slug) {
    const bySlug = await supabaseRest({
      config: input.config,
      accessToken: input.accessToken,
      path: `member_profiles?select=${select}&slug=eq.${encodeURIComponent(defaultInsert.slug)}&limit=1`,
      useServiceRole: true,
    })
    const slugRows = await readRows<MemberProfileRow>(bySlug)
    const claimable = slugRows[0]

    if (claimable && !claimable.user_id) {
      const claimed = await supabaseRest({
        config: input.config,
        accessToken: input.accessToken,
        path: `member_profiles?id=eq.${claimable.id}&select=${select}`,
        useServiceRole: true,
        init: {
          method: 'PATCH',
          body: JSON.stringify({
            user_id: input.user.id,
            ...buildGithubIdentity(input.user),
          }),
        },
      })
      const claimedRows = await readRows<MemberProfileRow>(claimed)
      if (claimedRows[0]) return { profile: claimedRows[0], shouldSync: true }
    }

    if (claimable?.user_id === input.user.id) {
      return { profile: claimable, shouldSync: false }
    }
  }

  const created = await supabaseRest({
    config: input.config,
    accessToken: input.accessToken,
    path: `member_profiles?select=${select}`,
    useServiceRole: canUseServiceRole,
    init: {
      method: 'POST',
      body: JSON.stringify(defaultInsert),
    },
  })

  const createdRows = await readRows<MemberProfileRow>(created)
  return { profile: createdRows[0]!, shouldSync: true }
}

function parseSupabaseError(error: unknown) {
  const fallback = error instanceof Error ? error.message : String(error)

  try {
    const parsed = JSON.parse(fallback) as {
      code?: unknown
      message?: unknown
      detail?: unknown
    }

    return {
      code: typeof parsed.code === 'string' ? parsed.code : '',
      message:
        typeof parsed.message === 'string'
          ? parsed.message
          : typeof parsed.detail === 'string'
            ? parsed.detail
            : fallback,
    }
  } catch {
    return { code: '', message: fallback }
  }
}

function sendSupabaseError(res: VercelResponse, error: unknown) {
  const { code, message } = parseSupabaseError(error)

  if (code === '23505' || /duplicate key|unique/i.test(message)) {
    res.status(409).json({
      error: 'Profile already exists',
      detail:
        'Tu perfil de GitHub ya existe, pero todavia no esta asociado a tu sesion. Configura SUPABASE_SERVICE_ROLE_KEY en Vercel o asocia ese registro en Supabase.',
    })
    return
  }

  if (/row-level security|permission|42501/i.test(message)) {
    res.status(403).json({
      error: 'Forbidden',
      detail: 'No pudimos guardar: revisa las politicas RLS de member_profiles.',
    })
    return
  }

  res.status(502).json({
    error: 'Upstream error',
    detail: message.slice(0, 500),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const config = getSupabaseConfig()
  if (!config.url || !config.anonKey) {
    res.status(500).json({ error: 'Missing Supabase configuration' })
    return
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  try {
    const user = await getAuthenticatedUser({ ...config, accessToken })

    const { profile, shouldSync } = await findOrCreateProfile({
      config,
      accessToken,
      user,
    })

    if (shouldSync && profile?.id && profile.github_login) {
      await syncMemberGithubProfile({
        id: profile.id,
        github_login: profile.github_login,
      })
    }

    res.status(200).json(profile)
  } catch (error) {
    if (error instanceof Error && /validar la sesion/i.test(error.message)) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }

    sendSupabaseError(res, error)
  }
}
