export const readerLanguages = ['csharp', 'java', 'python'] as const

export type ReaderLanguage = (typeof readerLanguages)[number]

export function isReaderLanguage(value: unknown): value is ReaderLanguage {
  return typeof value === 'string' && readerLanguages.includes(value as ReaderLanguage)
}
