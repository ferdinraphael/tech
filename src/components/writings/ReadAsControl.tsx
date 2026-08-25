import { useId } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'

export function ReadAsControl() {
  const {
    readerConfiguration,
    readingState,
    selectReaderLanguage,
    selectCompare,
  } = useLanguagePreference()
  const name = useId()
  if (!readerConfiguration || !readingState) return null

  return (
    <fieldset className={styles.readAsControl}>
      <legend>Read this article as</legend>
      <div className={styles.readAsOptions}>
        {readerConfiguration.languages.map((language) => (
          <label key={language}>
            <input
              type="radio"
              name={name}
              checked={readingState.mode === 'single' && readingState.language === language}
              onChange={() => selectReaderLanguage(language)}
            />
            <span>{codeLanguageLabel(language)}</span>
          </label>
        ))}
        <label>
          <input
            type="radio"
            name={name}
            checked={readingState.mode === 'compare'}
            onChange={selectCompare}
          />
          <span>Compare</span>
        </label>
      </div>
    </fieldset>
  )
}
