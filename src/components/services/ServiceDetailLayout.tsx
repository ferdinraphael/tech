import { publicPath } from '../../publicUrl'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { links } from '../../data/site'
import shared from '../Tech.module.css'
import styles from './Services.module.css'

interface ServiceDetailLayoutProps {
  eyebrow: string
  title: string
  intro: ReactNode
  remote: string
  action: string
  closingTitle: string
  closingCopy: string
  closingAction: string
  children: ReactNode
}

export function ServiceDetailLayout({
  eyebrow, title, intro, remote, action, closingTitle, closingCopy, closingAction, children,
}: ServiceDetailLayoutProps) {
  return (
    <div className={`${shared.routePage} ${styles.detailPage}`}>
      <Link to={publicPath('/services')} className={shared.backLink}>
        <ArrowLeft aria-hidden="true" /> Back to Services
      </Link>
      <header className={`${shared.routeHero} ${styles.hero}`}>
        <div>
          <p className={shared.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <div className={styles.intro}>{intro}</div>
          <p className={shared.remoteNote}>{remote}</p>
          <div className={shared.inlineActions}>
            <a href={links.enquiry}>{action} <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </header>
      {children}
      <section className={`${shared.routeCta} ${styles.closing}`} aria-labelledby="service-enquiry">
        <div>
          <h2 id="service-enquiry">{closingTitle}</h2>
          <p>{closingCopy}</p>
        </div>
        <div>
          <a href={links.enquiry}>{closingAction} <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
      <nav className={shared.nextRoute} aria-label="Continue exploring">
        <Link to={publicPath('/services')}>All services <ArrowRight aria-hidden="true" /></Link>
      </nav>
    </div>
  )
}

export function ServiceSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div className={styles.prose}>{children}</div>
    </section>
  )
}
