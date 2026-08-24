import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'
const out = process.argv[3] ?? 'tmp-map-shot.png'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

page.on('console', (message) => {
  if (message.type() === 'error') console.log(`[error] ${message.text()}`)
})
page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await page.screenshot({ path: out })
console.log(`ok ${out}`)

const target = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('svg path[style*="pointer-events"]')]
  let best = null
  let bestArea = 0
  for (const path of paths) {
    const box = path.getBoundingClientRect()
    const area = box.width * box.height
    if (area > bestArea) {
      bestArea = area
      best = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    }
  }
  return best
})

if (!target) {
  console.log('no se encontró ninguna región interactiva')
  await browser.close()
  process.exit(0)
}

await page.mouse.move(target.x, target.y, { steps: 12 })
await page.waitForTimeout(1400)
await page.screenshot({ path: out.replace('.png', '-hover.png') })
console.log(`ok ${out.replace('.png', '-hover.png')}`)

// Clic: la card debería quedar fija.
await page.mouse.click(target.x, target.y)
await page.waitForTimeout(500)
await page.mouse.move(target.x - 260, target.y + 150, { steps: 15 })
await page.waitForTimeout(900)
await page.screenshot({ path: out.replace('.png', '-pinned.png') })
console.log(`ok ${out.replace('.png', '-pinned.png')}`)

// Clic afuera: debería soltarse.
await page.mouse.click(40, 700)
await page.waitForTimeout(700)
const stillPinned = await page.evaluate(() =>
  Boolean(document.querySelector('a[href^="http"][class*="underline"]')),
)
console.log(`card visible tras clic afuera: ${stillPinned}`)

await browser.close()
