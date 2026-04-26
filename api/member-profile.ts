import type { VercelRequest, VercelResponse } from '@vercel/node'

const MEMBER_PROFILE_COLUMNS =
  'id, user_id, github_login, display_name, avatar_url, github_url, joined_at, is_visible, slug, bio, location, website_url, linkedin_url, instagram_url, x_url, is_public, updated_at'

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

function getSupabaseConfig() {
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

  return { url, anonKey }
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

  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Missing Supabase configuration' })
    return
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
    const detail = await upstream.text()
    res.status(502).json({
      error: 'Upstream error',
      status: upstream.status,
      detail: detail.slice(0, 500),
    })
    return
  }

  const rows = (await upstream.json()) as unknown[]
  const data = rows[0]

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
