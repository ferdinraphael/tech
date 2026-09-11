import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { publicRouteMetadata, routeShellPath } from '../../scripts/route-shells.mjs'
import { resolvePageMetadata } from '../../src/seo'
import { startStaticFileServer } from './static-file-server.mjs'

let server: Awaited<ReturnType<typeof startStaticFileServer>>
const routes = publicRouteMetadata(resolve('.'))
test.beforeAll(async () => { server = await startStaticFileServer(resolve('dist')) })
test.afterAll(async () => { await server?.close() })

test('ordinary file serving returns each physical shell and 404 for missing routes', async ({ request }) => {
  for (const page of routes) {
    const path = page.path === '/' ? '' : `${page.path.slice(1)}/`
    const response = await request.get(server.url + path)
    expect(response.status()).toBe(200)
    expect(await response.text()).toBe(readFileSync(resolve('dist', routeShellPath(page.path)), 'utf8'))
  }
  for (const path of ['missing/', 'notes/', 'profile/', 'writings/variables-are-simple-until-they-arent/']) {
    expect((await request.get(server.url + path)).status()).toBe(404)
  }
  expect((await request.get(server.url + '404.html')).status()).toBe(200)
})

for (const path of ['/projects', '/services/software-development', '/writings/when-the-workaround-becomes-the-architecture']) {
  test(`physical entry ${path} boots and reloads with stable metadata`, async ({ page }) => {
    const metadata = resolvePageMetadata(routes.find((entry) => entry.path === path)!)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto(server.url + path.slice(1) + '/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page).toHaveTitle(metadata.fullTitle)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', metadata.canonicalUrl!)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', metadata.description)
    expect((await page.reload())?.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page).toHaveTitle(metadata.fullTitle)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', metadata.canonicalUrl!)
    expect(errors).toEqual([])
  })
}
