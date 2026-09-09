import { describe, expect, it } from 'vitest'
import {
  links,
  nodes,
  outputsForShelf,
  publishedOutputShelves,
  publishedOutputs,
  relationships,
  relatedNodeIds,
  serviceOfferings,
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

  it('connects Little Worlds to Projects and Experiments', () => {
    const related = relatedNodeIds('little-worlds')
    expect(related).toEqual(
      expect.objectContaining(new Set(['little-worlds', 'projects', 'experiments'])),
    )
    expect(relationships.filter(({ from, to }) => from === 'little-worlds' || to === 'little-worlds')).toHaveLength(2)
  })

  it('connects Experiments to Built & Published without replacing its existing relationship', () => {
    expect(relationships).toContainEqual({ from: 'little-worlds', to: 'experiments' })
    expect(relationships).toContainEqual({ from: 'experiments', to: 'built-and-published' })
    expect(relatedNodeIds('experiments')).toEqual(
      expect.objectContaining(new Set(['experiments', 'little-worlds', 'built-and-published'])),
    )
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

  it('models the launch information architecture without a public Profile node', () => {
    expect(nodes.filter(({ kind }) => kind === 'category').map(({ label }) => label)).toEqual([
      'Projects',
      'Built & Published',
      'Services',
      'Writings',
    ])
    expect(nodes.some(({ id }) => id === ('profile' as never))).toBe(false)
    expect(nodes.find(({ id }) => id === 'built-and-published')?.route).toBe('/built-and-published')
  })

  it('places the four public categories deliberately around the central identity', () => {
    const position = (id: 'projects' | 'built-and-published' | 'services' | 'writings') =>
      nodes.find((node) => node.id === id)!.desktopPosition
    expect(position('projects').x).toBeLessThan(50)
    expect(position('projects').y).toBeLessThan(49)
    expect(position('built-and-published').x).toBeGreaterThan(50)
    expect(position('built-and-published').y).toBeLessThan(49)
    expect(position('services').x).toBeLessThan(50)
    expect(position('services').y).toBeGreaterThan(49)
    expect(position('writings').x).toBeGreaterThan(50)
    expect(position('writings').y).toBeGreaterThan(49)
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

  it('uses the approved enquiry action and durable service scope', () => {
    expect(links.enquiry).toContain('Project%20enquiry%20from%20ferdinraphael.github.io%2Ftech')
    expect(serviceOfferings.map(({ title }) => title)).toEqual([
      'Software Development',
      'Technical Consulting',
      'Mentoring & Teaching',
    ])
    expect(serviceOfferings.map(({ id }) => id)).toEqual([
      'software-development', 'technical-consulting', 'mentoring-teaching',
    ])
    expect(serviceOfferings.every(({ icon, question, accent }) => icon && question && accent)).toBe(true)
  })

  it('organizes verified outputs and exact destinations into extensible shelves', () => {
    expect(publishedOutputs.map(({ title }) => title)).toEqual([
      'C# Debugging Drills: 20 Real-World Bugs to Find and Fix',
      'SQL Data Cleaning Cookbook: 43 Practical Recipes for Messy Real-World Data',
      'EnvGuard',
      'RPG Data Forge',
    ])
    expect(publishedOutputs.every((item) => item.description.length > 0)).toBe(true)
    expect(publishedOutputs.map(({ actions }) => actions?.map(({ label }) => label))).toEqual([
      ['View on Amazon'],
      ['View on Amazon'],
      ['Free version', 'Pro version'],
      ['View on itch.io'],
    ])
    expect(publishedOutputs.flatMap(({ actions }) => actions ?? []).map((action) => (
      action.kind === 'internal' ? action.route : action.href
    ))).toEqual([
      'https://www.amazon.com/Debugging-Drills-Real-World-Bugs-Find-ebook/dp/B0HF8MLZ52/',
      'https://www.amazon.in/SQL-Data-Cleaning-Cookbook-Real-World-ebook/dp/B0HF8KL378',
      'https://payhip.com/b/KJzvD',
      'https://payhip.com/b/r3Tn7',
      'https://ferdinraphael.itch.io/rpg-data-forge',
    ])
    expect(publishedOutputs.find(({ id }) => id === 'envguard')?.overviewAction).toEqual(
      expect.objectContaining({ label: 'View EnvGuard', href: 'https://payhip.com/b/KJzvD' }),
    )
    expect(publishedOutputShelves.map(({ title }) => title)).toEqual(['Bookshelf', 'Tool Shelf'])
    expect(publishedOutputShelves.find(({ id }) => id === 'tools')?.description).toBe(
      'Small tools built to solve specific problems.',
    )
    expect(publishedOutputShelves.map((shelf) => outputsForShelf(shelf).length)).toEqual([2, 2])
  })
})
