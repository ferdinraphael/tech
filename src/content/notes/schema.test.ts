import { describe, expect, it } from 'vitest'
import { normalizeCodeLanguage } from './languages'
import {
  ArticleValidationError,
  buildArticleCatalogue,
  parseArticleSource,
} from './schema'

function articleSource(
  metadata: string,
  body = '## First section\n\nArticle body.',
  path = 'first-note.md',
) {
  return { path, source: `---\n${metadata}\n---\n\n${body}` }
}

const publishedMetadata = `title: "First note"
description: "A valid description"
publishedAt: "2026-08-18"
draft: false
tags:
  - architecture
technologies:
  - TypeScript`

describe('technical-note schema', () => {
  it('parses valid frontmatter, filename slugs, and stable heading IDs', () => {
    const article = parseArticleSource(
      articleSource(
        `${publishedMetadata}
updatedAt: "2026-08-20"
series:
  name: "Architecture Smells"
  order: 2
relatedProjects:
  - little-worlds
featured: true`,
        '## Repeated heading\n\n### Detail\n\n## Repeated heading',
      ),
    )

    expect(article.slug).toBe('first-note')
    expect(article.series).toEqual({ name: 'Architecture Smells', order: 2 })
    expect(article.relatedProjects).toEqual(['little-worlds'])
    expect(article.headings.map(({ id }) => id)).toEqual([
      'repeated-heading',
      'detail',
      'repeated-heading-1',
    ])
  })

  it.each([
    ['missing title', 'description: "Description"\npublishedAt: "2026-08-18"\ndraft: false', /title/],
    ['implicit draft', 'title: "Title"\ndescription: "Description"\npublishedAt: "2026-08-18"', /draft/],
    ['published without date', 'title: "Title"\ndescription: "Description"\ndraft: false', /publishedAt/],
    ['invalid date', 'title: "Title"\ndescription: "Description"\npublishedAt: "2026-02-30"\ndraft: false', /valid calendar date/],
  ])('rejects invalid metadata: %s', (_label, metadata, expected) => {
    expect(() => parseArticleSource(articleSource(metadata))).toThrow(expected)
  })

  it('rejects invalid related projects', () => {
    expect(() => parseArticleSource(articleSource(`${publishedMetadata}\nrelatedProjects:\n  - invented-project`))).toThrow(/does not exist/)
  })

  it('rejects duplicate slugs across directories', () => {
    const sources = [
      articleSource(publishedMetadata, undefined, 'published/same-note.md'),
      articleSource('title: "Draft"\ndescription: "Draft"\ndraft: true', undefined, 'drafts/same-note.md'),
    ]
    expect(() => buildArticleCatalogue(sources, { includeDrafts: true })).toThrow(/duplicate article slug/)
  })

  it('sorts published articles newest-first', () => {
    const catalogue = buildArticleCatalogue([
      articleSource(publishedMetadata, undefined, 'older.md'),
      articleSource(publishedMetadata.replace('2026-08-18', '2026-09-01'), undefined, 'newer.md'),
    ], { includeDrafts: false })
    expect(catalogue.published.map(({ slug }) => slug)).toEqual(['newer', 'older'])
  })

  it('excludes drafts and draft lookup in production while exposing them in development', () => {
    const sources = [
      articleSource(publishedMetadata, undefined, 'published.md'),
      articleSource('title: "Preview"\ndescription: "Draft preview"\ndraft: true', undefined, 'preview.md'),
    ]
    const production = buildArticleCatalogue(sources, { includeDrafts: false })
    const development = buildArticleCatalogue(sources, { includeDrafts: true })

    expect(production.getBySlug('published')?.title).toBe('First note')
    expect(production.getBySlug('preview')).toBeUndefined()
    expect(production.drafts).toEqual([])
    expect(development.getBySlug('preview')?.draft).toBe(true)
  })

  it('parses code tabs and normalizes aliases', () => {
    const body = `## Examples

:::code-tabs

\`\`\`cs
var value = 1;
\`\`\`

\`\`\`ts
const value = 1
\`\`\`

:::`
    const article = parseArticleSource(articleSource(publishedMetadata, body))
    const tabs = article.segments.find((segment) => segment.type === 'code-tabs')
    expect(tabs).toEqual(expect.objectContaining({
      samples: [
        expect.objectContaining({ language: 'csharp' }),
        expect.objectContaining({ language: 'typescript' }),
      ],
    }))
    expect(normalizeCodeLanguage('py')).toBe('python')
    expect(normalizeCodeLanguage('js')).toBe('javascript')
    expect(normalizeCodeLanguage('plaintext')).toBe('text')
  })

  it.each([
    [
      'duplicate languages',
      ':::code-tabs\n\n```ts\na\n```\n\n```typescript\nb\n```\n\n:::',
      /repeats language/,
    ],
    [
      'one language',
      ':::code-tabs\n\n```python\na\n```\n\n:::',
      /at least two/,
    ],
    [
      'unclosed group',
      ':::code-tabs\n\n```python\na\n```\n\n```ts\nb\n```',
      /closing :::/,
    ],
  ])('rejects malformed code tabs: %s', (_label, body, expected) => {
    expect(() => parseArticleSource(articleSource(publishedMetadata, body))).toThrow(expected)
  })

  it('uses a dedicated authoring error type', () => {
    expect(() => parseArticleSource({ path: 'broken.md', source: '# Missing frontmatter' })).toThrow(ArticleValidationError)
  })
})
