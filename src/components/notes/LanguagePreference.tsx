import { useMemo, useState, type ReactNode } from 'react'
import {
  normalizeCodeLanguage,
  preferredLanguageStorageKey,
} from '../../content/notes/languages'
import type { CanonicalCodeLanguage } from '../../content/notes/types'
import { LanguagePreferenceContext, type LanguagePreferenceValue } from './LanguagePreferenceContext'

function storedLanguage(): CanonicalCodeLanguage | null {
  if (typeof window === 'undefined') return null
  try {
    return normalizeCodeLanguage(window.localStorage.getItem(preferredLanguageStorageKey) ?? undefined)
  } catch {
    return null
  }
}

export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const [preferredLanguage, setPreferredLanguage] = useState(storedLanguage)
  const value = useMemo<LanguagePreferenceValue>(
    () => ({
      preferredLanguage,
      selectLanguage(language) {
        setPreferredLanguage(language)
        try {
          window.localStorage.setItem(preferredLanguageStorageKey, language)
        } catch {
          // Reading remains functional when storage is unavailable.
        }
      },
    }),
    [preferredLanguage],
  )

  return (
    <LanguagePreferenceContext.Provider value={value}>
      {children}
    </LanguagePreferenceContext.Provider>
  )
}
