import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const html = path.join(root, 'public/posters/queres-ser-speaker.html')
const out = path.join(root, 'public/posters/queres-ser-speaker.png')

await mkdir(path.dirname(out), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 2,
})

await page.goto(`file://${html}`, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.locator('.poster').screenshot({ path: out, type: 'png' })
await browser.close()

console.log(out)
