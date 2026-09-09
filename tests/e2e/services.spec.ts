import { expect, test } from '@playwright/test'

const services = [
  { slug: 'software-development', title: 'Software Development', heading: 'From a problem or idea to working software.' },
  { slug: 'technical-consulting', title: 'Technical Consulting', heading: 'Understand the problem before committing to the solution.' },
  { slug: 'mentoring-teaching', title: 'Mentoring & Teaching', heading: 'Learn by understanding the problem and doing the work.' },
]
const viewports = [
  { width: 1536, height: 864 },
  { width: 1366, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 412, height: 767 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
]
const screenshots = 'visual-review/service-detail-pages'

test('services are reachable from Overview and the index with canonical deep links', async ({ page }) => {
  await page.goto('./')
  const preview = page.getByRole('region', { name: 'Services', exact: true })
  await expect(preview.getByRole('article')).toHaveCount(3)
  await expect(preview.getByText('All services are remote.')).toBeVisible()
  await expect(page.getByText(/Technical Content|Website in 2 Days|Variables Are Simple/i)).toHaveCount(0)
  for (const service of services) {
    await expect(preview.getByRole('link', { name: `Explore ${service.title}` })).toHaveAttribute('href', `/tech/services/${service.slug}`)
    await preview.getByRole('link', { name: `Explore ${service.title}` }).click()
    await expect(page).toHaveURL(new RegExp(`/tech/services/${service.slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: service.heading })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: service.heading })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('main').locator('a[href^="mailto:"]')).toHaveCount(2)
    await page.getByRole('link', { name: 'Back to Services' }).click()
    await expect(page.getByRole('article')).toHaveCount(3)
    for (const item of services) {
      await expect(page.getByRole('article', { name: item.title }).getByRole('link')).toHaveAttribute('href', `/tech/services/${item.slug}`)
    }
    await page.getByRole('link', { name: `Explore ${service.title}` }).click()
    await expect(page.getByRole('heading', { name: service.heading })).toBeVisible()
    await page.goto('./')
  }
})

test('mobile navigation keeps only the public IA and closes after choosing Services', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('./services/mentoring-teaching')
  const bottom = page.getByRole('navigation', { name: 'Mobile primary navigation' })
  await expect(bottom.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  const drawer = page.getByRole('navigation', { name: 'Mobile navigation', exact: true })
  await expect(drawer.getByRole('link')).toHaveText([
    'Overview', 'Projects', 'Built & Published', 'Services', 'Writings', 'GitHub', 'Email',
  ])
  await page.screenshot({ path: `${screenshots}/375-navigation.png` })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused()
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  await drawer.getByRole('link', { name: 'Services', exact: true }).click()
  await expect(drawer).toHaveCount(0)
  await page.getByRole('link', { name: 'Explore Software Development' }).click()
  await expect(page.getByRole('heading', { name: services[0].heading })).toBeVisible()
  await bottom.getByRole('link', { name: 'Services' }).click()
  await expect(page.getByRole('heading', { name: /Practical technical help/ })).toBeVisible()
})

for (const viewport of viewports) {
  test(`service pages remain readable and reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const path of ['', 'services', ...services.map(({ slug }) => `services/${slug}`)]) {
      await page.goto(`./${path}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
      await expect(page.getByText(/Technical Content|Website in 2 Days|Variables Are Simple/i)).toHaveCount(0)
      const name = path.replaceAll('/', '-') || 'overview-services'
      if (!path) {
        await page.getByRole('region', { name: 'Services', exact: true }).scrollIntoViewIfNeeded()
      }
      await page.screenshot({ path: `${screenshots}/${viewport.width}-${name}-top.png` })
      if (path === 'services') {
        await expect(page.getByRole('article')).toHaveCount(3)
        await page.screenshot({ path: `${screenshots}/${viewport.width}-services-full.png`, fullPage: true })
      }
      if (!path.startsWith('services/')) continue

      await page.screenshot({ path: `${screenshots}/${viewport.width}-${name}-full.png`, fullPage: true })
      if (path.endsWith('mentoring-teaching')) {
        const rates = page.getByText('₹1,500/hour', { exact: true })
        await expect(rates).toHaveCount(2)
        await rates.first().scrollIntoViewIfNeeded()
        await expect(rates.first()).toBeInViewport()
        expect(await rates.first().evaluate((element) => element.getClientRects().length)).toBe(1)
        await page.screenshot({ path: `${screenshots}/${viewport.width}-mentoring-rate.png` })
      } else {
        await expect(page.getByRole('main')).not.toContainText(/[₹$€£]|\d[\d,.]*\s*(?:\/|per\s+)(?:hour|hr|day|week|month)/i)
      }

      const closing = page.getByRole('region').last()
      const action = closing.getByRole('link')
      await action.evaluate((element) => element.scrollIntoView({ block: 'center' }))
      await expect(action).toBeInViewport()
      if (viewport.width < 768) {
        const bottom = page.getByRole('navigation', { name: 'Mobile primary navigation' })
        const navBox = await bottom.boundingBox()
        const actionBox = await action.boundingBox()
        expect(navBox && actionBox && actionBox.y + actionBox.height < navBox.y).toBeTruthy()
      } else {
        await expect(page.getByRole('contentinfo')).toBeVisible()
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.screenshot({ path: `${screenshots}/${viewport.width}-${name}-end.png` })
      await expect(page.getByRole('link', { name: 'All services', exact: true })).toBeInViewport()
    }
    expect(errors).toEqual([])
  })
}

test('Variables and preview drafts remain unavailable in production', async ({ page }) => {
  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: 'When the Workaround Becomes the Architecture' })).toBeVisible()
  await expect(page.getByText(/Variables Are Simple|Draft previews/i)).toHaveCount(0)
  for (const slug of ['variables-are-simple-until-they-arent', 'framework-preview', 'language-aware-preview']) {
    await page.goto(`./writings/${slug}`)
    await expect(page.getByRole('heading', { name: 'That writing is not available.' })).toBeVisible()
  }
})
