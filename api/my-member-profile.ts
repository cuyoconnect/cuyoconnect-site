import { randomUUID } from 'node:crypto'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/
const URL_FIELDS = ['linkedin_url', 'instagram_url', 'x_url'] as const

type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, string | undefined>
}

type EditableMemberProfileInput = {
  bio?: unknown
  linkedin_url?: unknown
  instagram_url?: unknown
  x_url?: unknown
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

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug)
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function validateUrl(value: string) {
  try {
    const url = new URL(normalizeUrlInput(value) ?? '')
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeEditableProfile(input: EditableMemberProfileInput) {
  const bio = String(input.bio ?? '').trim()
  const errors: Record<string, string> = {}

  if (bio.length > 280) errors.bio = 'La bio puede tener hasta 280 caracteres.'

  const urls = Object.fromEntries(
    URL_FIELDS.map((field) => {
      const value = String(input[field] ?? '')
      if (value.trim() && !validateUrl(value)) {
        errors[field] = 'Usa una URL http o https.'
      }
      return [field, normalizeUrlInput(value)]
    }),
  ) as Record<(typeof URL_FIELDS)[number], string | null>

  if (Object.keys(errors).length > 0) {
    return { data: null, errors }
  }

  return {
    data: {
      bio: bio || null,
      linkedin_url: urls.linkedin_url,
      instagram_url: urls.instagram_url,
      x_url: urls.x_url,
    },
    errors: null,
  }
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
}) {
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

  if (ownRows[0]) return ownRows[0]

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
      if (claimedRows[0]) return claimedRows[0]
    }

    if (claimable?.user_id === input.user.id) return claimable
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
  return createdRows[0]
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
  if (req.method !== 'GET' && req.method !== 'PATCH') {
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

    const profile = await findOrCreateProfile({
      config,
      accessToken,
      user,
    })

    if (req.method === 'GET') {
      res.status(200).json(profile)
      return
    }

    const { data, errors } = sanitizeEditableProfile(
      (req.body ?? {}) as Record<string, unknown>,
    )

    if (!data) {
      res.status(400).json({ error: 'Validation error', fields: errors })
      return
    }

    const updated = await supabaseRest({
      config,
      accessToken,
      path: `member_profiles?id=eq.${profile.id}&select=${encodeURIComponent(MEMBER_PROFILE_COLUMNS)}`,
      useServiceRole: hasServiceRoleKey(config),
      init: {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          ...buildGithubIdentity(user),
          is_visible: true,
          is_public: true,
        }),
      },
    })

    const updatedRows = await readRows<MemberProfileRow>(updated)
    res.status(200).json(updatedRows[0] ?? profile)
  } catch (error) {
    if (error instanceof Error && /validar la sesion/i.test(error.message)) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }

    sendSupabaseError(res, error)
  }
}
