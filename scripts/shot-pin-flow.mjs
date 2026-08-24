import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (message) => {
  const text = message.text()
  if (
    message.type() === 'error' ||
    text.includes('placeCard') ||
    text.includes('onSelect')
  ) {
    console.log('page:', text)
  }
})
page.on('pageerror', (error) => console.log('page error:', error.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

const cells = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-map-cell]')]
    .map((path) => {
      const box = path.getBoundingClientRect()
      return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        area: box.width * box.height,
      }
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, 3)
})

const cardBox = () =>
  page.evaluate(() => {
    const card = document.querySelector('[data-card-root]')
    const rect = card?.getBoundingClientRect()
    return {
      pos: rect ? { x: Math.round(rect.x), y: Math.round(rect.y) } : null,
      fijada: Boolean(card?.querySelector('a[aria-label*="GitHub"]')),
      titulo: card?.querySelector('h3')?.textContent ?? null,
    }
  })

async function click(point) {
  await page.mouse.move(point.x, point.y, { steps: 10 })
  await page.waitForTimeout(400)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(900)
}

await click(cells[0])
console.log('1) fijo A en', Math.round(cells[0].x), Math.round(cells[0].y), '-> card', await cardBox())
await page.screenshot({ path: 'tmp-pin-a.png' })

await click(cells[1])
console.log('2) fijo B en', Math.round(cells[1].x), Math.round(cells[1].y), '-> card', await cardBox())
await page.screenshot({ path: 'tmp-pin-b.png' })

await click(cells[1])
console.log('3) reclic en B -> card', await cardBox(), '(null = soltada)')
await page.screenshot({ path: 'tmp-pin-c.png' })

await browser.close()
