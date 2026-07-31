import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, X } from 'lucide-react'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import type { ConstellationNode } from '../data/site'
import styles from './Tech.module.css'

interface ContextPanelProps {
  node: ConstellationNode
  featured?: boolean
  mobile?: boolean
  onClose?: () => void
}

export const ContextPanel = forwardRef<HTMLButtonElement, ContextPanelProps>(
  function ContextPanel({ node, featured = false, mobile = false, onClose }, ref) {
    const Icon = node.icon
    return (
      <article
        className={`${styles.contextPanel} ${mobile ? styles.contextPanelMobile : ''}`}
        aria-label={`${node.label} ${featured ? 'featured content' : 'selected content'}`}
      >
        {mobile && (
          <>
            <span className={styles.sheetHandle} aria-hidden="true" />
            <button
              ref={ref}
              type="button"
              className={styles.sheetClose}
              aria-label={`Close ${node.label} details`}
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </button>
          </>
        )}
        <div className={styles.contextHeading}>
          <span className={`${styles.contextIcon} ${styles[`accent${node.accent[0].toUpperCase()}${node.accent.slice(1)}`]}`}>
            <Icon aria-hidden="true" />
          </span>
          <div>
            <span className={styles.eyebrow}>{node.eyebrow ?? node.kind}</span>
            <h2>{node.label}</h2>
            {featured && <span className={styles.featuredLabel}>Featured, not selected</span>}
          </div>
        </div>
        <p>{node.summary}</p>
        {node.description && <p className={styles.contextSupporting}>{node.description}</p>}
        {node.tags && (
          <ul className={styles.tagList} aria-label={`${node.label} technologies`}>
            {node.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
        {node.status && (
          <div className={styles.statusLine}>
            {node.status === 'Coming soon' ? (
              <Clock3 aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            <span>{node.status}</span>
          </div>
        )}
        {node.actions && (
          <div className={styles.contextActions}>
            {node.actions.map((action) => {
              if (action.disabled) {
                return (
                  <span key={action.label} className={styles.disabledAction} aria-disabled="true">
                    {action.label}
                  </span>
                )
              }
              if (action.route) {
                return (
                  <Link key={action.label} to={action.route}>
                    {action.label} <ArrowRight aria-hidden="true" />
                  </Link>
                )
              }
              return (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.href?.startsWith('http') ? '_blank' : undefined}
                  rel={action.href?.startsWith('http') ? 'noreferrer' : undefined}
                >
                  {action.label}
                  {action.href?.startsWith('http') ? (
                    <ArrowUpRight aria-hidden="true" />
                  ) : (
                    <ArrowRight aria-hidden="true" />
                  )}
                </a>
              )
            })}
          </div>
        )}
      </article>
    )
  },
)
