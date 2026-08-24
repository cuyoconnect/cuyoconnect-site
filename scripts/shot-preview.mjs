import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('console error:', msg.text())
})
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

const cells = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('svg path[style*="pointer-events"]')]
  return paths
    .map((path) => {
      const box = path.getBoundingClientRect()
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, area: box.width * box.height }
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, 4)
})

let index = 0
for (const cell of cells) {
  index += 1
  await page.mouse.move(cell.x, cell.y, { steps: 12 })
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `tmp-preview-${index}.png` })
}

console.log('ok', cells.length, 'capturas')
await browser.close()
