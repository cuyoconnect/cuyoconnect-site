import type { Session, User } from '@supabase/supabase-js'

import { getSupabaseBrowserClient } from '@/lib/supabase'

export type MemberProfile = {
  id: string
  user_id: string | null
  github_login: string
  display_name: string
  avatar_url: string
  github_url: string | null
  joined_at: string
  is_visible: boolean
  slug: string | null
  bio: string | null
  location: string | null
  website_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  x_url: string | null
  is_public: boolean
  updated_at: string | null
}

const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'
const LEGACY_MEMBER_PROFILE_COLUMNS =
  'id, github_login, display_name, avatar_url, github_url, joined_at, is_visible'

export const MEMBER_PROFILE_SOCIAL_LINKS = [
  {
    id: 'website',
    label: 'Sitio web',
    field: 'website_url',
    placeholder: 'https://tu-sitio.com',
  },
  {
    id: 'github',
    label: 'GitHub',
    field: 'github_url',
    placeholder: 'https://github.com/usuario',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    field: 'linkedin_url',
    placeholder: 'https://linkedin.com/in/usuario',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    field: 'instagram_url',
    placeholder: 'https://instagram.com/usuario',
  },
  {
    id: 'x',
    label: 'X',
    field: 'x_url',
    placeholder: 'https://x.com/usuario',
  },
] as const

export type MemberProfileSocialField =
  (typeof MEMBER_PROFILE_SOCIAL_LINKS)[number]['field']

export type EditableMemberProfileInput = {
  display_name: string
  slug: string
  bio: string
  location: string
  website_url: string
  github_url: string
  linkedin_url: string
  instagram_url: string
  x_url: string
  is_public: boolean
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/
const URL_FIELDS: MemberProfileSocialField[] = [
  'website_url',
  'github_url',
  'linkedin_url',
  'instagram_url',
  'x_url',
]

type MemberProfileRow = Partial<MemberProfile> &
  Pick<
    MemberProfile,
    'id' | 'github_login' | 'display_name' | 'avatar_url' | 'joined_at' | 'is_visible'
  >

function isMissingMemberProfileColumn(error: { code?: string; message?: string }) {
  return error.code === '42703' || /column .*member_profiles.* does not exist/i.test(error.message ?? '')
}

function normalizeMemberProfile(row: MemberProfileRow): MemberProfile {
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    github_login: row.github_login,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    github_url: row.github_url ?? null,
    joined_at: row.joined_at,
    is_visible: row.is_visible,
    slug: row.slug ?? null,
    bio: row.bio ?? null,
    location: row.location ?? null,
    website_url: row.website_url ?? null,
    linkedin_url: row.linkedin_url ?? null,
    instagram_url: row.instagram_url ?? null,
    x_url: row.x_url ?? null,
    is_public: row.is_public ?? true,
    updated_at: row.updated_at ?? null,
  }
}

async function fetchVisibleMemberProfilesFromSupabase() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('is_visible', true)
    .eq('is_public', true)
    .order('joined_at', { ascending: false })

  if (error) {
    if (isMissingMemberProfileColumn(error)) {
      const fallback = await supabase
        .from('member_profiles')
        .select(LEGACY_MEMBER_PROFILE_COLUMNS)
        .eq('is_visible', true)
        .order('joined_at', { ascending: false })

      if (fallback.error) {
        throw fallback.error
      }

      return ((fallback.data ?? []) as MemberProfileRow[]).map(normalizeMemberProfile)
    }

    throw error
  }

  return ((data ?? []) as MemberProfileRow[]).map(normalizeMemberProfile)
}

async function fetchMemberProfileBySlugFromSupabase(slug: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    if (isMissingMemberProfileColumn(error)) return null
    throw error
  }

  return data ? normalizeMemberProfile(data as MemberProfileRow) : null
}

export async function fetchVisibleMemberProfiles() {
  if (import.meta.env.DEV) {
    return fetchVisibleMemberProfilesFromSupabase()
  }

  const res = await fetch('/api/member-profiles', {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `member_profiles HTTP ${res.status}`)
  }

  return ((await res.json()) as MemberProfileRow[]).map(normalizeMemberProfile)
}

