import { ArrowLeft, ArrowRight, Box, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { articleCatalogue } from '../../content/notes/catalogue'
import { projectById } from '../../data/site'
import { formatArticleDate } from './articleFormat'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { MarkdownArticle } from './MarkdownArticle'
import styles from './Notes.module.css'

function ArticleNotFound() {
  return (
    <div className={styles.notFound}>
      <p className={styles.eyebrow}>TECHNICAL NOTES / NOT FOUND</p>
      <h1>That technical note is not available.</h1>
      <p>The address may be incorrect, or the note may still be an unpublished draft.</p>
      <Link to="/notes"><ArrowLeft aria-hidden="true" /> Return to Notes</Link>
    </div>
  )
}

export default function ArticlePage() {
  const { slug = '' } = useParams()
  const article = articleCatalogue.getBySlug(slug)
  if (!article) return <ArticleNotFound />

  const showToc = article.headings.length >= 3

  return (
    <div className={styles.articlePage}>
      <header className={styles.articleHeader}>
        <Link to="/notes" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> Back to Notes
        </Link>
        <div className={styles.articleEyebrow}>
          <span>{article.draft ? 'FRAMEWORK PREVIEW' : 'TECHNICAL NOTE'}</span>
          {article.draft && <strong>DRAFT</strong>}
        </div>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <div className={styles.articleMeta}>
          {article.publishedAt ? <span>Published {formatArticleDate(article.publishedAt)}</span> : <span>Unpublished development fixture</span>}
          {article.updatedAt && <span>Updated {formatArticleDate(article.updatedAt)}</span>}
          {article.series && <span>Series: {article.series.name} · Part {article.series.order}</span>}
        </div>
        {(article.tags.length > 0 || article.technologies.length > 0) && (
          <ul className={styles.chipList} aria-label="Article metadata">
            {[...article.tags, ...article.technologies].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          </ul>
        )}
      </header>

      <div className={`${styles.readingLayout} ${showToc ? '' : styles.withoutToc}`}>
        {showToc && (
          <nav className={styles.toc} aria-label="On this page">
            <p>ON THIS PAGE</p>
            <ol>
              {article.headings.map((heading) => (
                <li key={heading.id} className={heading.depth === 3 ? styles.tocNested : undefined}>
                  <a href={`#${heading.id}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className={styles.articleMain}>
          <LanguagePreferenceProvider>
            <MarkdownArticle segments={article.segments} />
          </LanguagePreferenceProvider>

          {article.relatedProjects.length > 0 && (
            <aside className={styles.relatedProjects} aria-labelledby="related-projects-title">
              <p>CONNECTED WORK</p>
              <h2 id="related-projects-title">Related projects</h2>
              {article.relatedProjects.map((projectId) => {
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

          <nav className={styles.articleReturn} aria-label="Return to technical notes">
            <Link to="/notes"><ArrowLeft aria-hidden="true" /> Return to Notes</Link>
          </nav>
        </article>
      </div>
    </div>
  )
}
