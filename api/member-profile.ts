import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  createServerSupabaseClient,
  getSupabaseServerConfig,
  isValidSlug,
  MEMBER_PROFILE_COLUMNS,
  normalizeSlug,
} from './_member-profile-shared'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const slug = normalizeSlug(String(req.query.slug ?? ''))
  if (!isValidSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug' })
    return
  }

  const { url, anonKey } = getSupabaseServerConfig()
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Missing Supabase configuration' })
    return
  }

  const supabase = createServerSupabaseClient({ url, key: anonKey })
  const { data, error } = await supabase
    .from('member_profiles')
    .select(MEMBER_PROFILE_COLUMNS)
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    res.status(502).json({
      error: 'Upstream error',
      detail: error.message,
    })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }

  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  res.setHeader(
    'Vercel-CDN-Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300',
  )
  res.status(200).json(data)
}
