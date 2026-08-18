import { createContext } from 'react'
import type { CanonicalCodeLanguage } from '../../content/writings/types'

export interface LanguagePreferenceValue {
  preferredLanguage: CanonicalCodeLanguage | null
  selectLanguage(language: CanonicalCodeLanguage): void
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceValue | null>(null)
