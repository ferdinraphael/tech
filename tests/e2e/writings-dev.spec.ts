import { expect, test } from '@playwright/test'

test.skip(process.env.WRITINGS_DEV_PREVIEW !== '1', 'Runs only against the bounded development preview.')

const writingPath = './writings/framework-preview'

test('desktop writing tracks active headings, direct hashes, history, tabs, copy, and review states', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4174',
  })
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.goto(writingPath)

  await expect(page.getByRole('heading', { level: 1, name: 'Technical writing framework preview' })).toBeVisible()
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
  const contents = page.getByRole('navigation', { name: 'Contents' })
  await expect(contents).toBeVisible()
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toHaveAttribute('aria-current', 'location')
  await expect(page.getByRole('button', { name: /Return to this writing's Contents/ })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Related projects' })).toBeAttached()
  await page.screenshot({ path: 'visual-review/1536-writings-framework-top.png', fullPage: false })

  const examplesLink = contents.getByRole('link', { name: 'Equivalent examples', exact: true })
  await examplesLink.click()
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(/#equivalent-examples$/)
  const examplesHeading = page.getByRole('heading', { name: 'Equivalent examples' })
  await expect(examplesHeading).toBeInViewport()
  const headingBox = await examplesHeading.boundingBox()
  expect(headingBox && headingBox.y >= 66 && headingBox.y < 864).toBeTruthy()
  await page.screenshot({ path: 'visual-review/1536-writings-equivalent-examples-active.png', fullPage: false })

  const nestedLink = contents.getByRole('link', { name: 'Graceful preference fallback' })
  await nestedLink.click()
  await expect(nestedLink).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(/#graceful-preference-fallback$/)

  const finalLink = contents.getByRole('link', { name: 'Portable Markdown elements' })
  await finalLink.click()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(finalLink).toHaveAttribute('aria-current', 'location')
  await page.screenshot({ path: 'visual-review/1536-writings-portable-markdown-active.png', fullPage: false })

  await contents.getByRole('link', { name: 'What this fixture checks' }).focus()
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toBeFocused()
  await expect(finalLink).toHaveAttribute('aria-current', 'location')

  await page.goBack()
  await expect(page).toHaveURL(/#graceful-preference-fallback$/)
  await expect(nestedLink).toHaveAttribute('aria-current', 'location')
  await page.goBack()
  await expect(page).toHaveURL(/#equivalent-examples$/)
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')

  await page.getByRole('tab', { name: 'Python' }).first().click()
  await expect(page.getByRole('tab', { name: 'Python', selected: true })).toHaveCount(2)
  const visiblePanel = page.getByRole('tabpanel').first()
  await visiblePanel.getByRole('button', { name: 'Copy Python code' }).click()
  await expect(visiblePanel.getByRole('button', { name: 'Copy Python code' })).toContainText('Copied')

  await page.goto(`${writingPath}#equivalent-examples`)
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')
  const directHeadingBox = await examplesHeading.boundingBox()
  expect(directHeadingBox && directHeadingBox.y >= 66 && directHeadingBox.y < 864).toBeTruthy()

  await examplesHeading.evaluate((heading) => window.scrollTo(0, heading.offsetTop + 350))
  await page.getByRole('heading', { name: 'What this fixture checks' }).evaluate((heading) => window.scrollTo(0, heading.offsetTop - 90))
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toHaveAttribute('aria-current', 'location')

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: 'No published writings yet.' })).toBeVisible()
  await page.screenshot({ path: 'visual-review/1536-writings-index.png', fullPage: false })
})

test('mobile Contents control appears only after the TOC, preserves state, and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.goto(writingPath)

  const contents = page.getByRole('navigation', { name: 'Contents' })
  const returnButton = page.getByRole('button', { name: /Return to this writing's Contents/ })
  await expect(contents).toBeVisible()
  await expect(returnButton).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/412-writings-contents-visible.png', fullPage: false })

  const examplesHeading = page.getByRole('heading', { name: 'Equivalent examples' })
  await examplesHeading.scrollIntoViewIfNeeded()
  const pythonTab = page.getByRole('tab', { name: 'Python' }).first()
  await pythonTab.focus()
  await expect(returnButton).toBeVisible()
  await expect(pythonTab).toBeFocused()
  await expect(contents.getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')

  const buttonBox = await returnButton.boundingBox()
  const bottomNavBox = await page.getByRole('navigation', { name: 'Mobile primary navigation' }).boundingBox()
  expect(buttonBox && bottomNavBox && buttonBox.y + buttonBox.height < bottomNavBox.y).toBeTruthy()
  await page.screenshot({ path: 'visual-review/412-writings-deep-contents-control.png', fullPage: false })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
      ;(window as typeof window & { __contentsScrollBehavior?: ScrollBehavior }).__contentsScrollBehavior =
        typeof options === 'object' ? options.behavior : undefined
      return original.call(this, options)
    }
  })
  await returnButton.click()
  await expect(contents).toBeInViewport()
  await expect(returnButton).toHaveCount(0)
  await expect(contents.getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')
  expect(await page.evaluate(() => (window as typeof window & { __contentsScrollBehavior?: ScrollBehavior }).__contentsScrollBehavior)).toBe('auto')
  await page.screenshot({ path: 'visual-review/412-writings-after-contents-return.png', fullPage: false })

  await page.getByRole('heading', { name: 'Equivalent examples' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('tab', { name: 'C#', selected: true })).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-writings-code-tabs.png', fullPage: false })

  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: 'No published writings yet.' })).toBeVisible()
  await expect(returnButton).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/412-writings-index.png', fullPage: false })
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`writing remains responsive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(`${writingPath}#equivalent-examples`)
    await expect(page.getByRole('heading', { name: 'Equivalent examples' })).toBeInViewport()
    await expect(page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

    if (viewport.width < 768) {
      await page.getByRole('heading', { name: 'Portable Markdown elements' }).scrollIntoViewIfNeeded()
      const control = page.getByRole('button', { name: /Return to this writing's Contents/ })
      await expect(control).toBeVisible()
      const controlBox = await control.boundingBox()
      const navBox = await page.getByRole('navigation', { name: 'Mobile primary navigation' }).boundingBox()
      expect(controlBox && navBox && controlBox.y + controlBox.height < navBox.y).toBeTruthy()
    } else {
      await expect(page.getByRole('button', { name: /Return to this writing's Contents/ })).toHaveCount(0)
    }
  })
}
