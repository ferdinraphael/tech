import { ArrowRight, BookOpen, Compass, Github, Radio } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  featuredNode,
  links,
  littleWorlds,
  nodeById,
  outputsForShelf,
  publishedOutputShelves,
  serviceOfferings,
  type NodeId,
} from '../data/site'
import { Constellation } from './Constellation'
import { ContextPanel } from './ContextPanel'
import { PublishedOutputAction } from './PublishedOutputAction'
import styles from './Tech.module.css'

const LatestWritingPreview = lazy(() => import('./LatestWritingPreview'))

const bookShelf = publishedOutputShelves.find(({ id }) => id === 'books')!
const toolShelf = publishedOutputShelves.find(({ id }) => id === 'tools')!
const overviewBooks = outputsForShelf(bookShelf).slice(0, 3)
const recentTools = outputsForShelf(toolShelf)

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
            This is my technical space: software I build, systems I explore, things I publish, and
            ways I work with others.
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

      <div className={styles.overviewFeatureGrid}>
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
                {littleWorlds.tags.map((tag) => <li key={tag}>{tag}</li>)}
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

        <Suspense
          fallback={
            <section className={styles.sectionPanel} aria-label="Latest Writing">
              <div className={styles.previewLoading} role="status">Loading latest writing…</div>
            </section>
          }
        >
          <LatestWritingPreview />
        </Suspense>
      </div>

      <section
        className={`${styles.sectionPanel} ${styles.previewSection}`}
        aria-labelledby="recent-tools-heading"
      >
        <div className={styles.sectionHeader}>
          <h2 id="recent-tools-heading">Recent Tools</h2>
          <Link to="/built-and-published">
            Browse Built &amp; Published <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.toolPreviewGrid}>
          {recentTools.map((tool) => (
            <article className={styles.toolPreviewCard} key={tool.id}>
              {tool.icon && <tool.icon aria-hidden="true" />}
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                {tool.tags && (
                  <ul className={styles.previewTagList} aria-label={`${tool.title} characteristics`}>
                    {tool.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                )}
                {tool.overviewAction && <PublishedOutputAction action={tool.overviewAction} />}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.sectionPanel} ${styles.booksStrip}`}
        aria-labelledby="books-heading"
      >
        <div className={styles.sectionHeader}>
          <h2 id="books-heading">Books</h2>
          <Link to="/built-and-published">
            View bookshelf <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.bookPreviewList}>
          {overviewBooks.map((book) => (
            <article className={styles.bookPreview} key={book.id}>
              <BookOpen aria-hidden="true" />
              <div>
                <h3>{book.title}</h3>
                <p>{book.description}</p>
                {book.overviewAction && <PublishedOutputAction action={book.overviewAction} />}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.sectionPanel} ${styles.servicesSection}`}
        aria-labelledby="services-heading"
      >
        <div className={styles.sectionHeader}>
          <h2 id="services-heading">Services</h2>
          <Link to="/services">
            View Services <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.serviceGrid}>
          {serviceOfferings.map((offering) => {
            const Icon = offering.icon
            const accentClass = `accent${offering.accent[0].toUpperCase()}${offering.accent.slice(1)}`
            return (
              <article className={styles.serviceCard} key={offering.id}>
                <span className={`${styles.servicePreviewIcon} ${styles[accentClass]}`}>
                  <Icon aria-hidden="true" />
                </span>
                <div className={styles.servicePreviewBody}>
                  <h3>{offering.title}</h3>
                  <p>{offering.description}</p>
                  <ul className={styles.previewTagList} aria-label={`${offering.title} focus areas`}>
                    {offering.previewTags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
