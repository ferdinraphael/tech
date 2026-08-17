import { Code2 } from 'lucide-react'
import { type RefObject } from 'react'
import {
  nodeById,
  nodes,
  relatedNodeIds,
  relationshipTouches,
  relationships,
  type NodeId,
  type Position,
} from '../data/site'
import styles from './Tech.module.css'

interface ConstellationProps {
  selectedId: NodeId | null
  onSelect: (id: NodeId) => void
  stageRef?: RefObject<HTMLDivElement | null>
}

function connectorPath(from: Position, to: Position, index: number) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const bend = (index % 2 === 0 ? 1 : -1) * 2.4
  const controlX = (from.x + to.x) / 2 - (dy / length) * bend
  const controlY = (from.y + to.y) / 2 + (dx / length) * bend

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
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
        {relationships.map((relationship, index) => {
          const from = nodeById.get(relationship.from)!
          const to = nodeById.get(relationship.to)!
          const active = relationshipTouches(relationship, selectedId)
          return (
            <g key={`${relationship.from}-${relationship.to}`}>
              <path
                className={[
                  styles.connectorDesktop,
                  active ? styles.connectorActive : '',
                  selectedId && !active ? styles.connectorQuiet : '',
                ].join(' ')}
                d={connectorPath(from.desktopPosition, to.desktopPosition, index)}
                data-relationship={`${relationship.from}-${relationship.to}`}
                data-active={active ? 'true' : 'false'}
              />
              <path
                className={[
                  styles.connectorMobile,
                  active ? styles.connectorActive : '',
                  selectedId && !active ? styles.connectorQuiet : '',
                ].join(' ')}
                d={connectorPath(from.mobilePosition, to.mobilePosition, index)}
                data-relationship={`${relationship.from}-${relationship.to}`}
                data-active={active ? 'true' : 'false'}
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
              <span className={styles.nodeLabel}>{node.mapLabel ?? node.label}</span>
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
            onClick={() => onSelect(node.id)}
          >
            <span className={styles.nodeOrb}>
              {node.id === 'identity' ? <Code2 aria-hidden="true" /> : <Icon aria-hidden="true" />}
            </span>
            <span className={styles.nodeLabel}>{node.mapLabel ?? node.label}</span>
          </button>
        )
      })}
    </div>
  )
}
