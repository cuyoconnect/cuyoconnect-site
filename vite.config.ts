import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/$/, '')
  const ogImage = siteUrl
    ? `${siteUrl}/cuyo-connect-hero.png`
    : '/cuyo-connect-hero.png'
  const ogUrl = siteUrl ? `${siteUrl}/` : '/'

  return {
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'html-site-meta',
      transformIndexHtml(html) {
        return html
          .replaceAll('%OG_IMAGE%', ogImage)
          .replaceAll('%OG_URL%', ogUrl)
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  }
})
