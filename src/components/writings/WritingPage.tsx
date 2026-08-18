import { useRef } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Box, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { writingCatalogue } from '../../content/writings/catalogue'
import { writingFormatLabel } from '../../content/writings/formats'
import type { WritingRecord } from '../../content/writings/types'
import { projectById } from '../../data/site'
import { formatWritingDate } from './writingFormat'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { MarkdownWriting } from './MarkdownWriting'
import { useActiveHeading, useMobileContentsVisibility } from './useWritingNavigation'
import styles from './Writings.module.css'

function WritingNotFound() {
  return (
    <div className={styles.notFound}>
      <p className={styles.eyebrow}>WRITINGS / NOT FOUND</p>
      <h1>That writing is not available.</h1>
      <p>The address may be incorrect, or the writing may still be an unpublished draft.</p>
      <Link to="/writings"><ArrowLeft aria-hidden="true" /> Return to Writings</Link>
    </div>
  )
}

function WritingView({ writing }: { writing: WritingRecord }) {
  const showToc = writing.headings.length >= 3
  const tocRef = useRef<HTMLElement>(null)
  const { activeHeading, activateHeading } = useActiveHeading(
    writing.headings.map(({ id }) => id),
  )
  const showContentsControl = useMobileContentsVisibility(tocRef, showToc)

  const returnToContents = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (activeHeading) activateHeading(activeHeading)
    tocRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className={styles.articlePage}>
      <header className={styles.articleHeader}>
        <Link to="/writings" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> Back to Writings
        </Link>
        <div className={styles.articleEyebrow}>
          <span>{writing.draft ? 'FRAMEWORK PREVIEW' : writingFormatLabel(writing.format).toUpperCase()}</span>
          {writing.draft && <strong>DRAFT</strong>}
        </div>
        <h1>{writing.title}</h1>
        <p>{writing.description}</p>
        <div className={styles.articleMeta}>
          <span>{writingFormatLabel(writing.format)}</span>
          {writing.publishedAt ? <span>Published {formatWritingDate(writing.publishedAt)}</span> : <span>Unpublished development fixture</span>}
          {writing.updatedAt && <span>Updated {formatWritingDate(writing.updatedAt)}</span>}
          {writing.series && <span>Series: {writing.series.name} · Part {writing.series.order}</span>}
        </div>
        {(writing.tags.length > 0 || writing.technologies.length > 0) && (
          <ul className={styles.chipList} aria-label="Writing metadata">
            {[...writing.tags, ...writing.technologies].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          </ul>
        )}
      </header>

      <div className={`${styles.readingLayout} ${showToc ? '' : styles.withoutToc}`}>
        {showToc && (
          <nav ref={tocRef} className={styles.toc} aria-label="Contents">
            <p>CONTENTS</p>
            <ol>
              {writing.headings.map((heading) => (
                <li key={heading.id} className={heading.depth === 3 ? styles.tocNested : undefined}>
                  <a
                    href={`#${heading.id}`}
                    aria-current={activeHeading === heading.id ? 'location' : undefined}
                    onClick={() => activateHeading(heading.id)}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className={styles.articleMain}>
          <LanguagePreferenceProvider>
            <MarkdownWriting segments={writing.segments} />
          </LanguagePreferenceProvider>

          {writing.relatedProjects.length > 0 && (
            <aside className={styles.relatedProjects} aria-labelledby="related-projects-title">
              <p>CONNECTED WORK</p>
              <h2 id="related-projects-title">Related projects</h2>
              {writing.relatedProjects.map((projectId) => {
                const project = projectById[projectId]
                return (
                  <article key={project.id}>
                    <Box aria-hidden="true" />
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <div>
                        <Link to={project.route}>Project page <ArrowRight aria-hidden="true" /></Link>
                        <a href={project.repository} target="_blank" rel="noopener noreferrer">
                          Repository <ExternalLink aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </aside>
          )}

          <nav className={styles.articleReturn} aria-label="Return to Writings">
            <Link to="/writings"><ArrowLeft aria-hidden="true" /> Return to Writings</Link>
          </nav>
        </article>
      </div>

      {showContentsControl && (
        <button
          type="button"
          className={styles.contentsReturn}
          aria-label="Return to this writing's Contents"
          onClick={returnToContents}
        >
          <ArrowUp aria-hidden="true" /> Contents
        </button>
      )}
    </div>
  )
}

export default function WritingPage() {
  const { slug = '' } = useParams()
  const writing = writingCatalogue.getBySlug(slug)
  return writing ? <WritingView writing={writing} /> : <WritingNotFound />
}
