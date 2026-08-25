import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import type { Plugin } from 'vite'

import type { GithubMapPayload } from './types'

type GithubMapServer = {
  readGithubMapPayload: (scope?: string | null) => Promise<GithubMapPayload>
  refreshGithubMapPayload: (scope?: string | null) => Promise<GithubMapPayload>
}

const pluginDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(pluginDir, '../../..')

function runRefreshScript() {
  return new Promise<{ members: number; fetchedAt: string | null }>((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/refresh-github-map.mjs'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.slice(-500) || stdout.slice(-500) || `exit ${code}`))
        return
      }
      try {
        const parsed = JSON.parse(stdout.trim().split('\n').pop() ?? '{}') as {
          members?: number
          fetchedAt?: string | null
        }
        resolve({
          members: parsed.members ?? 0,
          fetchedAt: parsed.fetchedAt ?? null,
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  })
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  cacheControl?: string,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cacheControl) res.setHeader('Cache-Control', cacheControl)
  res.end(JSON.stringify(body))
}

/**
 * En `astro dev`, Vite sirve `api/*.ts` como módulos. Este plugin responde
 * `/api/github-map` y `/api/github-map-refresh` con JSON.
 */
export function githubMapDevApi(): Plugin {
  return {
    name: 'github-map-dev-api',
    configureServer(server) {
      const handle = async (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => {
        const pathname = (req.url ?? '').split('?')[0]?.replace(/\/+$/, '') ?? ''
        const isRead = pathname === '/api/github-map'
        const isRefresh = pathname === '/api/github-map-refresh'
        if (!isRead && !isRefresh) {
          next()
          return
        }

        const method = req.method ?? 'GET'
        if (isRead && method !== 'GET' && method !== 'HEAD') {
          next()
          return
        }
        if (isRefresh && method !== 'GET' && method !== 'POST' && method !== 'HEAD') {
          next()
          return
        }

        try {
          const mod = (await server.ssrLoadModule(
            '/src/lib/github-map/server.ts',
          )) as GithubMapServer
          const scope = new URL(req.url ?? '/', 'http://localhost').searchParams.get(
            'scope',
          )

          if (isRefresh) {
            const scopeValue = scope ?? 'all'
            try {
              const refreshed = await runRefreshScript()
              sendJson(res, 200, {
                ok: true,
                scope: scopeValue,
                members: refreshed.members,
                fetchedAt: refreshed.fetchedAt,
              })
            } catch (error) {
              const mod = (await server.ssrLoadModule(
                '/src/lib/github-map/server.ts',
              )) as GithubMapServer
              const payload = await mod.refreshGithubMapPayload(scope)
              sendJson(res, 200, {
                ok: true,
                scope: payload.scope,
                members: payload.members.length,
                fetchedAt: payload.fetchedAt,
              })
            }
            return
          }

          const payload = await mod.readGithubMapPayload(scope)
          if (method === 'HEAD') {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end()
            return
          }
          sendJson(
            res,
            200,
            payload,
            'public, max-age=60',
          )
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error)
          sendJson(res, 502, {
            error: isRefresh
              ? 'No se pudo actualizar el mapa de GitHub.'
              : 'No se pudo leer el mapa de GitHub.',
            detail: detail.slice(0, 500),
          })
        }
      }

      server.middlewares.use(handle)
      const layer = server.middlewares.stack.pop()
      if (layer) server.middlewares.stack.unshift(layer)
    },
  }
}
