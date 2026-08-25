import type {
  ReadingState,
  WritingHeading,
} from '../../content/writings/types'

export function visibleWritingHeadings(
  headings: WritingHeading[],
  readingState: ReadingState | undefined,
): WritingHeading[] {
  if (!readingState || readingState.mode === 'compare') return headings

  return headings.filter(
    (heading) =>
      !heading.languages ||
      heading.languages.includes(readingState.language),
  )
}
