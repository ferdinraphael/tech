import { ArrowRight, Compass, Github, Mail, Radio } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  engagements,
  featuredNode,
  links,
  littleWorlds,
  nodeById,
  writingsCopy,
  type NodeId,
  websiteService,
} from '../data/site'
import { Constellation } from './Constellation'
import { ContextPanel } from './ContextPanel'
import styles from './Tech.module.css'

export function OverviewPage() {
  const [selectedId, setSelectedId] = useState<NodeId | null>(null)
  const [isMobile, setIsMobile] = useState(() =>
    window.innerWidth <= 767 || window.matchMedia('(max-width: 767px)').matches,
  )
  const inlineContextRef = useRef<HTMLElement>(null)
  const pendingScrollRef = useRef(false)

  const clearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedId) clearSelection()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [clearSelection, selectedId])

  useEffect(() => {
    if (!isMobile || !selectedId || !pendingScrollRef.current) return
    pendingScrollRef.current = false
    const timeout = window.setTimeout(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      inlineContextRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [isMobile, selectedId])

  const selectNode = (id: NodeId) => {
    if (id === 'identity') {
      clearSelection()
      return
    }
    pendingScrollRef.current = isMobile
    setSelectedId(id)
  }

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null

  return (
    <div className={styles.overview}>
      <section className={styles.heroSection} aria-labelledby="overview-heading">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>TECHNICAL IDENTITY</p>
          <h1 id="overview-heading">
            Software, systems, experiments, and technical thinking<span>.</span>
          </h1>
          <p>
            I build software, automate workflows, run experiments, and write about technical systems
            that turn ideas into systems. This is a map of my technical work.
          </p>
          <div className={styles.exploreHint}>
            <Compass aria-hidden="true" />
            <div>
              <strong>Explore the constellation</strong>
              <span>Select a node to reveal related work.</span>
            </div>
          </div>
        </div>

        <div className={styles.constellationColumn}>
          <Constellation selectedId={selectedId} onSelect={selectNode} />
          <p className={styles.selectionAnnouncement} aria-live="polite">
            {selectedNode ? `${selectedNode.label} selected.` : 'No constellation node selected.'}
          </p>
        </div>

        <aside className={styles.desktopContext} aria-label="Contextual details">
          <ContextPanel node={selectedNode ?? featuredNode} featured={!selectedNode} />
          {selectedNode && (
            <button className={styles.resetButton} type="button" onClick={clearSelection}>
              Clear selection
            </button>
          )}
        </aside>
      </section>

      {selectedNode && isMobile && (
        <section
          ref={inlineContextRef}
          className={styles.inlineContext}
          aria-label={`${selectedNode.label} inline details`}
        >
          <ContextPanel node={selectedNode} inline />
          <button className={styles.inlineClear} type="button" onClick={clearSelection}>
            Clear selection
          </button>
        </section>
      )}

      <div className={styles.supportingGrid}>
        <section className={styles.sectionPanel} aria-labelledby="selected-projects-heading">
          <div className={styles.sectionHeader}>
            <h2 id="selected-projects-heading">Featured Project</h2>
            <Link to="/projects">
              View all projects <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <article className={styles.projectCard}>
            <div className={styles.cardIcon}>
              <Radio aria-hidden="true" />
            </div>
            <div className={styles.cardBody}>
              <h3>{littleWorlds.title}</h3>
              <p>{littleWorlds.description}</p>
              <ul className={styles.tagList}>
                {littleWorlds.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <span className={styles.activeStatus}>
                <i aria-hidden="true" /> {littleWorlds.status}
              </span>
            </div>
            <div className={styles.cardActions}>
              <a href={links.littleWorldsDemo} target="_blank" rel="noreferrer">
                Live Demo <ArrowRight aria-hidden="true" />
              </a>
              <a href={links.littleWorldsRepository} target="_blank" rel="noreferrer">
                <Github aria-hidden="true" /> Repository
              </a>
            </div>
          </article>
        </section>

        <section className={styles.sectionPanel} aria-labelledby="writings-heading">
          <div className={styles.sectionHeader}>
            <h2 id="writings-heading">Writings</h2>
            <Link to="/writings">
              View Writings <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.emptyState}>
            <span>WRITINGS / PREPARING</span>
            <p>{writingsCopy}</p>
            <Link to="/writings">
              Explore the Writings foundation <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <section className={`${styles.sectionPanel} ${styles.servicesSection}`} aria-labelledby="services-heading">
        <div className={styles.sectionHeader}>
          <h2 id="services-heading">Services</h2>
          <Link to="/services">
            View Services <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.serviceGrid}>
          <article className={styles.serviceCard}>
            <div>
              <div className={styles.titleWithStatus}>
                <h3>{websiteService.title}</h3>
                <span>{websiteService.status}</span>
              </div>
              <p>{websiteService.description}</p>
            </div>
            <span className={styles.comingSoon}>Coming Soon</span>
          </article>
          <article className={styles.serviceCard}>
            <div>
              <div className={styles.titleWithStatus}>
                <h3>{engagements.title}</h3>
                <span className={styles.openStatus}>{engagements.status}</span>
              </div>
              <p>{engagements.description}</p>
            </div>
            <a href={links.enquiry}>
              <Mail aria-hidden="true" /> Discuss your requirement
            </a>
          </article>
        </div>
      </section>
    </div>
  )
}
