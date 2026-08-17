import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Cloud,
  CodeXml,
  Github,
  Mail,
  Network,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  engagements,
  links,
  littleWorlds,
  profileSummary,
  projectsCopy,
  servicesCopy,
  websiteService,
} from '../data/site'
import styles from './Tech.module.css'

type FoundationPageName = 'profile' | 'projects' | 'services'

interface FoundationPageProps {
  page: FoundationPageName
}

const pageMeta = {
  profile: {
    eyebrow: 'TECHNICAL PROFILE',
    title: 'Experience across systems, products, and delivery.',
    intro: profileSummary,
  },
  projects: {
    eyebrow: 'PROJECTS',
    title: 'Built to explore, test, and understand.',
    intro: projectsCopy,
  },
  services: {
    eyebrow: 'WAYS TO WORK TOGETHER',
    title: 'Focused engagements with practical next steps.',
    intro: servicesCopy,
  },
} satisfies Record<FoundationPageName, Record<string, string>>

function ProfileContent() {
  const areas = [
    { icon: CodeXml, title: '.NET & full-stack development', copy: 'Product-focused implementation across application layers.' },
    { icon: Braces, title: 'Angular & web applications', copy: 'Readable interfaces shaped around real workflows.' },
    { icon: Cloud, title: 'Azure & integrations', copy: 'Integration-oriented delivery across connected systems.' },
    { icon: Network, title: 'Technical consulting', copy: 'Practical technical direction for scoped challenges.' },
    { icon: ShieldCheck, title: 'Implementation & stabilisation', copy: 'Moving products from uncertainty toward dependable operation.' },
  ]
  return (
    <>
      <section className={styles.routeSection} aria-labelledby="core-areas">
        <p className={styles.sectionKicker}>CORE AREAS</p>
        <h2 id="core-areas">Careful depth, connected delivery.</h2>
        <div className={styles.areaGrid}>
          {areas.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.routeCta}>
        <div>
          <span>OPEN FOR ENQUIRIES</span>
          <h2>{engagements.title}</h2>
          <p>{engagements.description}</p>
        </div>
        <div>
          <a href={links.enquiry}>
            <Mail aria-hidden="true" /> Discuss your requirement
          </a>
          <a href={links.github} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" /> GitHub profile
          </a>
        </div>
      </section>
    </>
  )
}

function ProjectsContent() {
  return (
    <section className={styles.featureRouteCard}>
      <div className={styles.featureRouteVisual}>
        <Package aria-hidden="true" />
        <span>ACTIVE PROJECT</span>
      </div>
      <div className={styles.featureRouteBody}>
        <span className={styles.activeStatus}><i aria-hidden="true" /> {littleWorlds.status}</span>
        <h2>{littleWorlds.title}</h2>
        <p>{littleWorlds.description}</p>
        <ul className={styles.tagList}>
          {littleWorlds.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <div className={styles.inlineActions}>
          <a href={links.littleWorldsDemo} target="_blank" rel="noreferrer">
            Live Demo <ArrowUpRight aria-hidden="true" />
          </a>
          <a href={links.littleWorldsRepository} target="_blank" rel="noreferrer">
            Repository <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

function ServicesContent() {
  return (
    <div className={styles.routeServiceGrid}>
      <article>
        <span>SERVICE PILOT</span>
        <h2>{websiteService.title}</h2>
        <strong>{websiteService.status}</strong>
        <p>{websiteService.description}</p>
        <span className={styles.comingSoon}>No public booking link yet</span>
      </article>
      <article>
        <span>ENGAGEMENTS</span>
        <h2>{engagements.title}</h2>
        <strong>{engagements.status}</strong>
        <p>{engagements.description}</p>
        <p>{engagements.supporting}</p>
        <a href={links.enquiry}>
          <Mail aria-hidden="true" /> Discuss your requirement
        </a>
      </article>
    </div>
  )
}

export function FoundationPage({ page }: FoundationPageProps) {
  const meta = pageMeta[page]
  return (
    <div className={styles.routePage}>
      <section className={styles.routeHero}>
        <div>
          <p className={styles.eyebrow}>{meta.eyebrow}</p>
          <h1>{meta.title}</h1>
          <p>{meta.intro}</p>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" /> Back to overview
          </Link>
        </div>
        <div className={styles.routeOrb} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
      {page === 'profile' && <ProfileContent />}
      {page === 'projects' && <ProjectsContent />}
      {page === 'services' && <ServicesContent />}
      <nav className={styles.nextRoute} aria-label="Continue exploring">
        <Link to="/">
          Return to the constellation <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}
