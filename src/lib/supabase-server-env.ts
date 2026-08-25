function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as {
      role?: unknown
    }
  } catch {
    return null
  }
}

export function isServiceRoleKey(key: string) {
  const value = key.trim()
  if (!value || value.startsWith('sb_publishable_')) return false

  const payload = decodeJwtPayload(value)
  if (payload?.role === 'service_role') return true

  return false
}

/** Resuelve la service role key en runtime serverless (process.env). */
export function resolveServiceRoleKey(
  read: (...keys: string[]) => string,
): string {
  const explicit = read('SUPABASE_SERVICE_ROLE_KEY')
  if (explicit) return explicit

  for (const key of [
    'SUPABASE_ANON_KEY',
    'PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]) {
    const candidate = read(key)
    if (candidate && isServiceRoleKey(candidate)) return candidate
  }

  return ''
}
