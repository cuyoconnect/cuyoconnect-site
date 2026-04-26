import type { SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  buildDefaultProfileInsert,
  createServerSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
  getSupabaseServerConfig,
  MEMBER_PROFILE_COLUMNS,
  sanitizeEditableProfile,
} from './_member-profile-shared'

type MemberProfileRow = {
  id: string
  user_id: string | null
  github_login: string | null
}

async function findOrCreateProfile(input: {
  supabase: SupabaseClient
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>
  canClaimByGithubLogin: boolean
}) {
  const defaultInsert = buildDefaultProfileInsert(input.user)

  const byUser = await input.supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('user_id', input.user.id)
    .maybeSingle()

  if (byUser.error) throw byUser.error
  if (byUser.data) return byUser.data

  if (input.canClaimByGithubLogin && defaultInsert.github_login) {
    const byGithub = await input.supabase
      .from('member_profiles')
      .select(MEMBER_PROFILE_COLUMNS)
      .eq('github_login', defaultInsert.github_login)
      .maybeSingle()

    if (byGithub.error) throw byGithub.error

    const claimable = byGithub.data as MemberProfileRow | null
    if (claimable && !claimable.user_id) {
      const claimed = await input.supabase
        .from('member_profiles')
        .update({ user_id: input.user.id })
        .eq('id', claimable.id)
        .select(MEMBER_PROFILE_COLUMNS)
        .single()

      if (claimed.error) throw claimed.error
      return claimed.data
    }
  }

  const created = await input.supabase
    .from('member_profiles')
    .insert(defaultInsert)
    .select(MEMBER_PROFILE_COLUMNS)
    .single()

  if (created.error) throw created.error
  return created.data
}

function sendSupabaseError(res: VercelResponse, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const code = typeof error === 'object' && error && 'code' in error ? error.code : ''

  if (code === '23505' || /duplicate key|unique/i.test(message)) {
    res.status(409).json({
      error: 'Slug already exists',
      detail: 'Ese slash ya esta en uso. Proba con otro.',
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

  const { url, anonKey, serviceRoleKey } = getSupabaseServerConfig()
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Missing Supabase configuration' })
    return
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  try {
    const user = await getAuthenticatedUser({ url, anonKey, accessToken })
    const supabase = createServerSupabaseClient({
      url,
      key: serviceRoleKey || anonKey,
      accessToken: serviceRoleKey ? undefined : accessToken,
    })

    const profile = await findOrCreateProfile({
      supabase,
      user,
      canClaimByGithubLogin: Boolean(serviceRoleKey),
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

    const updated = await supabase
      .from('member_profiles')
      .update(data)
      .eq('id', profile.id)
      .select(MEMBER_PROFILE_COLUMNS)
      .single()

    if (updated.error) throw updated.error

    res.status(200).json(updated.data)
  } catch (error) {
    if (error instanceof Error && /validar la sesion/i.test(error.message)) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }

    sendSupabaseError(res, error)
  }
}
