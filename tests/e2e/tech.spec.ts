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

test('mobile context stays inline while selection and relationships persist', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const map = page.getByLabel("Interactive map of Ferdin Raphael's technical work")
  const littleWorlds = page.getByRole('button', { name: /^Little Worlds\./ })
  await littleWorlds.click()
  const inline = page.getByRole('region', { name: /Little Worlds inline details/ })
  await expect(inline).toBeVisible()
  await expect(littleWorlds).toHaveAttribute('aria-pressed', 'true')
  await expect(map).toHaveAttribute('data-selected', 'little-worlds')
  await expect(map.locator('[data-active="true"]')).toHaveCount(4)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const mapBox = await map.boundingBox()
  const inlineBox = await inline.boundingBox()
  expect(mapBox && inlineBox && inlineBox.y >= mapBox.y + mapBox.height).toBeTruthy()

  const bottomNav = page.getByRole('navigation', { name: 'Mobile primary navigation' })
  const clear = inline.getByRole('button', { name: 'Clear selection' })
  await clear.scrollIntoViewIfNeeded()
  const navBox = await bottomNav.boundingBox()
  const clearBox = await clear.boundingBox()
  expect(navBox && clearBox && clearBox.y + clearBox.height < navBox.y).toBeTruthy()

  await map.scrollIntoViewIfNeeded()
  await expect(map).toHaveAttribute('data-selected', 'little-worlds')
  await expect(map.locator('[data-active="true"]')).toHaveCount(4)

  await page.getByRole('button', { name: /^Projects\./ }).click()
  const projectsInline = page.getByRole('region', { name: /Projects inline details/ })
  await expect(projectsInline).toBeVisible()
  await expect(map).toHaveAttribute('data-selected', 'projects')
  await projectsInline.getByRole('button', { name: 'Clear selection' }).click()
  await expect(page.getByRole('region', { name: /inline details/ })).toHaveCount(0)
  await expect(map).toHaveAttribute('data-selected', 'none')
})

test('routes, browser back, and clean /tech/ base path work', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Projects', exact: true }).first().click()
  await expect(page).toHaveURL(/\/tech\/projects$/)
  await expect(page.getByRole('heading', { name: /Built to explore/ })).toBeVisible()
  const clickedNavOutline = await page
    .getByRole('link', { name: 'Projects', exact: true })
    .first()
    .evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(clickedNavOutline).toBe('none')
  await page.goBack()
  await expect(page).toHaveURL(/\/tech\/$/)
})

