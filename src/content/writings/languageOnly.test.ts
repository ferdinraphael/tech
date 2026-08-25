import { describe, expect, it } from 'vitest'
import { parseWritingSource } from './schema'

function article(body: string) {
  return `---
title: "Conditional section"
description: "Fixture"
format: article
draft: true
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp
---

${body}
`
}

describe('language-only authoring', () => {
  it('parses conditional Markdown and marks its headings', () => {
    const writing = parseWritingSource({
      path: 'src/content/writings/drafts/conditional-section.md',
      source: article(`
## Shared

Shared prose.

::::language-only python

## Python detail

Python-only prose.

::::

## Ending

Done.
`),
    })

    expect(writing.segments.map(({ type }) => type)).toEqual([
      'markdown',
      'language-only',
      'markdown',
    ])
    expect(writing.headings).toEqual([
      { depth: 2, id: 'shared', text: 'Shared' },
      {
        depth: 2,
        id: 'python-detail',
        text: 'Python detail',
        languages: ['python'],
      },
      { depth: 2, id: 'ending', text: 'Ending' },
    ])
  })

  it('supports a declared language subset', () => {
    const writing = parseWritingSource({
      path: 'src/content/writings/drafts/conditional-section.md',
      source: article(`
::::language-only csharp java

## Static-language detail

Visible to C# and Java.

::::
`),
    })
    const segment = writing.segments[0]
    expect(segment.type).toBe('language-only')
    if (segment.type === 'language-only') {
      expect(segment.languages).toEqual(['csharp', 'java'])
    }
  })

  it.each([
    ['::::language-only\nText\n::::', 'requires at least one language argument'],
    ['::::language-only ruby\nText\n::::', 'unknown reader language "ruby"'],
    ['::::language-only python python\nText\n::::', 'repeats language "python"'],
  ])('rejects invalid language-only authoring', (body, message) => {
    expect(() =>
      parseWritingSource({
        path: 'src/content/writings/drafts/conditional-section.md',
        source: article(body),
      }),
    ).toThrow(message)
  })
})
