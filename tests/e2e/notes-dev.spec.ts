import { expect, test } from '@playwright/test'

test.skip(process.env.NOTES_DEV_PREVIEW !== '1', 'Runs only against the bounded development preview.')

test('development draft article supports navigation, tabs, copy, anchors, and responsive review', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4174',
  })
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.goto('./notes/framework-preview')
  await expect(page.getByRole('heading', { level: 1, name: 'Technical writing framework preview' })).toBeVisible()
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Related projects' })).toBeAttached()

  const tocLink = page.getByRole('link', { name: 'Equivalent examples', exact: true })
  await tocLink.click()
  const examplesHeading = page.getByRole('heading', { name: 'Equivalent examples' })
  await expect(page).toHaveURL(/#equivalent-examples$/)
  await expect(examplesHeading).toBeInViewport()
  const headingBox = await examplesHeading.boundingBox()
  expect(headingBox && headingBox.y >= 66 && headingBox.y < 864).toBeTruthy()

  await expect(page.getByRole('tab', { name: 'C#', selected: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Python' }).first().click()
  await expect(page.getByRole('tab', { name: 'Python', selected: true })).toHaveCount(2)
  const visiblePanel = page.getByRole('tabpanel').first()
  await visiblePanel.getByRole('button', { name: 'Copy Python code' }).click()
  await expect(visiblePanel.getByRole('button', { name: 'Copy Python code' })).toContainText('Copied')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.screenshot({ path: 'visual-review/1536-notes-framework-preview.png' })

  await page.setViewportSize({ width: 412, height: 767 })
  await page.reload()
  await page.getByRole('heading', { name: 'Equivalent examples' }).scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.screenshot({ path: 'visual-review/412-notes-framework-preview.png' })

  const returnLink = page.getByRole('navigation', { name: 'Return to technical notes' })
  await returnLink.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect.poll(async () => {
    const navBox = await page.getByRole('navigation', { name: 'Mobile primary navigation' }).boundingBox()
    const returnBox = await returnLink.boundingBox()
    return Boolean(navBox && returnBox && returnBox.y + returnBox.height < navBox.y)
  }).toBe(true)
})
