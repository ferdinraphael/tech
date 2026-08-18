import { ArrowLeft, ArrowRight, Box, FileText, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { writingCatalogue } from '../../content/writings/catalogue'
import { writingFormatLabel } from '../../content/writings/formats'
import type { WritingRecord } from '../../content/writings/types'
import { projectById, writingsCopy } from '../../data/site'
import { formatWritingDate } from './writingFormat'
import styles from './Writings.module.css'

function WritingCard({ writing }: { writing: WritingRecord }) {
  return (
    <article className={`${styles.articleCard} ${writing.featured ? styles.featuredCard : ''}`}>
      <div className={styles.cardTopline}>
        {writing.draft ? <span className={styles.draftBadge}>DRAFT</span> : <span>{writingFormatLabel(writing.format)}</span>}
        {writing.draft && <span>{writingFormatLabel(writing.format)}</span>}
        {writing.series && <span>{writing.series.name} · {writing.series.order}</span>}
      </div>
      <h2><Link to={`/writings/${writing.slug}`}>{writing.title}</Link></h2>
      <p>{writing.description}</p>
      <div className={styles.articleMeta}>
        {writing.publishedAt ? (
          <span>Published {formatWritingDate(writing.publishedAt)}</span>
        ) : (
          <span>Development preview · Unpublished</span>
        )}
        {writing.updatedAt && <span>Updated {formatWritingDate(writing.updatedAt)}</span>}
      </div>
      {(writing.tags.length > 0 || writing.technologies.length > 0) && (
        <ul className={styles.chipList} aria-label="Writing topics">
          {[...writing.tags, ...writing.technologies].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      )}
      {writing.relatedProjects.length > 0 && (
        <p className={styles.cardProjectSignal}>
          <Box aria-hidden="true" />
          Connected to {writing.relatedProjects.map((projectId) => projectById[projectId].title).join(', ')}
        </p>
      )}
      <Link className={styles.cardLink} to={`/writings/${writing.slug}`}>
        {writing.draft ? 'Open framework preview' : 'Read writing'} <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  )
}

export default function WritingsIndexPage() {
  return (
    <div className={styles.writingsPage}>
      <header className={styles.writingsHero}>
        <p className={styles.eyebrow}>WRITINGS</p>
        <h1>A writing space is taking shape.</h1>
        <p>{writingsCopy}</p>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> Back to overview
        </Link>
      </header>

      {writingCatalogue.published.length > 0 ? (
        <section className={styles.indexSection} aria-labelledby="published-writings">
          <div className={styles.sectionHeading}>
            <div>
              <p>PUBLISHED WRITING</p>
              <h2 id="published-writings">Latest writings</h2>
            </div>
            <span>{writingCatalogue.published.length} writing{writingCatalogue.published.length === 1 ? '' : 's'}</span>
          </div>
          <div className={styles.articleGrid}>
            {writingCatalogue.published.map((writing) => <WritingCard key={writing.slug} writing={writing} />)}
          </div>
        </section>
      ) : (
        <section className={styles.emptyState} aria-labelledby="empty-writings-title">
          <div className={styles.emptySignal} aria-hidden="true"><span /><span /><span /></div>
          <FileText aria-hidden="true" />
          <p>EMPTY BY DESIGN</p>
          <h2 id="empty-writings-title">No published writings yet.</h2>
          <p>The Markdown framework is ready. The first real writing will be added only when its content is complete and approved.</p>
        </section>
      )}

      {writingCatalogue.drafts.length > 0 && (
        <section className={`${styles.indexSection} ${styles.draftSection}`} aria-labelledby="draft-previews">
          <div className={styles.sectionHeading}>
            <div>
              <p>LOCAL AUTHORING</p>
              <h2 id="draft-previews">Framework draft previews</h2>
            </div>
            <span><FlaskConical aria-hidden="true" /> Development only</span>
          </div>
          <p className={styles.draftNotice}>These fixtures are visibly unpublished and are excluded from production navigation and routing.</p>
          <div className={styles.articleGrid}>
            {writingCatalogue.drafts.map((writing) => <WritingCard key={writing.slug} writing={writing} />)}
          </div>
        </section>
      )}
    </div>
  )
}
