import { expect, test } from '@playwright/test'

test('local production preview does not initialize Google analytics', async ({ page }) => {
  const googleRequests: string[] = []
  await page.route(/(?:googletagmanager|google-analytics)\.com/, (route) => {
    googleRequests.push(route.request().url())
    return route.abort()
  })
  await page.goto('./projects/')
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Services', exact: true }).click()
  await expect(page).toHaveTitle('Services — Ferdin Raphael')
  await expect(page.locator('#site-ga4')).toHaveCount(0)
  expect(await page.evaluate(() => ({ tag: typeof window.gtag, queue: typeof window.dataLayer }))).toEqual({ tag: 'undefined', queue: 'undefined' })
  expect(googleRequests).toEqual([])
})

test('production-host analytics stays optional and configures once across SPA navigation', async ({ page, baseURL }) => {
  const errors: string[] = []
  const googleRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  // Serve the local built artifact under a simulated production origin. No live site or Google traffic.
  const localOrigin = new URL(baseURL!).origin
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === 'https://ferdinraphael.github.io' && url.pathname.startsWith('/tech/')) {
      const response = await page.request.get(`${localOrigin}${url.pathname}${url.search}`)
      return route.fulfill({ response })
    }
    if (url.hostname === 'www.googletagmanager.com') googleRequests.push(url.href)
    return route.abort()
  })
  await page.goto('https://ferdinraphael.github.io/tech/projects')
  await expect(page).toHaveTitle('Projects — Ferdin Raphael')
  await expect.poll(() => googleRequests.length).toBe(1)
  await page.evaluate(() => {
    const state = window as Window & { preventedBeforeTest?: boolean[] }
    state.preventedBeforeTest = []
    document.addEventListener('click', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (link && /^(https:|mailto:)/.test(link.getAttribute('href') ?? '')) {
        state.preventedBeforeTest!.push(event.defaultPrevented)
        event.preventDefault() // Test-only: do not open external sites or a real mail client.
      }
    })
  })
  await page.getByRole('region', { name: 'Little Worlds', exact: true }).getByRole('link', { name: 'Live Demo', exact: true }).click()
  await page.getByRole('link', { name: 'Play Wildpath', exact: true }).click()
  const navigation = page.getByRole('navigation', { name: 'Primary navigation', exact: true })
  await navigation.getByRole('link', { name: 'Built & Published', exact: true }).click()
  await page.getByRole('link', { name: 'View on Amazon', exact: true }).first().click()
  await navigation.getByRole('link', { name: 'Services', exact: true }).click()
  await page.locator('a[href="/tech/services/software-development/"]').first().click()
  await expect(page).toHaveTitle('Software Development — Ferdin Raphael')
  const enquiry = page.locator('main a[href^="mailto:"]').first()
  await expect(enquiry).toHaveAttribute('href', /^mailto:/)
  await enquiry.click()
  const commands = await page.evaluate(() => (window.dataLayer ?? []).map((command) => Array.from(command as IArguments)))
  expect(commands.filter((command) => command[0] === 'config')).toEqual([['config', 'G-G1V96CEM5J']])
  expect(commands.filter((command) => command[0] === 'event')).toEqual([
    ['event', 'project_open', { project_name: 'Little Worlds', destination_type: 'live_demo' }],
    ['event', 'project_open', { project_name: 'Wildpath', destination_type: 'live_demo' }],
    ['event', 'published_output_open', { item_name: 'C# Debugging Drills: 20 Real-World Bugs to Find and Fix', item_type: 'book', destination: 'www.amazon.com' }],
    ['event', 'service_enquiry', { source_page: 'software-development', service_category: 'Software Development', link_type: 'mailto' }],
  ])
  await page.evaluate(() => { delete window.gtag })
  await enquiry.click()
  expect(await page.evaluate(() => (window as Window & { preventedBeforeTest?: boolean[] }).preventedBeforeTest)).toEqual([false, false, false, false, false])
  await navigation.getByRole('link', { name: 'Overview', exact: true }).click()
  await expect(page).toHaveTitle('Ferdin Raphael — Software & Systems')
  await expect(page.locator('#site-ga4')).toHaveCount(1)
  expect(googleRequests).toHaveLength(1)
  expect(errors).toEqual([])
})
