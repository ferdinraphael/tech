import { Fragment } from 'react'
import GithubSlugger from 'github-slugger'
import { codeLanguageLabel } from '../../content/writings/languages'
import type { WritingSegment } from '../../content/writings/types'
import { CodeTabs } from './CodeTabs'
import { LanguageContent } from './LanguageContent'
import { MarkdownBlocks } from './MarkdownBlocks'
import { ReadAsControl } from './ReadAsControl'
import { RuntimeModel } from './RuntimeModel'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'

export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
  const { readingState } = useLanguagePreference()
  const firstLanguageAwareContent = segments.findIndex(
    (segment) =>
      segment.type === 'code-tabs' ||
      segment.type === 'language-content' ||
      segment.type === 'language-only' ||
      segment.type === 'runtime-model',
  )

  return (
    <div className={styles.markdownBody}>
      {segments.map((segment, index) => (
        <Fragment key={`${segment.type}-${index}`}>
          {index === firstLanguageAwareContent ? <ReadAsControl /> : null}
          {segment.type === 'code-tabs' ? (
            <CodeTabs samples={segment.samples} />
          ) : segment.type === 'language-content' ? (
            <LanguageContent variants={segment.variants} segmentIndex={index} />
          ) : segment.type === 'language-only' ? (
            (() => {
              if (!readingState) {
                throw new Error('language-only requires an article reader configuration')
              }

              const visible =
                readingState.mode === 'compare' ||
                segment.languages.includes(readingState.language)

              const content = (
                <MarkdownBlocks
                  source={segment.source}
                  keyPrefix={`language-only-${index}`}
                  slugger={slugger}
                />
              )

              if (!visible) return <div hidden>{content}</div>
              if (readingState.mode === 'single') return content

              return (
                <section
                  className={styles.languageComparison}
                  aria-label="Language-specific section"
                >
                  <div className={styles.languageComparisonItem}>
                    <p className={styles.languageComparisonLabel}>
                      {segment.languages.map(codeLanguageLabel).join(' / ')}
                    </p>
                    {content}
                  </div>
                </section>
              )
            })()
          ) : segment.type === 'runtime-model' ? (
            <RuntimeModel variants={segment.variants} />
          ) : (
            <MarkdownBlocks
              source={segment.source}
              keyPrefix={`segment-${index}`}
              slugger={slugger}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}