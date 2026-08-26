import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
 
import { githubMapDevApi } from './src/lib/github-map/dev-api-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), githubMapDevApi()],
    server: {
      watch: {
        ignored: ['**/.vercel/**', '**/dist/**'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
})