export async function fetchMemberProfileBySlug(slugInput: string) {
  const slug = normalizeMemberSlug(slugInput)
  if (!isValidMemberSlug(slug)) return null

  if (import.meta.env.DEV) {
    return fetchMemberProfileBySlugFromSupabase(slug)
  }

  const res = await fetch(`/api/member-profile?slug=${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `member_profile HTTP ${res.status}`)
  }

  return normalizeMemberProfile((await res.json()) as MemberProfileRow)
}

function getAuthHeaders(session: Session) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

function getUserMetadata(user: User) {
  return user.user_metadata as Record<string, string | undefined>
}

export function buildDefaultMemberSlug(user: User) {
  const meta = getUserMetadata(user)
  const login = meta.user_name ?? meta.preferred_username
  const fallback = user.email?.split('@')[0] ?? `miembro-${user.id.slice(0, 8)}`
  return normalizeMemberSlug(login ?? fallback)
}

function buildDefaultProfileInsert(user: User) {
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
    id: crypto.randomUUID(),
    user_id: user.id,
    github_login: githubLogin,
    display_name: displayName,
    avatar_url: meta.avatar_url ?? '',
    github_url: githubUrl,
    slug: buildDefaultMemberSlug(user),
    is_visible: true,
    is_public: true,
  }
}

async function createMyMemberProfileFromSupabase(user: User) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(
      'Supabase no esta configurado. Revisa PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const { data, error } = await supabase
    .from('member_profiles')
    .insert(buildDefaultProfileInsert(user))
    .select(MEMBER_PROFILE_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return data as MemberProfile
}

async function fetchMyMemberProfileFromSupabase(user: User) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(
      'Supabase no esta configurado. Revisa PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const { data, error } = await supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? (data as MemberProfile) : createMyMemberProfileFromSupabase(user)
}

async function saveMyMemberProfileToSupabase(
  user: User,
  input: EditableMemberProfileInput,
) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(
      'Supabase no esta configurado. Revisa PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const payload = toMemberProfilePayload(input)
  const { data, error } = await supabase
    .from('member_profiles')
    .upsert(
      {
        ...buildDefaultProfileInsert(user),
        ...payload,
        user_id: user.id,
      },
      { onConflict: 'user_id' },
    )
    .select(MEMBER_PROFILE_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return data as MemberProfile
}

export async function fetchMyMemberProfile(session: Session, user: User) {
  if (import.meta.env.DEV) {
    return fetchMyMemberProfileFromSupabase(user)
  }

  const res = await fetch('/api/my-member-profile', {
    headers: getAuthHeaders(session),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `my_member_profile HTTP ${res.status}`)
  }

  return (await res.json()) as MemberProfile
}

export async function saveMyMemberProfile(
  session: Session,
  user: User,
  input: EditableMemberProfileInput,
) {
  if (import.meta.env.DEV) {
    return saveMyMemberProfileToSupabase(user, input)
  }

  const res = await fetch('/api/my-member-profile', {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(session),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `my_member_profile HTTP ${res.status}`)
  }

  return (await res.json()) as MemberProfile
}

export function formatMemberJoinedAt(joinedAt: string) {
  const date = new Date(joinedAt)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getMemberDisplayName(profile: MemberProfile) {
  return profile.display_name.trim() || profile.github_login
}

export function getMemberSubtitle(profile: MemberProfile) {
  const login = profile.github_login.trim()
  if (login) return `@${login}`

  const joinedAt = formatMemberJoinedAt(profile.joined_at)
  return joinedAt ? `Se unio el ${joinedAt}` : ''
}

export function normalizeMemberSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function isValidMemberSlug(slug: string) {
  return SLUG_PATTERN.test(slug)
}

export function getMemberSlug(profile: MemberProfile) {
  return normalizeMemberSlug(profile.slug ?? profile.github_login)
}

export function getMemberProfileHref(profile: MemberProfile) {
  const slug = getMemberSlug(profile)
  if (isValidMemberSlug(slug)) return `/u/${slug}`
  return profile.github_url ?? ''
}

export function getMemberPublicUrl(slug: string, origin?: string) {
  const normalizedSlug = normalizeMemberSlug(slug)
  const path = `/u/${normalizedSlug}`
  const base = origin?.replace(/\/+$/, '')
  return base ? `${base}${path}` : path
}

export function normalizeMemberUrlInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function toMemberProfilePayload(input: EditableMemberProfileInput) {
  const payload = {
    display_name: input.display_name.trim(),
    slug: normalizeMemberSlug(input.slug),
    bio: input.bio.trim() || null,
    location: input.location.trim() || null,
    website_url: normalizeMemberUrlInput(input.website_url) || null,
    github_url: normalizeMemberUrlInput(input.github_url) || null,
    linkedin_url: normalizeMemberUrlInput(input.linkedin_url) || null,
    instagram_url: normalizeMemberUrlInput(input.instagram_url) || null,
    x_url: normalizeMemberUrlInput(input.x_url) || null,
    is_public: input.is_public,
  }

  return payload
}

export function profileToEditableInput(
  profile: MemberProfile,
): EditableMemberProfileInput {
  return {
    display_name: getMemberDisplayName(profile),
    slug: getMemberSlug(profile),
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    website_url: profile.website_url ?? '',
    github_url: profile.github_url ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    x_url: profile.x_url ?? '',
    is_public: profile.is_public,
  }
}

export function validateEditableMemberProfile(input: EditableMemberProfileInput) {
  const errors: Partial<Record<keyof EditableMemberProfileInput, string>> = {}
  const slug = normalizeMemberSlug(input.slug)

  if (!input.display_name.trim()) {
    errors.display_name = 'Escribi tu nombre visible.'
  }

  if (!isValidMemberSlug(slug)) {
    errors.slug = 'Usa 3 a 32 caracteres: letras, numeros y guiones.'
  }

  if (input.bio.trim().length > 280) {
    errors.bio = 'La bio puede tener hasta 280 caracteres.'
  }

  if (input.location.trim().length > 80) {
    errors.location = 'La ubicacion puede tener hasta 80 caracteres.'
  }

  for (const field of URL_FIELDS) {
    const value = input[field].trim()
    if (!value) continue

    try {
      const parsed = new URL(normalizeMemberUrlInput(value))
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors[field] = 'Usa una URL http o https.'
      }
    } catch {
      errors[field] = 'Usa una URL valida.'
    }
  }

  return errors
}
