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
  notesCopy,
  profileSummary,
  projectsCopy,
  servicesCopy,
  websiteService,
} from '../data/site'
import styles from './Tech.module.css'

type FoundationPageName = 'profile' | 'projects' | 'services' | 'notes'

interface FoundationPageProps {
  page: FoundationPageName
}

const pageMeta = {
  profile: {
    index: '01',
    eyebrow: 'TECHNICAL PROFILE',
    title: 'Experience across systems, products, and delivery.',
    intro: profileSummary,
  },
  projects: {
    index: '02',
    eyebrow: 'PROJECTS',
    title: 'Built to explore, test, and understand.',
    intro: projectsCopy,
  },
  services: {
    index: '03',
    eyebrow: 'WAYS TO WORK TOGETHER',
    title: 'Focused engagements with practical next steps.',
    intro: servicesCopy,
  },
  notes: {
    index: '04',
    eyebrow: 'TECHNICAL NOTES',
    title: 'A writing space is taking shape.',
    intro: notesCopy,
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
        <span>ACTIVE PROJECT / 01</span>
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
        <span>01 / SERVICE PILOT</span>
        <h2>{websiteService.title}</h2>
        <strong>{websiteService.status}</strong>
        <p>{websiteService.description}</p>
        <span className={styles.comingSoon}>No public booking link yet</span>
      </article>
      <article>
        <span>02 / ENGAGEMENTS</span>
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

function NotesContent() {
  return (
    <section className={styles.notesFoundation}>
      <div className={styles.notesSignal} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className={styles.sectionKicker}>EMPTY BY DESIGN</p>
      <h2>No fabricated articles. A clear foundation for future writing.</h2>
      <p>{notesCopy}</p>
      <div className={styles.notesTopics}>
        <span>Systems</span>
        <span>Implementation decisions</span>
        <span>Experiments</span>
        <span>Building lessons</span>
      </div>
    </section>
  )
}

export function FoundationPage({ page }: FoundationPageProps) {
  const meta = pageMeta[page]
  return (
    <div className={styles.routePage}>
      <section className={styles.routeHero}>
        <div className={styles.routeIndex}>{meta.index}</div>
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
      {page === 'notes' && <NotesContent />}
      <nav className={styles.nextRoute} aria-label="Continue exploring">
        <Link to="/">
          Return to the constellation <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}
