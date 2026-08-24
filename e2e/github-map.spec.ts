import { expect, test, type Page } from '@playwright/test'

const MAP_FIXTURE = {
  scope: 'all',
  fetchedAt: '2026-08-24T12:00:00.000Z',
  cacheVersion: 7,
  members: [],
  projects: [
    {
      fullName: 'ana/cuyo-app',
      commits: 280,
      stars: 12,
      language: 'TypeScript',
      homepageUrl: 'https://cuyo-app.vercel.app',
      description: 'App de la comunidad',
    },
    {
      fullName: 'ana/notas',
      commits: 140,
      stars: 3,
      language: 'Python',
      homepageUrl: 'https://ana-notas.vercel.app',
      description: 'Notas',
    },
    {
      fullName: 'mati/connect',
      commits: 210,
      stars: 8,
      language: 'TypeScript',
      homepageUrl: 'https://mati-connect.vercel.app',
      description: 'Connect',
    },
    {
      fullName: 'sofia/ui',
      commits: 50,
      stars: 4,
      language: 'CSS',
      homepageUrl: 'https://sofia-ui.vercel.app',
      description: 'UI kit',
    },
  ],
}

async function mockGithubMap(page: Page) {
  await page.route('**/api/github-map**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MAP_FIXTURE),
    })
  })
}

test.describe('mapa Voronoi de proyectos', () => {
  test('muestra proyectos por commits y abre la homepage', async ({ page }) => {
    await mockGithubMap(page)
    await page.goto('/proyectos')

    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'CuyoConnect' })).toBeVisible()

    const cuyoApp = page.getByRole('button', { name: /cuyo-app/i })
    await expect(cuyoApp).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /notas/i })).toBeVisible()

    const cellCount = await page.locator('svg path').count()
    expect(cellCount).toBeGreaterThanOrEqual(3)

    const popupPromise = page.waitForEvent('popup')
    await cuyoApp.click()
    const popup = await popupPromise
    expect(popup.url()).toMatch(/^https:\/\/cuyo-app\.vercel\.app\/?$/)
  })

  test('el teaser de la home muestra el mapa y el CTA', async ({ page }) => {
    await mockGithubMap(page)
    await page.goto('/')

    const section = page.locator('#proyectos')
    await section.scrollIntoViewIfNeeded()
    await expect(
      page.getByRole('heading', { name: 'Proyectos de la comunidad' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar el mapa' })).toHaveAttribute(
      'href',
      '/proyectos',
    )
    await expect(page.getByRole('button', { name: /cuyo-app/i })).toBeVisible({
      timeout: 20_000,
    })
  })
})
