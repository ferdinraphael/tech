import { expect, test } from '@playwright/test'

test('overview loads neutral and supports selection', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Software, systems/ })).toBeVisible()
  await expect(page.getByText('No constellation node selected.')).toBeAttached()
  const projects = page.getByRole('button', { name: /^Projects\./ })
  await projects.click()
  await expect(projects).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('article', { name: /Projects selected content/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(projects).toHaveAttribute('aria-pressed', 'false')
})

test('Little Worlds selected content uses approved actions', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /^Little Worlds\./ }).click()
  const panel = page.getByRole('article', { name: /Little Worlds selected content/ })
  await expect(panel.getByRole('link', { name: /Live Demo/ })).toHaveAttribute(
    'href',
    'https://ferdinraphael.github.io/little-worlds',
  )
  await expect(panel.getByText('TypeScript')).toBeVisible()
  await expect(panel.getByText('Python')).toHaveCount(0)
})

test('mobile sheet opens, closes, and bottom navigation stays clear', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.goto('./')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: /^Little Worlds\./ }).click()
  const dialog = page.getByRole('dialog', { name: /Little Worlds details/ })
  await expect(dialog).toBeVisible()
  const bottomNav = page.getByRole('navigation', { name: 'Mobile primary navigation' })
  const navBox = await bottomNav.boundingBox()
  const dialogBox = await dialog.boundingBox()
  expect(navBox && dialogBox && dialogBox.y + dialogBox.height <= navBox.y + 1).toBeTruthy()
  await dialog.getByRole('button', { name: /Close Little Worlds details/ }).click()
  await expect(dialog).toHaveCount(0)
})

test('routes, browser back, and clean /tech/ base path work', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Projects', exact: true }).first().click()
  await expect(page).toHaveURL(/\/tech\/projects$/)
  await expect(page.getByRole('heading', { name: /Built to explore/ })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/tech\/$/)
})

test('captures the primary desktop review states', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.screenshot({ path: 'visual-review/1536-default.png' })

  await page.getByRole('button', { name: /^Projects\./ }).click()
  await expect(page.getByRole('article', { name: /Projects selected content/ })).toBeVisible()
  await page.screenshot({ path: 'visual-review/1536-projects-selected.png' })

  await page.getByRole('button', { name: /^Little Worlds\./ }).click()
  await expect(
    page.getByRole('article', { name: /Little Worlds selected content/ }),
  ).toBeVisible()
  await page.screenshot({ path: 'visual-review/1536-little-worlds-selected.png' })
})

test('captures the primary mobile review states', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.screenshot({ path: 'visual-review/412-default.png' })

  await page.getByRole('button', { name: /^Little Worlds\./ }).click()
  const dialog = page.getByRole('dialog', { name: /Little Worlds details/ })
  await expect(dialog).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-little-worlds-open.png' })

  await dialog.getByRole('button', { name: /Close Little Worlds details/ }).click()
  await expect(dialog).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/412-little-worlds-closed.png' })
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
]) {
  test(`has no horizontal overflow or clipped primary navigation at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('./')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
    const primaryNav = viewport.width < 1200
      ? page.getByRole('button', { name: 'Open navigation menu' })
      : page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(primaryNav).toBeVisible()
    if (viewport.width < 768) {
      const bottomNav = page.getByRole('navigation', { name: 'Mobile primary navigation' })
      await expect(bottomNav).toBeVisible()
      const lastPanel = page.getByRole('heading', { name: 'Services' }).last()
      await lastPanel.scrollIntoViewIfNeeded()
      const navBox = await bottomNav.boundingBox()
      const panelBox = await lastPanel.boundingBox()
      expect(navBox && panelBox && panelBox.y + panelBox.height < navBox.y).toBeTruthy()
    }
  })
}
