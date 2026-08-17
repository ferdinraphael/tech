import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './Tech.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.notFound}>
      <span>404 / OUTSIDE THE MAP</span>
      <h1>This point is not in the constellation.</h1>
      <p>The route you followed does not belong to this technical world.</p>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Return to overview
      </Link>
    </section>
  )
}
