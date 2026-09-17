import { publicPath } from '../publicUrl'
import { ArrowRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { writingCatalogue } from '../content/writings/catalogue'
import { writingFormatLabel } from '../content/writings/formats'
import styles from './Tech.module.css'
import { formatWritingDate } from './writings/writingFormat'

export default function LatestWritingPreview() {
  const latestWriting = writingCatalogue.published[0]
  if (!latestWriting) return null

  return (
    <section className={styles.sectionPanel} aria-labelledby="latest-writing-heading">
      <div className={styles.sectionHeader}>
        <h2 id="latest-writing-heading">Latest Writing</h2>
        <Link to={publicPath('/writings')}>
          View all writings <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <article className={styles.latestWritingCard}>
        <FileText aria-hidden="true" />
        <div className={styles.previewMeta}>
          <span>{writingFormatLabel(latestWriting.format)}</span>
          <span>Published {formatWritingDate(latestWriting.publishedAt!)}</span>
        </div>
        <h3>{latestWriting.title}</h3>
        <p>{latestWriting.description}</p>
        <Link to={publicPath(`/writings/${latestWriting.slug}`)}>
          Read article <ArrowRight aria-hidden="true" />
        </Link>
      </article>
    </section>
  )
}
