import { Fragment } from 'react'
import GithubSlugger from 'github-slugger'
import type { WritingSegment } from '../../content/writings/types'
import { CodeTabs } from './CodeTabs'
import { LanguageContent } from './LanguageContent'
import { MarkdownBlocks } from './MarkdownBlocks'
import { ReadAsControl } from './ReadAsControl'
import { RuntimeModel } from './RuntimeModel'
import styles from './Writings.module.css'

export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
  const firstLanguageAwareContent = segments.findIndex(
    (segment) =>
      segment.type === 'code-tabs' ||
      segment.type === 'language-content' ||
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
