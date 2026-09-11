import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { assertRouteShell, generateRouteShells, publicRouteMetadata, renderRouteShell, routeShellPath } from '../scripts/route-shells.mjs'
import { writingCatalogue } from '../src/content/writings/catalogue'
import { pageMetadata, resolvePageMetadata, writingPageMetadata } from '../src/seo'
import { usePageSeo } from '../src/usePageSeo'

const root = resolve('.')
const paths = ['/', '/projects', '/built-and-published', '/services',
  '/services/software-development', '/services/technical-consulting', '/services/mentoring-teaching',
  '/writings', '/writings/when-the-workaround-becomes-the-architecture']
const routes = publicRouteMetadata(root)
// Representative final Vite shell; build/E2E validation uses the actual hashed output.
const template = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('/src/main.tsx', '/tech/assets/app-hash.js')
  .replace('</head>', '<link rel="stylesheet" href="/tech/assets/app-hash.css"></head>')
let directory: string

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'tech-route-shells-'))
  writeFileSync(join(directory, 'index.html'), template)
  generateRouteShells(root, directory)
})
afterAll(() => rmSync(directory, { recursive: true, force: true }))

describe('static public route entries', () => {
  it('generates exactly nine public shells and a fallback, excluding aliases, hidden pages and drafts', () => {
    expect(routes.map((page) => page.path)).toEqual(paths)
    const files = readdirSync(directory, { recursive: true }).filter((file) => String(file).endsWith('.html'))
      .map((file) => String(file).replaceAll('\\', '/')).sort()
    expect(files).toEqual(['404.html', ...paths.map(routeShellPath)].sort())
  })

  it.each(paths)('shares static and runtime metadata for %s without changing the app', (path) => {
    const metadata = routes.find((page) => page.path === path)!
    const html = readFileSync(join(directory, routeShellPath(path)), 'utf8')
    expect(() => assertRouteShell(html, metadata, template)).not.toThrow()
    const parsed = new DOMParser().parseFromString(html, 'text/html')
    document.head.innerHTML = parsed.head.innerHTML
    const before = document.head.innerHTML
    const hook = renderHook(() => usePageSeo(metadata))
    expect(document.head.innerHTML).toBe(before)
    hook.unmount()
  })

  it('takes article metadata from the same frontmatter as the full writing catalogue', () => {
    const article = writingCatalogue.published[0]
    expect(routes.find((page) => page.path === `/writings/${article.slug}`)).toEqual(writingPageMetadata(article))
    for (const draft of writingCatalogue.drafts) {
      expect(routes.some((page) => page.path === `/writings/${draft.slug}`)).toBe(false)
    }
  })

  it('matches the sitemap exactly with clean canonical URLs', () => {
    const xml = new DOMParser().parseFromString(readFileSync(join(root, 'public/sitemap.xml'), 'utf8'), 'application/xml')
    expect([...xml.querySelectorAll('loc')].map((node) => node.textContent).sort())
      .toEqual(routes.map((page) => resolvePageMetadata(page).canonicalUrl).sort())
  })

  it('preserves a noindex fallback without a canonical, using the same app', () => {
    expect(() => assertRouteShell(readFileSync(join(directory, '404.html'), 'utf8'), pageMetadata.notFound, template)).not.toThrow()
  })

  it('escapes metadata safely and replaces existing canonicals without duplication', () => {
    const metadata = { path: '/projects', title: 'A & B <review>', description: 'Quotes " and <markup> & details' }
    const html = renderRouteShell(template.replace('</head>', '<link rel="canonical" href="wrong"></head>'), metadata)
    expect(() => assertRouteShell(html, metadata, template)).not.toThrow()
  })

  it.each(['title', 'description', 'canonical', 'asset'])('rejects incorrect %s in release validation', (field) => {
    const html = readFileSync(join(directory, 'projects/index.html'), 'utf8')
    const parsed = new DOMParser().parseFromString(html, 'text/html')
    if (field === 'title') parsed.title = 'Wrong title'
    if (field === 'description') parsed.querySelector('meta[name="description"]')!.setAttribute('content', 'Wrong description')
    if (field === 'canonical') parsed.querySelector('link[rel="canonical"]')!.remove()
    if (field === 'asset') parsed.querySelector('script[src]')!.setAttribute('src', '../assets/app-hash.js')
    expect(() => assertRouteShell(parsed.documentElement.outerHTML, pageMetadata.projects, template)).toThrow()
  })
})
