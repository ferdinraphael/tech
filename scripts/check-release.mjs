import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (path) => readFileSync(join(root, path), 'utf8')
const filesUnder = (directory) => readdirSync(join(root, directory), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? filesUnder(`${directory}/${entry.name}`)
    : [`${directory}/${entry.name}`])

assert.equal(process.env.VITE_INCLUDE_DRAFTS, 'false', 'Release checks require VITE_INCLUDE_DRAFTS=false; draft-enabled releases are forbidden.')
const article = 'src/content/writings/published/when-the-workaround-becomes-the-architecture.md'
const hash = execFileSync('git', ['hash-object', article], { cwd: root, encoding: 'utf8', windowsHide: true }).trim()
assert.equal(hash, 'f23fb656e3e6fc9eda611c575640832e7068a541', 'Protected published article changed; release stopped.')
console.log('Release source checks passed: draft-safe environment and protected article.')

if (process.argv.includes('--artifact')) {
  const index = read('dist/index.html')
  assert.equal(read('dist/404.html'), index, 'SPA fallback must match index.html.')
  const assets = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
  assert.ok(assets.length > 0, 'Built HTML must reference application assets.')
  for (const asset of assets) {
    assert.ok(asset.startsWith('/tech/assets/'), `Unexpected built asset URL: ${asset}`)
    assert.ok(existsSync(join(root, 'dist', asset.slice('/tech/'.length))), `Missing built asset: ${asset}`)
  }
  assert.ok(index.includes('https://ferdinraphael.github.io/tech/og.png'), 'Social image URL must use the project base.')
  assert.ok(index.includes('services, and writings.'), 'Global description must use current launch terminology.')
  assert.deepEqual(readFileSync(join(root, 'dist/og.png')), readFileSync(join(root, 'public/og.png')), 'Social image must be included unchanged.')

  const files = filesUnder('dist')
  const output = files.filter((file) => /\.(?:html|js|css)$/.test(file)).map(read).join('\n')
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
  console.log(`Release artifact checks passed: /tech/ assets, equivalent 404 fallback, OG image, ${fonts.length} local fonts, and no draft titles/slugs.`)
}
