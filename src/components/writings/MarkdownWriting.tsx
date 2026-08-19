import { Fragment } from 'react'
import GithubSlugger from 'github-slugger'
import type { WritingSegment } from '../../content/writings/types'
import { CodeTabs } from './CodeTabs'
import { LanguageContent } from './LanguageContent'
import { MarkdownBlocks } from './MarkdownBlocks'
import { ReadAsControl } from './ReadAsControl'
import styles from './Writings.module.css'

export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
  const firstLanguageContent = segments.findIndex(
    (segment) => segment.type === 'language-content',
  )

  return (
    <div className={styles.markdownBody}>
      {segments.map((segment, index) => (
        <Fragment key={`${segment.type}-${index}`}>
          {index === firstLanguageContent ? <ReadAsControl /> : null}
          {segment.type === 'code-tabs' ? (
            <CodeTabs samples={segment.samples} />
          ) : segment.type === 'language-content' ? (
            <LanguageContent variants={segment.variants} segmentIndex={index} />
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
