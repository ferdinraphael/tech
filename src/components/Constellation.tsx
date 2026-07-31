import { Code2 } from 'lucide-react'
import { type RefObject } from 'react'
import {
  nodeById,
  nodes,
  relatedNodeIds,
  relationshipTouches,
  relationships,
  type NodeId,
} from '../data/site'
import styles from './Tech.module.css'

interface ConstellationProps {
  selectedId: NodeId | null
  onSelect: (id: NodeId, trigger: HTMLButtonElement) => void
  stageRef?: RefObject<HTMLDivElement | null>
}

export function Constellation({
  selectedId,
  onSelect,
  stageRef,
}: ConstellationProps) {
  const related = selectedId ? relatedNodeIds(selectedId) : new Set<NodeId>()

  return (
    <div
      ref={stageRef}
      className={styles.constellation}
      data-selected={selectedId ?? 'none'}
      aria-label="Interactive map of Ferdin Raphael's technical work"
    >
      <div className={styles.starfield} aria-hidden="true" />
      <svg
        className={styles.relationships}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse cx="50" cy="49" rx="33" ry="31" className={styles.orbit} />
        <ellipse cx="50" cy="49" rx="44" ry="43" className={styles.orbitOuter} />
        {relationships.map((relationship) => {
          const from = nodeById.get(relationship.from)!
          const to = nodeById.get(relationship.to)!
          const active = relationshipTouches(relationship, selectedId)
          return (
            <g key={`${relationship.from}-${relationship.to}`}>
              <line
                className={[
                  styles.connectorDesktop,
                  active ? styles.connectorActive : '',
                  selectedId && !active ? styles.connectorQuiet : '',
                ].join(' ')}
                x1={from.desktopPosition.x}
                y1={from.desktopPosition.y}
                x2={to.desktopPosition.x}
                y2={to.desktopPosition.y}
              />
              <line
                className={[
                  styles.connectorMobile,
                  active ? styles.connectorActive : '',
                  selectedId && !active ? styles.connectorQuiet : '',
                ].join(' ')}
                x1={from.mobilePosition.x}
                y1={from.mobilePosition.y}
                x2={to.mobilePosition.x}
                y2={to.mobilePosition.y}
              />
            </g>
          )
        })}
      </svg>

      {nodes.map((node) => {
        const Icon = node.icon
        const selected = node.id === selectedId
        const quiet = selectedId !== null && !related.has(node.id)
        const relationCount = relationships.filter(
          ({ from, to }) => from === node.id || to === node.id,
        ).length
        const style = {
          '--desktop-x': `${node.desktopPosition.x}%`,
          '--desktop-y': `${node.desktopPosition.y}%`,
          '--mobile-x': `${node.mobilePosition.x}%`,
          '--mobile-y': `${node.mobilePosition.y}%`,
        } as React.CSSProperties
        const nodeClass = [
          styles.node,
          styles[`accent${node.accent[0].toUpperCase()}${node.accent.slice(1)}`],
          node.compact ? styles.nodeCompact : '',
          node.featured ? styles.nodeFeatured : '',
          selected ? styles.nodeSelected : '',
          quiet ? styles.nodeQuiet : '',
          !node.interactive ? styles.nodeConcept : '',
          node.id === 'identity' ? styles.nodeIdentity : '',
        ].join(' ')

        if (!node.interactive) {
          return (
            <div key={node.id} className={nodeClass} style={style}>
              <span className={styles.nodeOrb}>
                <Icon aria-hidden="true" />
              </span>
              <span className={styles.nodeLabel}>{node.label}</span>
            </div>
          )
        }

        return (
          <button
            key={node.id}
            type="button"
            className={nodeClass}
            style={style}
            data-node-id={node.id}
            aria-pressed={selected}
            aria-label={
              node.id === 'identity'
                ? 'Clear constellation selection'
                : `${node.label}. ${relationCount} direct relationships.${selected ? ' Selected.' : ''}`
            }
            onClick={(event) => onSelect(node.id, event.currentTarget)}
          >
            <span className={styles.nodeOrb}>
              {node.id === 'identity' ? <Code2 aria-hidden="true" /> : <Icon aria-hidden="true" />}
            </span>
            <span className={styles.nodeLabel}>{node.label}</span>
          </button>
        )
      })}
    </div>
  )
}
