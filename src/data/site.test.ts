import { describe, expect, it } from 'vitest'
import {
  engagements,
  links,
  nodes,
  relationships,
  relatedNodeIds,
} from './site'

describe('constellation data', () => {
  it('contains unique nodes and valid relationships', () => {
    const ids = nodes.map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    relationships.forEach(({ from, to }) => {
      expect(ids).toContain(from)
      expect(ids).toContain(to)
      expect(from).not.toBe(to)
    })
  })

  it('connects Little Worlds to Projects and Simulations', () => {
    const related = relatedNodeIds('little-worlds')
    expect(related).toEqual(
      expect.objectContaining(new Set(['little-worlds', 'projects', 'simulations'])),
    )
    expect(relationships.filter(({ from, to }) => from === 'little-worlds' || to === 'little-worlds')).toHaveLength(2)
  })

  it('keeps featured and selected state separate in the model', () => {
    expect(nodes.filter((node) => node.featured).map((node) => node.id)).toEqual([
      'little-worlds',
    ])
    expect(nodes).not.toHaveProperty('selected')
  })

  it('models Writings as the canonical constellation category', () => {
    const writings = nodes.find(({ id }) => id === 'writings')
    expect(writings).toEqual(expect.objectContaining({
      label: 'Writings',
      route: '/writings',
    }))
    expect(writings?.actions).toEqual([{ label: 'View Writings', route: '/writings' }])
    expect(relationships).toContainEqual({ from: 'writings', to: 'technical-thinking' })
    expect(nodes.some(({ id }) => id === ('notes' as never))).toBe(false)
  })

  it('contains only the approved project and no fabricated satellites', () => {
    expect(nodes.filter((node) => node.kind === 'project').map((node) => node.label)).toEqual([
      'Little Worlds',
    ])
    const labels = nodes.map((node) => node.label)
    expect(labels).not.toContain('Data / Profiler Work')
    expect(labels).not.toContain('Future Experiments')
    expect(labels).not.toContain('React')
    expect(labels).not.toContain('.NET')
  })

  it('uses the approved enquiry action and full engagement scope', () => {
    expect(links.enquiry).toContain('Project%20enquiry%20from%20ferdinraphael.github.io%2Ftech')
    for (const term of ['freelance', 'contract', 'consulting', 'technical writing', 'tutoring', 'mentoring']) {
      expect(engagements.description).toContain(term)
    }
  })
})
