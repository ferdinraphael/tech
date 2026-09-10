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
    await page.reload()
    await expect(page).toHaveTitle(title)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}

test('titles follow navigation, history, legacy redirects, and unknown routes', async ({ page }) => {
  await page.goto('./projects')
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Services', exact: true }).click()
  await expect(page).toHaveTitle('Services — Ferdin Raphael')
  await page.goBack()
  await expect(page).toHaveTitle('Projects — Ferdin Raphael')
  await page.goto('./notes')
  await expect(page).toHaveURL(/\/tech\/writings$/)
  await expect(page).toHaveTitle('Writings — Ferdin Raphael')
  await page.goto('./not-a-real-place')
  await expect(page.getByRole('heading', { name: /not in the constellation/ })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
  await page.reload()
  await expect(page.getByRole('heading', { name: /not in the constellation/ })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
  await page.goto('./writings/not-a-real-writing')
  await expect(page.getByRole('heading', { name: 'That writing is not available.' })).toBeVisible()
  await expect(page).toHaveTitle('Not Found — Ferdin Raphael')
})
