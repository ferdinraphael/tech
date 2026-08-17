import { describe, expect, it } from 'vitest'
import { articleCatalogue } from './catalogue'

describe('repository technical-note content', () => {
  it('loads every Markdown article through the validated catalogue', () => {
    expect(articleCatalogue.all.length).toBeGreaterThan(0)
    expect(articleCatalogue.all).toHaveLength(
      articleCatalogue.published.length + articleCatalogue.drafts.length,
    )
  })
})
