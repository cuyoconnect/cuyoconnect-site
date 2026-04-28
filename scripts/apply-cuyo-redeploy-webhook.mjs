/**
 * Aplica la migración del webhook (pg_net + trigger) y guarda el token desde env.
 * Requiere conexión directa a Postgres (no la anon key de la API).
 *
 * Uso: con .env local que tenga DATABASE_URL o SUPABASE_DB_URL, y DEPLOY_TRIGGER_SECRET
 *   npm run db:redeploy-webhook
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import pg from 'pg'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const MIGRATION_FILE =
  '20260427150000_cuyo_redeploy_webhook.sql'
const DEFAULT_ENDPOINT = 'https://cuyoconnect.com/api/trigger-redeploy'

function getDatabaseUrl() {
  const a =
    process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim() || ''
  return a
}

async function main() {
  const connectionString = getDatabaseUrl()
  const secret = process.env.DEPLOY_TRIGGER_SECRET?.trim()
  const endpoint = (
    process.env.CUYO_REDEPLOY_WEBHOOK_URL?.trim() || DEFAULT_ENDPOINT
  ).replace(/\/+$/, '')

  if (!connectionString) {
    console.error(
      'Falta DATABASE_URL o SUPABASE_DB_URL (conexión Postgres, Supabase → Settings → Database → URI).',
    )
    process.exit(1)
  }
  if (!secret) {
    console.error('Falta DEPLOY_TRIGGER_SECRET (mismo valor que en Vercel).')
    process.exit(1)
  }

  const sql = readFileSync(
    join(root, 'supabase/migrations', MIGRATION_FILE),
    'utf8',
  )

  // Sin timeout, un host inalcanzable puede colgar el proceso mucho tiempo.
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 20_000,
  })
  try {
    console.log('Conectando a Postgres (hasta ~20s si no responde)...')
    await client.connect()
    console.log('Aplicando migración (pg_net + trigger)...')
    await client.query(sql)
    console.log('Guardando token en cuyo_internal.redeploy_trigger...')
    await client.query(
      `update cuyo_internal.redeploy_trigger
         set bearer_token = $1,
             endpoint_url = $2
       where id = 1`,
      [secret, endpoint],
    )
  } finally {
    await client.end()
  }

  console.log('Listo: webhook en member_profiles + token almacenado en cuyo_internal.redeploy_trigger.')
  console.log('Endpoint:', endpoint)
}

main().catch((e) => {
  console.error(e)
  if (e?.code === 'ETIMEDOUT' || e?.code === 'ECONNREFUSED') {
    console.error(
      '\nNo llega la conexión a Postgres. Revisá DATABASE_URL (host/puerto), VPN, y que la URI lleve sslmode=require si Supabase lo pide.',
    )
  }
  if (
    e?.message &&
    (e.message.includes('pg_net') || e.code === '0A000')
  ) {
    console.error(
      '\nSi falla la extensión: Supabase → Database → Extensions → activá pg_net y volvé a correr el script.',
    )
  }
  if (e?.code === '42P01' && e?.message?.includes('member_profiles')) {
    console.error(
      '\nLa tabla public.member_profiles no existe todavía; aplicá primero el esquema de perfiles en Supabase.',
    )
  }
  process.exit(1)
})
