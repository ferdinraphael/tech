import { expect, test } from '@playwright/test'

const routes = [
  ['./', 'Ferdin Raphael — Software & Systems'],
  ['./projects', 'Projects — Ferdin Raphael'],
  ['./built-and-published', 'Built & Published — Ferdin Raphael'],
  ['./services', 'Services — Ferdin Raphael'],
  ['./services/software-development', 'Software Development — Ferdin Raphael'],
  ['./services/technical-consulting', 'Technical Consulting — Ferdin Raphael'],
  ['./services/mentoring-teaching', 'Mentoring & Teaching — Ferdin Raphael'],
  ['./writings', 'Writings — Ferdin Raphael'],
  ['./writings/when-the-workaround-becomes-the-architecture', 'When the Workaround Becomes the Architecture — Ferdin Raphael'],
] as const

for (const [route, title] of routes) {
  test(`direct load and reload retain the title at ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveTitle(title)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const canonical = `https://ferdinraphael.github.io/tech/${route === './' ? '' : route.slice(2) + '/'}`
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', canonical)
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /\S+/)
    await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', canonical)
    await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', title)
    await expect(page.locator('head meta[name="twitter:title"]')).toHaveAttribute('content', title)
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
    await page.reload()
    await expect(page).toHaveTitle(title)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', canonical)
  })
}

test('titles follow navigation, history, legacy redirects, and unknown routes', async ({ page }) => {
  await page.goto('./projects')
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Services', exact: true }).click()
  await expect(page).toHaveTitle('Services — Ferdin Raphael')
  await page.goBack()
  await expect(page).toHaveTitle('Projects — Ferdin Raphael')
  await page.goto('./notes')
  await expect(page).toHaveURL(/\/tech\/writings\/$/)
  await expect(page).toHaveTitle('Writings — Ferdin Raphael')
  await page.goto('./not-a-real-place')
  await expect(page.getByRole('heading', { name: /not in the constellation/ })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: /not in the constellation/ })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
  await page.goto('./writings/not-a-real-writing')
  await expect(page.getByRole('heading', { name: 'That writing is not available.' })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
})

test('production crawl files are served and the sitemap is valid XML', async ({ page, request }) => {
  const robots = await request.get('./robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain('Sitemap: https://ferdinraphael.github.io/tech/sitemap.xml')
  const sitemap = await request.get('./sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const result = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    return { errors: document.querySelectorAll('parsererror').length, urls: Array.from(document.querySelectorAll('loc'), (node) => node.textContent) }
  }, await sitemap.text())
  expect(result.errors).toBe(0)
  expect(result.urls).toEqual(routes.map(([route]) => `https://ferdinraphael.github.io/tech/${route === './' ? '' : route.slice(2) + '/'}`))
})
