import { ArrowLeft, ArrowRight, Box, FileText, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { articleCatalogue } from '../../content/notes/catalogue'
import type { ArticleRecord } from '../../content/notes/types'
import { notesCopy, projectById } from '../../data/site'
import { formatArticleDate } from './articleFormat'
import styles from './Notes.module.css'

function ArticleCard({ article }: { article: ArticleRecord }) {
  return (
    <article className={`${styles.articleCard} ${article.featured ? styles.featuredCard : ''}`}>
      <div className={styles.cardTopline}>
        {article.draft ? <span className={styles.draftBadge}>DRAFT</span> : <span>TECHNICAL NOTE</span>}
        {article.series && <span>{article.series.name} · {article.series.order}</span>}
      </div>
      <h2><Link to={`/notes/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.description}</p>
      <div className={styles.articleMeta}>
        {article.publishedAt ? (
          <span>Published {formatArticleDate(article.publishedAt)}</span>
        ) : (
          <span>Development preview · Unpublished</span>
        )}
        {article.updatedAt && <span>Updated {formatArticleDate(article.updatedAt)}</span>}
      </div>
      {(article.tags.length > 0 || article.technologies.length > 0) && (
        <ul className={styles.chipList} aria-label="Article topics">
          {[...article.tags, ...article.technologies].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      )}
      {article.relatedProjects.length > 0 && (
        <p className={styles.cardProjectSignal}>
          <Box aria-hidden="true" />
          Connected to {article.relatedProjects.map((projectId) => projectById[projectId].title).join(', ')}
        </p>
      )}
      <Link className={styles.cardLink} to={`/notes/${article.slug}`}>
        {article.draft ? 'Open framework preview' : 'Read note'} <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  )
}

export default function NotesIndexPage() {
  return (
    <div className={styles.notesPage}>
      <header className={styles.notesHero}>
        <p className={styles.eyebrow}>TECHNICAL NOTES</p>
        <h1>Writing shaped around systems, decisions, and code.</h1>
        <p>{notesCopy}</p>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> Back to overview
        </Link>
      </header>

      {articleCatalogue.published.length > 0 ? (
        <section className={styles.indexSection} aria-labelledby="published-notes">
          <div className={styles.sectionHeading}>
            <div>
              <p>PUBLISHED WRITING</p>
              <h2 id="published-notes">Latest technical notes</h2>
            </div>
            <span>{articleCatalogue.published.length} note{articleCatalogue.published.length === 1 ? '' : 's'}</span>
          </div>
          <div className={styles.articleGrid}>
            {articleCatalogue.published.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </section>
      ) : (
        <section className={styles.emptyState} aria-labelledby="empty-notes-title">
          <div className={styles.emptySignal} aria-hidden="true"><span /><span /><span /></div>
          <FileText aria-hidden="true" />
          <p>EMPTY BY DESIGN</p>
          <h2 id="empty-notes-title">No published articles yet.</h2>
          <p>The Markdown framework is ready. The first real technical article will be added only when its content is complete and approved.</p>
        </section>
      )}

      {articleCatalogue.drafts.length > 0 && (
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
            {articleCatalogue.drafts.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </section>
      )}
    </div>
  )
}
