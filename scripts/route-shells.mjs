import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { JSDOM } from 'jsdom'
import { pageMetadata, resolvePageMetadata, writingPageMetadata } from '../src/seo.ts'
import { parseWritingIdentity, slugFromPath, splitFrontmatter } from '../src/content/writings/frontmatter.ts'

// Only published sources are opened, even during a development preview build.
export function publicRouteMetadata(root) {
  const directory = join(root, 'src/content/writings/published')
  const writings = readdirSync(directory).filter((file) => file.endsWith('.md')).sort()
    .flatMap((file) => {
      const sourcePath = join(directory, file)
      const { frontmatter } = splitFrontmatter(readFileSync(sourcePath, 'utf8'), sourcePath)
      const identity = parseWritingIdentity(frontmatter, sourcePath)
      return identity.draft ? [] : [writingPageMetadata({ ...identity, slug: slugFromPath(file) })]
    })
  const routes = [...Object.values(pageMetadata).filter((page) => page.path !== null), ...writings]
  assert.equal(new Set(routes.map((page) => page.path)).size, routes.length, 'Duplicate public route.')
  return routes
}

export function routeShellPath(path) {
  assert.match(path, /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/, 'Invalid public route path.')
  return path === '/' ? 'index.html' : `${path.slice(1)}/index.html`
}

function metadataEntries(metadata) {
  const { fullTitle, description, canonicalUrl, robots } = resolvePageMetadata(metadata)
  return [
    ['name', 'description', description], ['name', 'robots', robots],
    ['property', 'og:title', fullTitle], ['property', 'og:description', description],
    ['property', 'og:url', canonicalUrl], ['name', 'twitter:title', fullTitle],
    ['name', 'twitter:description', description],
  ]
}

export function renderRouteShell(html, metadata) {
  const dom = new JSDOM(html)
  try {
    const document = dom.window.document
    const { fullTitle, canonicalUrl } = resolvePageMetadata(metadata)
    document.title = fullTitle
    for (const [attribute, key, content] of metadataEntries(metadata)) {
      document.head.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((node) => node.remove())
      if (content === null) continue
      const meta = document.createElement('meta')
      meta.setAttribute(attribute, key)
      meta.content = content
      document.head.append(meta)
    }
    document.head.querySelectorAll('link[rel="canonical"]').forEach((node) => node.remove())
    if (canonicalUrl) {
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = canonicalUrl
      document.head.append(canonical)
    }
    return dom.serialize()
  } finally {
    dom.window.close()
  }
}

export function generateRouteShells(root, outputDirectory) {
  const template = readFileSync(join(outputDirectory, 'index.html'), 'utf8')
  for (const metadata of publicRouteMetadata(root)) {
    const destination = join(outputDirectory, routeShellPath(metadata.path))
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, renderRouteShell(template, metadata))
  }
  writeFileSync(join(outputDirectory, '404.html'), renderRouteShell(template, pageMetadata.notFound))
}

// Targeted assertions used by release validation and the generator's regression tests.
export function assertRouteShell(html, metadata, template) {
  const dom = new JSDOM(html)
  const reference = new JSDOM(template)
  try {
    const document = dom.window.document
    const { fullTitle, canonicalUrl } = resolvePageMetadata(metadata)
    const values = (selector, attribute) => [...document.head.querySelectorAll(selector)]
      .map((node) => attribute ? node.getAttribute(attribute) : node.textContent)
    assert.deepEqual(values('title'), [fullTitle], 'Incorrect shell title.')
    assert.deepEqual(values('link[rel="canonical"]', 'href'), canonicalUrl ? [canonicalUrl] : [], 'Incorrect shell canonical.')
    if (canonicalUrl) {
      const url = new URL(canonicalUrl)
      assert.ok(url.pathname.endsWith('/'), 'Canonical directory URL must end with a slash.')
      assert.ok(!url.pathname.includes('//') && !url.pathname.includes('/tech/tech/'), 'Malformed canonical path.')
      assert.equal(url.search + url.hash, '', 'Canonical URLs must exclude queries and fragments.')
    }
    for (const [attribute, key, content] of metadataEntries(metadata)) {
      assert.deepEqual(values(`meta[${attribute}="${key}"]`, 'content'), content === null ? [] : [content], `Incorrect shell ${key}.`)
    }
    const assetsIn = (doc) => [...doc.querySelectorAll('[src], link[href]:not([rel="canonical"])')]
      .map((node) => node.getAttribute('src') ?? node.getAttribute('href'))
    const assets = assetsIn(document)
    assert.ok(assets.length > 0, 'Missing app assets.')
    for (const asset of assets) assert.match(asset, /^\/tech\/assets\//, `Unexpected built asset URL: ${asset}`)
    assert.deepEqual(assets, assetsIn(reference.window.document), 'Shell must reuse the same app assets.')
    assert.deepEqual(document.body.innerHTML, reference.window.document.body.innerHTML, 'Shell must preserve the app body.')
    assert.equal(document.querySelector('#root')?.innerHTML, '', 'Route shells must not prerender content.')
    const scripts = (doc) => [...doc.querySelectorAll('script')].map((node) => node.outerHTML)
    assert.deepEqual(scripts(document), scripts(reference.window.document), 'Shell scripts must remain unchanged.')
    for (const [attribute, key, expected] of [
      ['property', 'og:image', 'https://ferdinraphael.github.io/tech/og.png'],
      ['name', 'twitter:image', 'https://ferdinraphael.github.io/tech/og.png'],
      ['name', 'twitter:card', 'summary_large_image'],
    ]) assert.deepEqual(values(`meta[${attribute}="${key}"]`, 'content'), [expected], `Incorrect shared ${key}.`)
    return assets
  } finally {
    dom.window.close()
    reference.window.close()
  }
}
