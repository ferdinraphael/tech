import { describe, expect, it } from 'vitest'
import { publicPath } from './publicUrl'
import { pageMetadata, resolvePageMetadata, writingPageMetadata } from './seo'

describe('public directory URL serialization', () => {
  it.each([
    ['/', '/'], ['/projects', '/projects/'], ['/projects/', '/projects/'],
    ['/projects///', '/projects/'], ['/services/software-development', '/services/software-development/'],
    ['/projects?view=all', '/projects/?view=all'], ['/projects#section', '/projects/#section'],
    ['/projects///?view=all#section', '/projects/?view=all#section'],
  ])('serializes %s as %s', (input, expected) => {
    expect(publicPath(input)).toBe(expected)
    expect(publicPath(expected)).toBe(expected)
  })

  it.each(['/tech/assets/app.js', '/assets/site.css?v=2', '/images/og.png', '/fonts/inter.woff2',
    '/files/book.epub#download', '/sitemap.xml', '/robots.txt', 'https://example.com/projects',
    'https://ferdinraphael.github.io/tech/projects', '//example.com/projects', 'mailto:test@example.com',
    'tel:+12345', '#section', '?view=all', 'relative/file.js'])('leaves excluded target %s unchanged', (url) => {
    expect(publicPath(url)).toBe(url)
  })

  it('keeps canonicals query-free, fragment-free and under one project base', () => {
    expect(resolvePageMetadata({ ...pageMetadata.projects, path: '/projects///?view=all#section' }).canonicalUrl)
      .toBe('https://ferdinraphael.github.io/tech/projects/')
    expect(resolvePageMetadata(pageMetadata.overview).canonicalUrl).toBe('https://ferdinraphael.github.io/tech/')
  })

  it('does not assign canonicals to hidden, unknown or draft pages', () => {
    for (const page of [pageMetadata.profile, pageMetadata.notFound,
      writingPageMetadata({ slug: 'draft-example', title: 'Draft', description: 'Draft', draft: true })]) {
      expect(resolvePageMetadata(page)).toMatchObject({ canonicalUrl: null, robots: 'noindex, follow' })
    }
  })
})
