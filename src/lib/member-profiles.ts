import { getSupabaseBrowserClient } from '@/lib/supabase'

export type MemberProfile = {
  id: string
  github_login: string
  display_name: string
  avatar_url: string
  github_url: string
  joined_at: string
  is_visible: boolean
}

const MEMBER_PROFILE_COLUMNS =
  'id, github_login, display_name, avatar_url, github_url, joined_at, is_visible'

export async function fetchVisibleMemberProfiles() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('is_visible', true)
    .order('joined_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as MemberProfile[]
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
