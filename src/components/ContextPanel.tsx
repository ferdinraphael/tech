import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ConstellationNode } from '../data/site'
import styles from './Tech.module.css'

interface ContextPanelProps {
  node: ConstellationNode
  featured?: boolean
  inline?: boolean
}

export function ContextPanel({ node, featured = false, inline = false }: ContextPanelProps) {
    const Icon = node.icon
    return (
      <article
        className={`${styles.contextPanel} ${inline ? styles.contextPanelInline : ''}`}
        aria-label={`${node.label} ${featured ? 'featured content' : 'selected content'}`}
      >
        <div className={styles.contextHeading}>
          <span className={`${styles.contextIcon} ${styles[`accent${node.accent[0].toUpperCase()}${node.accent.slice(1)}`]}`}>
            <Icon aria-hidden="true" />
          </span>
          <div>
            <span className={styles.eyebrow}>{node.eyebrow ?? node.kind}</span>
            <h2>{node.label}</h2>
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
}
