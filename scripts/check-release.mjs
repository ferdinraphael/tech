import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { assertRouteShell, publicRouteMetadata, routeShellPath } from './route-shells.mjs'
import { pageMetadata, resolvePageMetadata } from '../src/seo.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (path) => readFileSync(join(root, path), 'utf8')
const filesUnder = (directory) => readdirSync(join(root, directory), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? filesUnder(`${directory}/${entry.name}`)
    : [`${directory}/${entry.name}`])

assert.equal(process.env.VITE_INCLUDE_DRAFTS, 'false', 'Release checks require VITE_INCLUDE_DRAFTS=false; draft-enabled releases are forbidden.')
const article = 'src/content/writings/published/when-the-workaround-becomes-the-architecture.md'
const hash = execFileSync('git', ['hash-object', article], { cwd: root, encoding: 'utf8', windowsHide: true }).trim()
assert.equal(hash, 'b8a1abd5b453110ef3d68f9976b7fd97cc7e7124', 'Protected published article changed; release stopped.')
console.log('Release source checks passed: draft-safe environment and protected article.')

if (process.argv.includes('--artifact')) {
  const index = read('dist/index.html')
  const routes = publicRouteMetadata(root)
  const files = filesUnder('dist')
  assert.deepEqual(files.filter((file) => file.endsWith('.html')).sort(),
    ['dist/404.html', ...routes.map((page) => `dist/${routeShellPath(page.path)}`)].sort(),
    'Output must contain exactly the public entry shells and 404 fallback; no hidden, draft, or alias shells.')
  for (const [file, metadata] of [
    ...routes.map((page) => [`dist/${routeShellPath(page.path)}`, page]),
    ['dist/404.html', pageMetadata.notFound],
  ]) {
    const assets = assertRouteShell(read(file), metadata, index)
    for (const asset of assets) {
      assert.ok(existsSync(join(root, 'dist', asset.slice('/tech/'.length))), `Missing built asset: ${asset}`)
    }
  }
  assert.deepEqual(readFileSync(join(root, 'dist/og.png')), readFileSync(join(root, 'public/og.png')), 'Social image must be included unchanged.')

  const output = files.filter((file) => /\.(?:html|js|css|xml|txt)$/.test(file)).map(read).join('\n')
  const sitemap = read('dist/sitemap.xml')
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort(),
    routes.map((page) => resolvePageMetadata(page).canonicalUrl).sort(), 'Sitemap must match the public entry shells.')
  assert.ok(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Sitemap namespace is required.')
  assert.ok(!sitemap.includes('<lastmod>'), 'Do not invent sitemap modification dates.')
  assert.equal(read('dist/robots.txt').replaceAll('\r\n', '\n'),
    'User-agent: *\nAllow: /\n\nSitemap: https://ferdinraphael.github.io/tech/sitemap.xml\n', 'Robots file must allow crawling and reference the project sitemap.')
  assert.ok(files.filter((file) => file.endsWith('.js')).some((file) => read(file).includes('G-G1V96CEM5J')), 'Production JavaScript must contain the intended public GA4 ID.')
  const structuredData = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  assert.ok(structuredData, 'Person structured data must be present.')
  assert.deepEqual(JSON.parse(structuredData[1]), {
    '@context': 'https://schema.org', '@type': 'Person', name: 'Ferdin Raphael',
    url: 'https://ferdinraphael.github.io/tech/', sameAs: ['https://github.com/ferdinraphael/'],
  }, 'Structured data must contain only the approved public identity fields.')
  for (const file of filesUnder('src/content/writings/drafts').filter((file) => file.endsWith('.md'))) {
    const frontmatter = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---/)
    assert.ok(frontmatter, `Missing draft frontmatter: ${file}`)
    const metadata = load(frontmatter[1])
    for (const marker of [basename(file, '.md'), metadata.title]) {
      assert.equal(typeof marker, 'string', `Missing draft slug/title: ${file}`)
      assert.ok(!output.includes(marker), `Draft marker found in production output: ${marker}`)
    }
  }
  const fonts = files.filter((file) => /\.woff2?$/.test(file))
  assert.ok(fonts.length > 0, 'Local font files must be included.')
  for (const css of files.filter((file) => file.endsWith('.css'))) {
    for (const [, asset] of read(css).matchAll(/url\(["']?(\/tech\/assets\/[^)"']+)["']?\)/g)) {
      assert.ok(existsSync(join(root, 'dist', asset.slice('/tech/'.length))), `Missing CSS asset: ${asset}`)
    }
  }
  console.log(`Release artifact checks passed: ${routes.length} public entry shells and metadata, /tech/ assets, noindex SPA fallback, OG image, ${fonts.length} local fonts, matching sitemap/robots, Person JSON-LD, GA4 ID, and no draft titles/slugs.`)
}
