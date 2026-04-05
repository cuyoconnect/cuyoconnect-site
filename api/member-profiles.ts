import type { VercelRequest, VercelResponse } from '@vercel/node'

// Keep in sync with src/lib/member-profiles.ts
const MEMBER_PROFILE_COLUMNS =
  'id, github_login, display_name, avatar_url, github_url, joined_at, is_visible'

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.SUPABASE_ANON_KEY ?? '').trim()
  return { url, anonKey }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { url: supabaseUrl, anonKey } = getSupabaseConfig()
  if (!supabaseUrl || !anonKey) {
    res.status(500).json({ error: 'Missing Supabase configuration' })
    return
  }

  const base = supabaseUrl.replace(/\/+$/, '')
  const restUrl = `${base}/rest/v1/member_profiles?select=${encodeURIComponent(MEMBER_PROFILE_COLUMNS)}&is_visible=eq.true&order=joined_at.desc`

  const upstream = await fetch(restUrl, {
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'accept-profile': 'public',
    },
  })

  if (!upstream.ok) {
    const detail = await upstream.text()
    res.status(502).json({
      error: 'Upstream error',
      status: upstream.status,
      detail: detail.slice(0, 500),
    })
    return
  }

  const data: unknown = await upstream.json()

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=86400',
  )
  res.status(200).json(data)
}
