import { createClient, type User } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

export const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'

type EditableMemberProfileInput = {
  display_name?: unknown
  slug?: unknown
  bio?: unknown
  location?: unknown
  website_url?: unknown
  github_url?: unknown
  linkedin_url?: unknown
  instagram_url?: unknown
  x_url?: unknown
  is_public?: unknown
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/
const URL_FIELDS = [
  'website_url',
  'github_url',
  'linkedin_url',
  'instagram_url',
  'x_url',
] as const

export function getSupabaseServerConfig() {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    ''
  ).trim()
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    ''
  ).trim()
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  return { url, anonKey, serviceRoleKey }
}

export function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  const match = value?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

export function createServerSupabaseClient(input: {
  url: string
  key: string
  accessToken?: string
}) {
  return createClient(input.url, input.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: input.accessToken
      ? {
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
          },
        }
      : undefined,
  })
}

export async function getAuthenticatedUser(input: {
  url: string
  anonKey: string
  accessToken: string
}) {
  const authClient = createServerSupabaseClient({
    url: input.url,
    key: input.anonKey,
  })

  const { data, error } = await authClient.auth.getUser(input.accessToken)
  if (error || !data.user) {
    throw new Error('No pudimos validar la sesion.')
  }

  return data.user
}

function getUserMetadata(user: User) {
  return user.user_metadata as Record<string, string | undefined>
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function isValidSlug(slug: string) {
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

export function buildDefaultProfileInsert(user: User) {
  const meta = getUserMetadata(user)
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
    user_id: user.id,
    github_login: githubLogin,
    display_name: displayName,
    avatar_url: meta.avatar_url ?? '',
    github_url: githubUrl,
    slug: normalizeSlug(githubLogin || `miembro-${user.id.slice(0, 8)}`),
    is_visible: true,
    is_public: true,
  }
}

export function sanitizeEditableProfile(input: EditableMemberProfileInput) {
  const slug = normalizeSlug(String(input.slug ?? ''))
  const displayName = String(input.display_name ?? '').trim()
  const bio = String(input.bio ?? '').trim()
  const location = String(input.location ?? '').trim()
  const errors: Record<string, string> = {}

  if (!displayName) errors.display_name = 'Escribi tu nombre visible.'
  if (!isValidSlug(slug)) {
    errors.slug = 'Usa 3 a 32 caracteres: letras, numeros y guiones.'
  }
  if (bio.length > 280) errors.bio = 'La bio puede tener hasta 280 caracteres.'
  if (location.length > 80) {
    errors.location = 'La ubicacion puede tener hasta 80 caracteres.'
  }

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
      display_name: displayName,
      slug,
      bio: bio || null,
      location: location || null,
      website_url: urls.website_url,
      github_url: urls.github_url,
      linkedin_url: urls.linkedin_url,
      instagram_url: urls.instagram_url,
      x_url: urls.x_url,
      is_public: Boolean(input.is_public),
    },
    errors: null,
  }
}
