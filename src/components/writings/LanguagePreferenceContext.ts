import { createContext } from 'react'
import type { ReaderLanguage } from '../../content/writings/readerLanguages'
import type {
  CanonicalCodeLanguage,
  ReadingState,
} from '../../content/writings/types'

export interface ReaderConfiguration {
  languages: readonly ReaderLanguage[]
  defaultLanguage: ReaderLanguage
}

export interface LanguagePreferenceValue {
  preferredLanguage: CanonicalCodeLanguage | null
  selectLanguage(language: CanonicalCodeLanguage): void
  readerConfiguration?: ReaderConfiguration
  readingState?: ReadingState
  selectReaderLanguage(language: ReaderLanguage): void
  selectCompare(): void
  selectSingle(): void
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceValue | null>(null)
