import type { VercelRequest, VercelResponse } from '@vercel/node'

import { readGithubMapPayload } from '../src/lib/github-map/server.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const scope = typeof req.query.scope === 'string' ? req.query.scope : 'all'

  try {
    const payload = await readGithubMapPayload(scope)
    const isEmpty =
      payload.members.length === 0 &&
      payload.projects.length === 0 &&
      !payload.fetchedAt
    res.setHeader(
      'Cache-Control',
      isEmpty
        ? 'no-store'
        : 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    )
    res.status(200).json(payload)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    res.status(502).json({
      error: 'No se pudo leer el mapa de GitHub.',
      detail: detail.slice(0, 500),
    })
  }
}
