import type { Session, User } from '@supabase/supabase-js'

import { getSupabaseBrowserClient } from '@/lib/supabase'
import { socialLinkDisplayLabel } from '@/lib/social-link-display'

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

export const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'
const LEGACY_MEMBER_PROFILE_COLUMNS =
  'id, github_login, display_name, avatar_url, github_url, joined_at, is_visible'

export const MEMBER_PROFILE_SOCIAL_LINKS = [
  {
    id: 'github',
    label: 'GitHub',
    field: 'github_url',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    field: 'linkedin_url',
  },
  {
    id: 'x',
    label: 'X',
    field: 'x_url',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    field: 'instagram_url',
  },
  {
    id: 'website',
    label: 'Sitio',
    field: 'website_url',
  },
] as const

export type MemberProfileSocialLinkId =
  (typeof MEMBER_PROFILE_SOCIAL_LINKS)[number]['id']

export type MemberProfileSocialField =
  (typeof MEMBER_PROFILE_SOCIAL_LINKS)[number]['field']

export type MemberPublicSocialLink = {
  id: MemberProfileSocialLinkId
  label: string
  displayLabel: string
  href: string
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

export type MemberProfileRow = Partial<MemberProfile> &
  Pick<
    MemberProfile,
    'id' | 'github_login' | 'display_name' | 'avatar_url' | 'joined_at' | 'is_visible'
  >

function isMissingMemberProfileColumn(error: { code?: string; message?: string }) {
  return error.code === '42703' || /column .*member_profiles.* does not exist/i.test(error.message ?? '')
}

export function normalizeMemberProfile(row: MemberProfileRow): MemberProfile {
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

const MEMBER_PROFILE_META_DESC_MAX = 280

function clampMetaDescription(text: string, max = MEMBER_PROFILE_META_DESC_MAX) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut
  return `${base}…`
}

/**
 * Texto para `<meta name="description">` y Open Graph: bio del miembro o un fallback alineado al sitio.
 */
export function getMemberPublicMetaDescription(profile: MemberProfile) {
  const bio = profile.bio?.trim()
  if (bio) return clampMetaDescription(bio)
  const name = getMemberDisplayName(profile)
  return clampMetaDescription(
    `Perfil público de ${name} en CuyoConnect. Aprendé, construí y conectá con la comunidad tech del oeste argentino.`,
  )
}

/**
 * Avatar en HTTPS (la misma URL que viene de GitHub) para `og:image`, con tamaño razonable para compartir.
 */
export function getMemberOgAvatarUrl(profile: MemberProfile): string | null {
  const raw = profile.avatar_url?.trim()
  if (!raw) return null
  if (!/^https:\/\//i.test(raw)) return null
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()
    if (
      host === 'avatars.githubusercontent.com' ||
      host.endsWith('.githubusercontent.com')
    ) {
      if (!url.searchParams.has('s')) url.searchParams.set('s', '512')
    }
    return url.toString()
  } catch {
    return raw
  }
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

function resolveMemberSocialHref(
  profile: MemberProfile,
  field: MemberProfileSocialField,
) {
  const stored = profile[field]?.trim()
  if (stored) return stored
  if (field === 'github_url' && profile.github_login.trim()) {
    return `https://github.com/${profile.github_login.trim()}`
  }
  return ''
}

export function getMemberPublicSocialLinks(
  profile: MemberProfile,
): MemberPublicSocialLink[] {
  return MEMBER_PROFILE_SOCIAL_LINKS.flatMap((link) => {
    const href = resolveMemberSocialHref(profile, link.field)
    return href
      ? [
          {
            id: link.id,
            label: link.label,
            displayLabel: socialLinkDisplayLabel(link.id, href, link.label),
            href,
          },
        ]
      : []
  })
}
