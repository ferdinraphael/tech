import { useId, useRef } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import { isReaderLanguage } from '../../content/writings/readerLanguages'
import type { CodeSample } from '../../content/writings/types'
import { CodeBlock } from './CodeBlock'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'

export function CodeTabs({ samples }: { samples: CodeSample[] }) {
  const {
    preferredLanguage,
    selectLanguage,
    readerConfiguration,
    readingState,
    selectReaderLanguage,
  } = useLanguagePreference()
  const languageAware = Boolean(readerConfiguration && readingState)
  const selectedLanguage = languageAware ? readingState?.language : preferredLanguage
  const activeSample =
    samples.find((sample) => sample.language === selectedLanguage) ?? samples[0]
  const id = useId().replaceAll(':', '')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function moveSelection(index: number) {
    const sample = samples[index]
    selectSample(sample)
    tabRefs.current[index]?.focus()
  }

  function selectSample(sample: CodeSample) {
    if (languageAware) {
      if (!isReaderLanguage(sample.language)) {
        throw new Error(`language-aware code-tabs contains ${sample.language}`)
      }
      selectReaderLanguage(sample.language)
      return
    }
    selectLanguage(sample.language)
  }

  if (languageAware && readingState.mode === 'compare') {
    return (
      <section
        className={styles.codeComparison}
        aria-label="Equivalent code comparison"
      >
        {samples.map((sample) => (
          <div key={sample.language} className={styles.codeComparisonItem}>
            <p className={styles.codeComparisonLabel}>
              {codeLanguageLabel(sample.language)}
            </p>
            <CodeBlock
              code={sample.code}
              language={sample.language}
              label={codeLanguageLabel(sample.language)}
              showLanguageLabel={false}
              standalone={false}
            />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className={styles.codeTabs} aria-label="Equivalent code examples">
      <div className={styles.tabList} role="tablist" aria-label="Code language">
        {samples.map((sample, index) => {
          const selected = sample.language === activeSample.language
          const tabId = `${id}-tab-${sample.language}`
          return (
            <button
              key={sample.language}
              ref={(element) => { tabRefs.current[index] = element }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectSample(sample)}
              onKeyDown={(event) => {
                let nextIndex: number | null = null
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % samples.length
                if (event.key === 'ArrowLeft') nextIndex = (index - 1 + samples.length) % samples.length
                if (event.key === 'Home') nextIndex = 0
                if (event.key === 'End') nextIndex = samples.length - 1
                if (nextIndex !== null) {
                  event.preventDefault()
                  moveSelection(nextIndex)
                }
              }}
            >
              {codeLanguageLabel(sample.language)}
            </button>
          )
        })}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${activeSample.language}`}
      >
        <CodeBlock
          code={activeSample.code}
          language={activeSample.language}
          label={codeLanguageLabel(activeSample.language)}
          showLanguageLabel={false}
          standalone={false}
        />
      </div>
    </section>
  )
}
