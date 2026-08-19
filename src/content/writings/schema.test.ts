import { describe, expect, it } from 'vitest'
import { writingFormatLabel, writingFormats } from './formats'
import { normalizeCodeLanguage } from './languages'
import { isReaderLanguage, readerLanguages } from './readerLanguages'
import {
  WritingValidationError,
  buildWritingCatalogue,
  parseWritingSource,
} from './schema'

function writingSource(
  metadata: string,
  body = '## First section\n\nWriting body.',
  path = 'first-writing.md',
) {
  return { path, source: `---\n${metadata}\n---\n\n${body}` }
}

const publishedMetadata = `title: "First note"
description: "A valid description"
format: article
publishedAt: "2026-08-18"
draft: false
tags:
  - architecture
technologies:
  - TypeScript`

describe('technical-writing schema', () => {
  it('parses valid frontmatter, filename slugs, and stable heading IDs', () => {
    const writing = parseWritingSource(
      writingSource(
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

    expect(writing.slug).toBe('first-writing')
    expect(writing.format).toBe('article')
    expect(writing.series).toEqual({ name: 'Architecture Smells', order: 2 })
    expect(writing.relatedProjects).toEqual(['little-worlds'])
    expect(writing.readerLanguages).toBeUndefined()
    expect(writing.defaultReaderLanguage).toBeUndefined()
    expect(writing.headings.map(({ id }) => id)).toEqual([
      'repeated-heading',
      'detail',
      'repeated-heading-1',
    ])
  })

  it('parses constrained reader-language metadata without narrowing code languages', () => {
    const writing = parseWritingSource(writingSource(`${publishedMetadata}
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp`))

    expect(readerLanguages).toEqual(['csharp', 'java', 'python'])
    expect(writing.readerLanguages).toEqual(['csharp', 'java', 'python'])
    expect(writing.defaultReaderLanguage).toBe('csharp')
    expect(isReaderLanguage('java')).toBe(true)
    expect(isReaderLanguage('typescript')).toBe(false)
    expect(normalizeCodeLanguage('typescript')).toBe('typescript')
  })

  it.each([
    [
      'empty readerLanguages',
      `${publishedMetadata}\nreaderLanguages: []\ndefaultReaderLanguage: csharp`,
      /non-empty list/,
    ],
    [
      'unknown reader language',
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - ruby\ndefaultReaderLanguage: csharp`,
      /unsupported reader language "ruby"/,
    ],
    [
      'duplicate reader language',
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - csharp\ndefaultReaderLanguage: csharp`,
      /repeats reader language "csharp"/,
    ],
    [
      'missing default reader language',
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - java`,
      /defaultReaderLanguage.*required/,
    ],
    [
      'unsupported default reader language',
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - java\ndefaultReaderLanguage: typescript`,
      /defaultReaderLanguage.*supported reader language/,
    ],
    [
      'default reader language is not declared',
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - java\ndefaultReaderLanguage: python`,
      /defaultReaderLanguage.*appear in "readerLanguages"/,
    ],
    [
      'default reader language without readerLanguages',
      `${publishedMetadata}\ndefaultReaderLanguage: csharp`,
      /defaultReaderLanguage.*requires "readerLanguages"/,
    ],
  ])('rejects invalid reader metadata: %s', (_label, metadata, expected) => {
    expect(() => parseWritingSource(writingSource(metadata))).toThrow(expected)
  })

  it('parses reader metadata equivalently from LF and CRLF sources', () => {
    const lf = writingSource(`${publishedMetadata}
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: python`)
    const crlf = { ...lf, source: lf.source.replace(/\n/g, '\r\n') }

    expect(parseWritingSource(crlf)).toEqual(parseWritingSource(lf))
  })

  it.each([
    ['missing title', 'description: "Description"\nformat: article\npublishedAt: "2026-08-18"\ndraft: false', /title/],
    ['missing format', 'title: "Title"\ndescription: "Description"\npublishedAt: "2026-08-18"\ndraft: false', /format/],
    ['unknown format', 'title: "Title"\ndescription: "Description"\nformat: tutorial\npublishedAt: "2026-08-18"\ndraft: false', /supported writing format/],
    ['implicit draft', 'title: "Title"\ndescription: "Description"\nformat: article\npublishedAt: "2026-08-18"', /draft/],
    ['published without date', 'title: "Title"\ndescription: "Description"\nformat: article\ndraft: false', /publishedAt/],
    ['invalid date', 'title: "Title"\ndescription: "Description"\nformat: article\npublishedAt: "2026-02-30"\ndraft: false', /valid calendar date/],
  ])('rejects invalid metadata: %s', (_label, metadata, expected) => {
    expect(() => parseWritingSource(writingSource(metadata))).toThrow(expected)
  })

  it('rejects invalid related projects', () => {
    expect(() => parseWritingSource(writingSource(`${publishedMetadata}\nrelatedProjects:\n  - invented-project`))).toThrow(/does not exist/)
  })

  it('rejects duplicate slugs across directories', () => {
    const sources = [
      writingSource(publishedMetadata, undefined, 'published/same-writing.md'),
      writingSource('title: "Draft"\ndescription: "Draft"\nformat: concept-note\ndraft: true', undefined, 'drafts/same-writing.md'),
    ]
    expect(() => buildWritingCatalogue(sources, { includeDrafts: true })).toThrow(/duplicate writing slug/)
  })

  it('sorts published articles newest-first', () => {
    const catalogue = buildWritingCatalogue([
      writingSource(publishedMetadata, undefined, 'older.md'),
      writingSource(publishedMetadata.replace('2026-08-18', '2026-09-01'), undefined, 'newer.md'),
    ], { includeDrafts: false })
    expect(catalogue.published.map(({ slug }) => slug)).toEqual(['newer', 'older'])
  })

  it('excludes drafts and draft lookup in production while exposing them in development', () => {
    const sources = [
      writingSource(publishedMetadata, undefined, 'published.md'),
      writingSource('title: "Preview"\ndescription: "Draft preview"\nformat: article\ndraft: true', undefined, 'preview.md'),
    ]
    const production = buildWritingCatalogue(sources, { includeDrafts: false })
    const development = buildWritingCatalogue(sources, { includeDrafts: true })

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
    const writing = parseWritingSource(writingSource(publishedMetadata, body))
    const tabs = writing.segments.find((segment) => segment.type === 'code-tabs')
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
    expect(() => parseWritingSource(writingSource(publishedMetadata, body))).toThrow(expected)
  })

  it('uses a dedicated authoring error type', () => {
    expect(() => parseWritingSource({ path: 'broken.md', source: '# Missing frontmatter' })).toThrow(WritingValidationError)
  })

  it('keeps format separate from subject tags and maps every format to a label', () => {
    const writing = parseWritingSource(writingSource(publishedMetadata.replace('format: article', 'format: worked-example')))
    expect(writing.format).toBe('worked-example')
    expect(writing.tags).toEqual(['architecture'])
    expect(writingFormatLabel(writing.format)).toBe('Worked example')
    expect(writingFormats.map(writingFormatLabel)).toEqual([
      'Article',
      'Concept note',
      'Mental model',
      'Worked example',
      'Practice set',
      'Mini-project',
      'Debugging note',
      'Reference sheet',
    ])
  })
})
