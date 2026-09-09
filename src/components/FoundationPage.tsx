import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Cloud,
  CodeXml,
  Github,
  Mail,
  Network,
  Package,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  builtAndPublishedCopy,
  links,
  outputsForShelf,
  profileSummary,
  projectById,
  projectIds,
  projectsCopy,
  publishedOutputShelves,
  serviceOfferings,
  servicesCopy,
} from '../data/site'
import { PublishedOutputAction } from './PublishedOutputAction'
import styles from './Tech.module.css'

type FoundationPageName = 'profile' | 'projects' | 'built-and-published' | 'services'

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
  'built-and-published': {
    eyebrow: 'BUILT & PUBLISHED',
    title: "Things I've finished and put out into the world.",
    intro: builtAndPublishedCopy,
  },
  services: {
    eyebrow: 'WAYS TO WORK TOGETHER',
    title: 'Practical technical help, depending on what you need.',
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
          <h2>Discuss technical work</h2>
          <p>{servicesCopy}</p>
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
    <>
      {projectIds.map((id) => {
        const project = projectById[id]
        return (
          <section className={styles.featureRouteCard} key={id} aria-labelledby={`${id}-project-heading`}>
            <div className={styles.featureRouteVisual}>
              <Package aria-hidden="true" />
              <span>PUBLIC PROJECT</span>
            </div>
            <div className={styles.featureRouteBody}>
              <span className={styles.activeStatus}><i aria-hidden="true" /> {project.status}</span>
              <h2 id={`${id}-project-heading`}>{project.title}</h2>
              <p>{project.description}</p>
              <ul className={styles.projectHighlights}>
                {project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
              </ul>
              <ul className={styles.tagList}>
                {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <div className={styles.inlineActions}>
                <a href={project.liveDemo} target="_blank" rel="noreferrer">
                  {project.liveActionLabel} <ArrowUpRight aria-hidden="true" />
                </a>
                {project.repository && <a href={project.repository} target="_blank" rel="noreferrer">
                  Repository <ArrowUpRight aria-hidden="true" />
                </a>}
              </div>
            </div>
          </section>
        )
      })}
      <p className={styles.projectOutputLink}>
        Smaller finished tools and publications live under <Link to="/built-and-published">Built &amp; Published</Link>.
      </p>
    </>
  )
}

function BuiltAndPublishedContent() {
  return (
    <div className={styles.publishedShelves}>
      {publishedOutputShelves.map((shelf) => (
        <section
          className={styles.shelfSection}
          aria-labelledby={`${shelf.id}-shelf-heading`}
          key={shelf.id}
        >
          <div className={styles.shelfHeading}>
            <p className={styles.sectionKicker}>{shelf.id === 'books' ? 'TECHNICAL BOOKS' : 'SOFTWARE TOOLS'}</p>
            <h2 id={`${shelf.id}-shelf-heading`}>{shelf.title}</h2>
            <p>{shelf.description}</p>
          </div>
          <div className={styles.outputShelf} data-shelf={shelf.id}>
            {outputsForShelf(shelf).map((item) => {
              const ItemIcon = item.icon ?? (item.kind === 'book' ? BookOpen : Wrench)
              return (
                <article className={styles.shelfItem} key={item.id}>
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span className={styles.shelfItemIcon} aria-hidden="true">
                      <ItemIcon />
                    </span>
                  )}
                  <div className={styles.shelfItemBody}>
                    <span>{item.kind === 'book' ? 'Book' : 'Tool'}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.tags && (
                      <ul className={styles.previewTagList} aria-label={`${item.title} topics`}>
                        {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
                      </ul>
                    )}
                    {item.actions && (
                      <div className={styles.outputActions}>
                        {item.actions.map((action) => (
                          <PublishedOutputAction action={action} key={`${action.kind}-${action.label}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function ServicesContent() {
  return (
    <>
      <div className={styles.routeServiceGrid}>
        {serviceOfferings.map((offering) => (
          <article key={offering.id} aria-labelledby={`${offering.id}-heading`}>
            <h2 id={`${offering.id}-heading`}>{offering.title}</h2>
            <p className={styles.serviceQuestion}>{offering.question}</p>
            <p>{offering.description}</p>
            <Link to={`/services/${offering.id}`}>
              Explore {offering.title} <ArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}

export function FoundationPage({ page }: FoundationPageProps) {
  const meta = pageMeta[page]
  return (
    <div className={styles.routePage}>
      <section className={`${styles.routeHero} ${page === 'services' ? styles.servicesHero : ''}`}>
        <div>
          <p className={styles.eyebrow}>{meta.eyebrow}</p>
          <h1>{meta.title}</h1>
          <p>{meta.intro}</p>
          {page === 'services' && <p className={styles.remoteNote}>All services are remote.</p>}
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
      {page === 'built-and-published' && <BuiltAndPublishedContent />}
      {page === 'services' && <ServicesContent />}
      <nav className={styles.nextRoute} aria-label="Continue exploring">
        <Link to="/">
          Return to the constellation <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}
