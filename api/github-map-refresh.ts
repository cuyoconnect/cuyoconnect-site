import type { VercelRequest, VercelResponse } from '@vercel/node'

import { refreshGithubMapPayload } from '../src/lib/github-map/server'

export const config = {
  maxDuration: 300,
}

function isAuthorized(req: VercelRequest) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim()
  const secrets = [
    process.env.CRON_SECRET?.trim(),
    process.env.DEPLOY_TRIGGER_SECRET?.trim(),
  ].filter((value): value is string => Boolean(value))

  if (secrets.length === 0) {
    return process.env.VERCEL !== '1'
  }
  return Boolean(token && secrets.includes(token))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const scope = typeof req.query.scope === 'string' ? req.query.scope : 'all'

  try {
    const payload = await refreshGithubMapPayload(scope)
    res.status(200).json({
      ok: true,
      scope: payload.scope,
      members: payload.members.length,
      fetchedAt: payload.fetchedAt,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    res.status(502).json({
      error: 'No se pudo actualizar el mapa de GitHub.',
      detail: detail.slice(0, 500),
    })
  }
}
