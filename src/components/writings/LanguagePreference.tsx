import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  normalizeCodeLanguage,
  preferredLanguageStorageKey,
} from '../../content/writings/languages'
import type { ReaderLanguage } from '../../content/writings/readerLanguages'
import type {
  CanonicalCodeLanguage,
  ReadingState,
} from '../../content/writings/types'
import {
  LanguagePreferenceContext,
  type LanguagePreferenceValue,
  type ReaderConfiguration,
} from './LanguagePreferenceContext'

function storedLanguage(): CanonicalCodeLanguage | null {
  if (typeof window === 'undefined') return null
  try {
    return normalizeCodeLanguage(window.localStorage.getItem(preferredLanguageStorageKey) ?? undefined)
  } catch {
    return null
  }
}

interface LanguagePreferenceProviderProps {
  children: ReactNode
  readerLanguages?: readonly ReaderLanguage[]
  defaultReaderLanguage?: ReaderLanguage
}

export function LanguagePreferenceProvider({
  children,
  readerLanguages,
  defaultReaderLanguage,
}: LanguagePreferenceProviderProps) {
  const [preferredLanguage, setPreferredLanguage] = useState(storedLanguage)
  const readerConfiguration = useMemo<ReaderConfiguration | undefined>(
    () => readerLanguages && defaultReaderLanguage
      ? { languages: readerLanguages, defaultLanguage: defaultReaderLanguage }
      : undefined,
    [defaultReaderLanguage, readerLanguages],
  )
  const [readingState, setReadingState] = useState<ReadingState | undefined>(() => {
    if (!readerLanguages || !defaultReaderLanguage) return undefined
    const language = preferredLanguage && readerLanguages.includes(preferredLanguage as ReaderLanguage)
      ? preferredLanguage as ReaderLanguage
      : defaultReaderLanguage
    return { mode: 'single', language }
  })

  const persistLanguage = useCallback((language: CanonicalCodeLanguage) => {
    setPreferredLanguage(language)
    try {
      window.localStorage.setItem(preferredLanguageStorageKey, language)
    } catch {
      // Reading remains functional when storage is unavailable.
    }
  }, [])

  const value = useMemo<LanguagePreferenceValue>(
    () => ({
      preferredLanguage,
      selectLanguage: persistLanguage,
      readerConfiguration,
      readingState,
      selectReaderLanguage(language) {
        if (!readerConfiguration?.languages.includes(language)) return
        const canonicalLanguage = normalizeCodeLanguage(language)
        if (canonicalLanguage) persistLanguage(canonicalLanguage)
        setReadingState({ mode: 'single', language })
      },
      selectCompare() {
        setReadingState((current) => current ? { ...current, mode: 'compare' } : current)
      },
      selectSingle() {
        setReadingState((current) => current ? { ...current, mode: 'single' } : current)
      },
    }),
    [persistLanguage, preferredLanguage, readerConfiguration, readingState],
  )

  return (
    <LanguagePreferenceContext.Provider value={value}>
      {children}
    </LanguagePreferenceContext.Provider>
  )
}
