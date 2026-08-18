import { useId, useRef } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import type { CodeSample } from '../../content/writings/types'
import { CodeBlock } from './CodeBlock'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'

export function CodeTabs({ samples }: { samples: CodeSample[] }) {
  const { preferredLanguage, selectLanguage } = useLanguagePreference()
  const activeSample =
    samples.find((sample) => sample.language === preferredLanguage) ?? samples[0]
  const id = useId().replaceAll(':', '')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function moveSelection(index: number) {
    const sample = samples[index]
    selectLanguage(sample.language)
    tabRefs.current[index]?.focus()
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
              onClick={() => selectLanguage(sample.language)}
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
