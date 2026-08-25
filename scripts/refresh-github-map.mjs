import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const server = await createServer({
  root,
  configFile: path.join(root, 'astro.config.ts'),
  server: { middlewareMode: true },
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})

try {
  const mod = await server.ssrLoadModule('/src/lib/github-map/server.ts')
  const payload = await mod.refreshGithubMapPayload('all')
  const cacheFile = path.join(root, 'node_modules/.cache', 'github-map-all.json')
  console.log(
    JSON.stringify(
      {
        ok: true,
        members: payload.members.length,
        projects: payload.projects.length,
        fetchedAt: payload.fetchedAt,
        cacheFile,
        top: payload.projects.slice(0, 8).map((project) => ({
          name: project.fullName,
          commits: project.commits,
        })),
      },
      null,
      2,
    ),
  )
} finally {
  await server.close()
}
