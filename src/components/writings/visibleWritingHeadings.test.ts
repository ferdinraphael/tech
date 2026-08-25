import { describe, expect, it } from 'vitest'
import type { WritingHeading } from '../../content/writings/types'
import { visibleWritingHeadings } from './visibleWritingHeadings'

const headings: WritingHeading[] = [
  { depth: 2, id: 'shared', text: 'Shared' },
  { depth: 2, id: 'python', text: 'Python', languages: ['python'] },
  { depth: 2, id: 'static', text: 'Static', languages: ['csharp', 'java'] },
]

describe('visibleWritingHeadings', () => {
  it('filters conditional headings in single-language mode', () => {
    expect(
      visibleWritingHeadings(headings, { mode: 'single', language: 'csharp' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'static'])

    expect(
      visibleWritingHeadings(headings, { mode: 'single', language: 'python' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'python'])
  })

  it('shows all headings in Compare mode', () => {
    expect(
      visibleWritingHeadings(headings, { mode: 'compare', language: 'python' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'python', 'static'])
  })
})