test('production Writings publishes the article while remaining draft-safe and canonical', async ({ page, context }) => {
  const title = 'When the Workaround Becomes the Architecture'
  const writingPath = './writings/when-the-workaround-becomes-the-architecture'
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4173',
  })
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.goto('./writings')
  await expect(page).toHaveURL(/\/tech\/writings$/)
  await expect(page.getByRole('heading', { name: 'Latest writings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No published writings yet.' })).toHaveCount(0)
  const publishedCard = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: title }),
  })
  await expect(publishedCard.getByText('Article', { exact: true })).toBeVisible()
  await expect(publishedCard.getByText('Published May 10, 2026', { exact: true })).toBeVisible()
  await expect(publishedCard.getByText('DRAFT', { exact: true })).toHaveCount(0)
  await expect(publishedCard.getByRole('link', { name: 'Read writing' })).toBeVisible()
  await expect(page.getByText('Technical writing framework preview')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Draft previews' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Writings', exact: true }).first()).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('a[href^="/notes"], a[href^="/tech/notes"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/1536-writings-published-index.png', fullPage: false })

  await publishedCard.getByRole('link', { name: 'Read writing' }).click()
  await expect(page).toHaveURL(/\/tech\/writings\/when-the-workaround-becomes-the-architecture$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.getByText('ARTICLE', { exact: true })).toBeVisible()
  await expect(page.getByText('Published May 10, 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('DRAFT', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Unpublished draft', { exact: true })).toHaveCount(0)
  await expect(page.getByText('FRAMEWORK PREVIEW', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Read this article as' })).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/1536-workaround-published-article-top.png', fullPage: false })

  await expect(page.getByRole('tab', { name: 'C#' })).toHaveCount(8)
  await expect(page.getByRole('tab', { name: 'TypeScript' })).toHaveCount(8)
  await expect(page.getByRole('tab', { name: 'Python' })).toHaveCount(8)
  await page.getByRole('tab', { name: 'TypeScript' }).first().click()
  await expect(page.getByRole('tab', { name: 'TypeScript', selected: true })).toHaveCount(8)
  const firstPanel = page.getByRole('tabpanel').first()
  const copyButton = firstPanel.getByRole('button', { name: 'Copy TypeScript code' })
  await copyButton.click()
  await expect(copyButton).toContainText('Copied')

  const contents = page.getByRole('navigation', { name: 'Contents' })
  const explicitLink = contents.getByRole('link', { name: 'Make the decision explicit' })
  await explicitLink.click()
  await expect(explicitLink).toHaveAttribute('aria-current', 'location')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('./writings/framework-preview')
  await expect(page.getByRole('heading', { name: 'That writing is not available.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Writings', exact: true }).first()).toHaveAttribute('aria-current', 'page')

  await page.goto('./notes/when-the-workaround-becomes-the-architecture')
  await expect(page).toHaveURL(/\/tech\/writings\/when-the-workaround-becomes-the-architecture$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

  await page.goto('./notes/unknown-writing#missing-section')
  await expect(page).toHaveURL(/\/tech\/writings\/unknown-writing#missing-section$/)
  await expect(page.getByRole('heading', { name: 'That writing is not available.' })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/tech\/writings\/when-the-workaround-becomes-the-architecture$/)

  await page.setViewportSize({ width: 412, height: 767 })
  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-writings-published-index.png', fullPage: false })

  await page.goto(writingPath)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-workaround-published-article-top.png', fullPage: false })
  const returnButton = page.getByRole('button', { name: /Return to this writing's Contents/ })
  await page.getByRole('heading', { name: 'AI can accelerate the same mistake' }).scrollIntoViewIfNeeded()
  await expect(returnButton).toBeVisible()
  await returnButton.click()
  await expect(page.getByRole('navigation', { name: 'Contents' })).toBeInViewport()

  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto(writingPath)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.goto('./writings')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
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

  for (const route of ['profile', 'projects', 'services', 'writings']) {
    await page.goto(`./${route}`)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    const headingSize = await heading.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    )
    expect(headingSize).toBeLessThanOrEqual(48)
    await page.screenshot({ path: `visual-review/1536-${route}-route.png` })
  }
})

test('captures the primary mobile review states', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.screenshot({ path: 'visual-review/412-default.png' })

  const map = page.getByLabel("Interactive map of Ferdin Raphael's technical work")
  await page.getByRole('button', { name: /^Little Worlds\./ }).click()
  const littleWorldsInline = page.getByRole('region', { name: /Little Worlds inline details/ })
  await expect(littleWorldsInline).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-little-worlds-inline.png' })

  await map.scrollIntoViewIfNeeded()
  await expect(map).toHaveAttribute('data-selected', 'little-worlds')
  await page.screenshot({ path: 'visual-review/412-little-worlds-map-active.png' })

  await page.getByRole('button', { name: /^Projects\./ }).click()
  const projectsInline = page.getByRole('region', { name: /Projects inline details/ })
  await expect(projectsInline).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-projects-inline.png' })

  await projectsInline.getByRole('button', { name: 'Clear selection' }).click()
  await map.scrollIntoViewIfNeeded()
  await expect(map).toHaveAttribute('data-selected', 'none')
  await page.screenshot({ path: 'visual-review/412-selection-cleared.png' })
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 375, height: 667 },
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
      const map = page.getByLabel("Interactive map of Ferdin Raphael's technical work")
      await expect(map.locator('[data-node-id]')).toHaveCount(9)
      await page.getByRole('button', { name: /^Projects\./ }).click()
      const inline = page.getByRole('region', { name: /Projects inline details/ })
      await expect(inline).toBeVisible()
      await expect(map).toHaveAttribute('data-selected', 'projects')
      const bottomNav = page.getByRole('navigation', { name: 'Mobile primary navigation' })
      await expect(bottomNav).toBeVisible()
      const clear = inline.getByRole('button', { name: 'Clear selection' })
      await clear.scrollIntoViewIfNeeded()
      const navBox = await bottomNav.boundingBox()
      const clearBox = await clear.boundingBox()
      expect(navBox && clearBox && clearBox.y + clearBox.height < navBox.y).toBeTruthy()
    }

    await page.goto('./writings')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await expect(page.getByRole('heading', { name: 'When the Workaround Becomes the Architecture' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No published writings yet.' })).toHaveCount(0)
    if (viewport.width < 768) {
      const bottomNav = page.getByRole('navigation', { name: 'Mobile primary navigation' })
      const readLink = page.getByRole('link', { name: 'Read writing' })
      await readLink.evaluate((element) => element.scrollIntoView({ block: 'center' }))
      await expect.poll(async () => {
        const navBox = await bottomNav.boundingBox()
        const linkBox = await readLink.boundingBox()
        return Boolean(navBox && linkBox && linkBox.y + linkBox.height < navBox.y)
      }).toBe(true)
    }
  })
}
