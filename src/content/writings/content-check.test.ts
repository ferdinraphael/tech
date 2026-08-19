import { describe, expect, it } from 'vitest'
import { writingCatalogue } from './catalogue'

describe('repository technical-writing content', () => {
  it('loads every Markdown writing through the validated catalogue', () => {
    expect(writingCatalogue.all.length).toBeGreaterThan(0)
    expect(writingCatalogue.all).toHaveLength(
      writingCatalogue.published.length + writingCatalogue.drafts.length,
    )
  })

  it('keeps the framework preview draft-only with article format metadata', () => {
    const preview = writingCatalogue.all.find(({ slug }) => slug === 'framework-preview')
    expect(preview).toEqual(expect.objectContaining({ draft: true, format: 'article' }))
    expect(preview?.tags).toContain('framework-preview')
    expect(writingCatalogue.published).not.toContain(preview)
  })

  it('keeps the language-aware preview development-only with validated variants', () => {
    const preview = writingCatalogue.all.find(
      ({ slug }) => slug === 'language-aware-preview',
    )
    expect(preview).toEqual(expect.objectContaining({
      draft: true,
      format: 'article',
      readerLanguages: ['csharp', 'java', 'python'],
      defaultReaderLanguage: 'csharp',
    }))
    expect(preview?.segments.filter(({ type }) => type === 'language-content')).toHaveLength(4)
    expect(preview?.segments.filter(({ type }) => type === 'code-tabs')).toHaveLength(2)
    expect(preview?.segments.filter(({ type }) => type === 'runtime-model')).toHaveLength(4)
    expect(preview?.headings.filter(({ text }) => text === 'Copy the object reference')).toHaveLength(1)
    expect(preview?.headings.some(({ text }) => text === 'Current')).toBe(false)
    expect(writingCatalogue.published).not.toContain(preview)
  })

  it('publishes the approved workaround architecture article with its editorial date', () => {
    const writing = writingCatalogue.all.find(
      ({ slug }) => slug === 'when-the-workaround-becomes-the-architecture',
    )
    expect(writing).toEqual(expect.objectContaining({
      draft: false,
      format: 'article',
      publishedAt: '2026-05-10',
    }))
    expect(writingCatalogue.published).toContain(writing)
    expect(writingCatalogue.drafts).not.toContain(writing)
    expect(writing?.readerLanguages).toBeUndefined()
    expect(writing?.defaultReaderLanguage).toBeUndefined()
  })
})
