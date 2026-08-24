import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('console error:', msg.text())
})
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

const wanted = process.argv[3] ?? ''

let cell = null
if (wanted) {
  const box = await page
    .getByText(wanted, { exact: false })
    .first()
    .boundingBox()
    .catch(() => null)
  if (box) cell = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  else console.log('no encontré la etiqueta', wanted)
}

cell = cell ?? (await page.evaluate(() => {
  const paths = [...document.querySelectorAll('svg path[style*="pointer-events"]')]
  const boxes = paths
    .map((path) => {
      const box = path.getBoundingClientRect()
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, area: box.width * box.height }
    })
    .sort((a, b) => b.area - a.area)
  return boxes[1] ?? boxes[0]
}))

await page.mouse.move(cell.x, cell.y, { steps: 12 })
await page.waitForTimeout(600)
await page.mouse.down()
await page.mouse.up()
await page.waitForTimeout(180)
await page.screenshot({ path: 'tmp-pinned-mid.png' })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'tmp-pinned.png' })

console.log('ok tmp-pinned-mid.png tmp-pinned.png')
await browser.close()
