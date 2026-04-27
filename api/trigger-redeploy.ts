import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Activa un redeploy (nuevo build) vía Vercel Deploy Hook.
 * Supabase Database Webhook debe apuntar a este endpoint, no a la URL de Vercel
 * (así el hook real solo vive en env de Vercel).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const expected = process.env.DEPLOY_TRIGGER_SECRET?.trim()
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL?.trim()

  if (!expected || !hookUrl) {
    res.status(503).json({ error: 'Deploy trigger not configured' })
    return
  }

  const fromBearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')?.trim()
  const fromHeader = (
    (req.headers['x-deploy-trigger'] as string | undefined) ||
    (req.headers['X-Deploy-Trigger'] as string | undefined)
  )?.trim()
  const fromBody = parseSecretFromBody(req.body)
  const provided = fromBearer || fromHeader || fromBody

  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const deployRes = await fetch(hookUrl, { method: 'POST' })
  if (!deployRes.ok) {
    res.status(502).json({ error: 'Deploy hook request failed' })
    return
  }

  res.status(200).json({ ok: true })
}

function parseSecretFromBody(body: unknown): string | undefined {
  if (body == null) return undefined
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as { secret?: string }
      return typeof parsed?.secret === 'string' ? parsed.secret.trim() : undefined
    } catch {
      return undefined
    }
  }
  if (typeof body === 'object' && body !== null && 'secret' in body) {
    const s = (body as { secret?: unknown }).secret
    return typeof s === 'string' ? s.trim() : undefined
  }
  return undefined
}
