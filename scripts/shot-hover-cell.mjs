import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4344/proyectos'
const x = Number(process.argv[3] ?? 200)
const y = Number(process.argv[4] ?? 460)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await page.screenshot({ path: 'tmp-cell-idle.png', clip: { x: x - 260, y: y - 200, width: 520, height: 400 } })
await page.mouse.move(x, y, { steps: 10 })
await page.waitForTimeout(1000)
await page.screenshot({ path: 'tmp-cell-hover.png', clip: { x: x - 260, y: y - 200, width: 520, height: 400 } })
await browser.close()
console.log('ok tmp-cell-idle.png tmp-cell-hover.png')
