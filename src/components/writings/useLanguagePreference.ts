import { useContext } from 'react'
import { LanguagePreferenceContext, type LanguagePreferenceValue } from './LanguagePreferenceContext'

export function useLanguagePreference(): LanguagePreferenceValue {
  const value = useContext(LanguagePreferenceContext)
  if (!value) throw new Error('CodeTabs must be rendered inside LanguagePreferenceProvider')
  return value
}
