import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

const target = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('svg path[style*="pointer-events"]')]
  let best = null
  let bestArea = 0
  for (const path of paths) {
    const box = path.getBoundingClientRect()
    const area = box.width * box.height
    if (area > bestArea) {
      bestArea = area
      best = { x: box.x, y: box.y, w: box.width, h: box.height }
    }
  }
  return best
})

const clip = {
  x: Math.max(target.x - 40, 0),
  y: Math.max(target.y - 40, 0),
  width: target.w + 80,
  height: target.h + 80,
}

await page.screenshot({ path: 'tmp-cell-idle.png', clip })
await page.mouse.move(target.x + target.w / 2, target.y + target.h / 2, { steps: 10 })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'tmp-cell-hover.png', clip })
console.log('ok tmp-cell-idle.png tmp-cell-hover.png')

await browser.close()
