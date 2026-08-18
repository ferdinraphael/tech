import type { WritingFormat } from './types'

export const writingFormats = [
  'article',
  'concept-note',
  'mental-model',
  'worked-example',
  'practice-set',
  'mini-project',
  'debugging-note',
  'reference-sheet',
] as const satisfies readonly WritingFormat[]

export const writingFormatLabels: Record<WritingFormat, string> = {
  article: 'Article',
  'concept-note': 'Concept note',
  'mental-model': 'Mental model',
  'worked-example': 'Worked example',
  'practice-set': 'Practice set',
  'mini-project': 'Mini-project',
  'debugging-note': 'Debugging note',
  'reference-sheet': 'Reference sheet',
}

export function isWritingFormat(value: unknown): value is WritingFormat {
  return typeof value === 'string' && writingFormats.includes(value as WritingFormat)
}

export function writingFormatLabel(format: WritingFormat): string {
  return writingFormatLabels[format]
}
