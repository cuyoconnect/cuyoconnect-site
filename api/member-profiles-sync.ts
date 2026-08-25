import type { VercelRequest, VercelResponse } from '@vercel/node'

import { syncAllMemberGithubProfiles } from '../src/lib/github-social-sync.js'

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

  try {
    const result = await syncAllMemberGithubProfiles()
    res.status(200).json({
      ok: true,
      total: result.total,
      updated: result.updated,
      failed: result.failed.length,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    res.status(502).json({
      error: 'No se pudieron sincronizar los perfiles desde GitHub.',
      detail: detail.slice(0, 500),
    })
  }
}
