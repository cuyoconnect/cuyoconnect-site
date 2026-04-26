import {
  MEMBER_PROFILE_COLUMNS,
  isValidMemberSlug,
  normalizeMemberProfile,
  normalizeMemberSlug,
  type MemberProfile,
  type MemberProfileRow,
} from '@/lib/member-profiles'

function getSupabaseServerConfig() {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.SUPABASE_URL ??
    import.meta.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.VITE_SUPABASE_URL ??
    ''
  ).trim()
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.SUPABASE_ANON_KEY ??
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    ''
  ).trim()

  return { url, anonKey }
}

export async function fetchPublicMemberProfileBySlug(
  slugInput: string,
): Promise<MemberProfile | null> {
  const slug = normalizeMemberSlug(slugInput)
  if (!isValidMemberSlug(slug)) return null

  const { url, anonKey } = getSupabaseServerConfig()
  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration')
  }

  const base = url.replace(/\/+$/, '')
  const params = new URLSearchParams({
    select: MEMBER_PROFILE_COLUMNS,
    slug: `eq.${slug}`,
    is_visible: 'eq.true',
    is_public: 'eq.true',
    limit: '1',
  })

  const upstream = await fetch(`${base}/rest/v1/member_profiles?${params}`, {
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'accept-profile': 'public',
    },
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    throw new Error(
      `member_profiles upstream ${upstream.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`,
    )
  }

  const rows = (await upstream.json()) as MemberProfileRow[]
  return rows[0] ? normalizeMemberProfile(rows[0]) : null
}
