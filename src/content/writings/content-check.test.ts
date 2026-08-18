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
})
