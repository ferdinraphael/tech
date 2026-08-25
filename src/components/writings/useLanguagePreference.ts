import { useContext } from 'react'
import { LanguagePreferenceContext, type LanguagePreferenceValue } from './LanguagePreferenceContext'

export function useLanguagePreference(): LanguagePreferenceValue {
  const value = useContext(LanguagePreferenceContext)
  if (!value) {
    throw new Error('useLanguagePreference must be used inside LanguagePreferenceProvider')
  }
  return value
}
