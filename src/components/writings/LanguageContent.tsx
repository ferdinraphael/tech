import GithubSlugger from 'github-slugger'
import { codeLanguageLabel } from '../../content/writings/languages'
import type { LanguageContentVariant } from '../../content/writings/types'
import { MarkdownBlocks } from './MarkdownBlocks'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'

export function LanguageContent({
  variants,
  segmentIndex,
}: {
  variants: LanguageContentVariant[]
  segmentIndex: number
}) {
  const { readingState } = useLanguagePreference()
  if (!readingState) {
    throw new Error('language-content requires an article reader configuration')
  }

  if (readingState.mode === 'single') {
    const variant = variants.find(({ language }) => language === readingState.language)
    if (!variant) {
      throw new Error(`language-content is missing ${readingState.language}`)
    }
    return (
      <MarkdownBlocks
        source={variant.source}
        keyPrefix={`language-${segmentIndex}-${variant.language}`}
        slugger={new GithubSlugger()}
      />
    )
  }

  return (
    <section className={styles.languageComparison} aria-label="Language comparison">
      {variants.map((variant) => (
        <div key={variant.language} className={styles.languageComparisonItem}>
          <p className={styles.languageComparisonLabel}>
            {codeLanguageLabel(variant.language)}
          </p>
          <MarkdownBlocks
            source={variant.source}
            keyPrefix={`language-${segmentIndex}-${variant.language}`}
            slugger={new GithubSlugger()}
          />
        </div>
      ))}
    </section>
  )
}
