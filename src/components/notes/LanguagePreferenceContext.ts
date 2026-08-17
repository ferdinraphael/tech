import { createContext } from 'react'
import type { CanonicalCodeLanguage } from '../../content/notes/types'

export interface LanguagePreferenceValue {
  preferredLanguage: CanonicalCodeLanguage | null
  selectLanguage(language: CanonicalCodeLanguage): void
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceValue | null>(null)
