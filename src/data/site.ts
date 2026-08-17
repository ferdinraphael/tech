import type { LucideIcon } from 'lucide-react'
import {
  Atom,
  BriefcaseBusiness,
  Code2,
  FileText,
  FlaskConical,
  Globe2,
  Network,
  Package,
  PanelsTopLeft,
  UserRound,
} from 'lucide-react'

export const links = {
  github: 'https://github.com/ferdinraphael/',
  email: 'mailto:ferdinraphael@gmail.com',
  identity: 'https://ferdinraphael.github.io/',
  littleWorldsDemo: 'https://ferdinraphael.github.io/little-worlds',
  littleWorldsRepository: 'https://github.com/ferdinraphael/little-worlds/',
  enquiry:
    'mailto:ferdinraphael@gmail.com?subject=Project%20enquiry%20from%20ferdinraphael.github.io%2Ftech',
} as const

export type NodeId =
  | 'identity'
  | 'profile'
  | 'projects'
  | 'simulations'
  | 'services'
  | 'notes'
  | 'little-worlds'
  | 'website-in-two-days'
  | 'engagements'
  | 'experiments'
  | 'technical-thinking'

export type NodeKind =
  | 'core'
  | 'category'
  | 'project'
  | 'service'
  | 'engagement'
  | 'concept'

export type Accent = 'cyan' | 'blue' | 'violet' | 'amber' | 'mint' | 'quiet'

export interface Position {
  x: number
  y: number
}

export interface NodeAction {
  label: string
  href?: string
  route?: string
  disabled?: boolean
}

export interface ConstellationNode {
  id: NodeId
  label: string
  mapLabel?: string
  eyebrow?: string
  kind: NodeKind
  icon: LucideIcon
  accent: Accent
  summary: string
  description?: string
  status?: string
  tags?: readonly string[]
  route?: string
  actions?: readonly NodeAction[]
  desktopPosition: Position
  mobilePosition: Position
  featured?: boolean
  interactive: boolean
  compact?: boolean
}

export interface Relationship {
  from: NodeId
  to: NodeId
}

export const notesCopy =
  'Technical notes are being prepared. This area will cover systems, implementation decisions, experiments, and lessons from building.'

export const profileSummary =
  'Senior full-stack developer and technical consultant with 15+ years of experience across .NET, Angular, Azure, integrations, and product delivery.'

export const projectsCopy =
  'Things I build to explore systems, solve problems, or test ideas.'

export const servicesCopy =
  'Focused ways to work together, from a defined website pilot to individually scoped technical engagements.'

export const littleWorlds = {
  title: 'Little Worlds',
  status: 'Active',
  description:
    'A browser-based artificial-life simulation exploring evolving microbes in deterministic virtual worlds.',
  tags: ['TypeScript', 'Canvas', 'Simulation'] as const,
}

export const projectIds = ['little-worlds'] as const
export type ProjectId = (typeof projectIds)[number]

export const projectById: Record<
  ProjectId,
  typeof littleWorlds & {
    id: ProjectId
    route: string
    liveDemo: string
    repository: string
  }
> = {
  'little-worlds': {
    id: 'little-worlds',
    ...littleWorlds,
    route: '/projects',
    liveDemo: links.littleWorldsDemo,
    repository: links.littleWorldsRepository,
  },
}

export const websiteService = {
  title: 'Website in 2 Days',
  status: 'Coming soon',
  description: 'A fixed-scope website service designed for fast, clear delivery.',
}

export const engagements = {
  title: 'More Ways to Work Together',
  status: 'Open for enquiries',
  description:
    'Available for selected freelance, contract, consulting, technical writing, tutoring, mentoring, and other well-scoped technical work.',
  supporting:
    'Share what you need. I’ll review the scope, clarify what is practical, and suggest an approach, quote, or next step.',
}

export const nodes: readonly ConstellationNode[] = [
  {
    id: 'identity',
    label: 'Technical identity',
    kind: 'core',
    icon: Code2,
    accent: 'blue',
    summary: 'The centre of this technical map.',
    desktopPosition: { x: 50, y: 49 },
    mobilePosition: { x: 50, y: 46 },
    interactive: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    kind: 'category',
    icon: UserRound,
    accent: 'blue',
    summary: profileSummary,
    route: '/profile',
    actions: [{ label: 'View Profile', route: '/profile' }],
    desktopPosition: { x: 50, y: 16 },
    mobilePosition: { x: 50, y: 12 },
    interactive: true,
  },
  {
    id: 'projects',
    label: 'Projects',
    kind: 'category',
    icon: Package,
    accent: 'cyan',
    summary: projectsCopy,
    description: 'Current verified content: one active public project, Little Worlds.',
    route: '/projects',
    actions: [
      { label: 'View Projects', route: '/projects' },
      { label: 'GitHub', href: links.github },
    ],
    desktopPosition: { x: 24, y: 43 },
    mobilePosition: { x: 23, y: 43 },
    interactive: true,
  },
  {
    id: 'simulations',
    label: 'Simulations',
    kind: 'category',
    icon: FlaskConical,
    accent: 'cyan',
    summary:
      'Interactive systems and experiments used to explore behaviour, constraints, and emergence.',
    description: 'Related content: Little Worlds.',
    actions: [{ label: 'View Projects', route: '/projects' }],
    desktopPosition: { x: 76, y: 42 },
    mobilePosition: { x: 77, y: 43 },
    interactive: true,
  },
  {
    id: 'services',
    label: 'Services',
    kind: 'category',
    icon: PanelsTopLeft,
    accent: 'amber',
    summary: servicesCopy,
    description: 'Website in 2 Days and more ways to work together.',
    route: '/services',
    actions: [{ label: 'View Services', route: '/services' }],
    desktopPosition: { x: 34, y: 76 },
    mobilePosition: { x: 32, y: 62 },
    interactive: true,
  },
  {
    id: 'notes',
    label: 'Notes',
    kind: 'category',
    icon: FileText,
    accent: 'violet',
    summary: notesCopy,
    route: '/notes',
    actions: [{ label: 'View Notes', route: '/notes' }],
    desktopPosition: { x: 67, y: 76 },
    mobilePosition: { x: 68, y: 62 },
    interactive: true,
  },
  {
    id: 'little-worlds',
    label: littleWorlds.title,
    eyebrow: 'PROJECT',
    kind: 'project',
    icon: Package,
    accent: 'mint',
    summary: littleWorlds.description,
    status: littleWorlds.status,
    tags: littleWorlds.tags,
    actions: [
      { label: 'Live Demo', href: links.littleWorldsDemo },
      { label: 'Repository', href: links.littleWorldsRepository },
    ],
    desktopPosition: { x: 14, y: 14 },
    mobilePosition: { x: 11, y: 19 },
    featured: true,
    interactive: true,
    compact: true,
  },
  {
    id: 'website-in-two-days',
    label: websiteService.title,
    eyebrow: 'SERVICE',
    kind: 'service',
    icon: Globe2,
    accent: 'cyan',
    summary: websiteService.description,
    status: websiteService.status,
    actions: [{ label: 'Coming Soon', disabled: true }],
    desktopPosition: { x: 9, y: 79 },
    mobilePosition: { x: 9, y: 79 },
    interactive: true,
    compact: true,
  },
  {
    id: 'engagements',
    label: engagements.title,
    mapLabel: 'Work Together',
    eyebrow: 'ENGAGEMENTS',
    kind: 'engagement',
    icon: BriefcaseBusiness,
    accent: 'amber',
    summary: engagements.description,
    description: engagements.supporting,
    status: engagements.status,
    actions: [{ label: 'Discuss your requirement', href: links.enquiry }],
    desktopPosition: { x: 55, y: 94 },
    mobilePosition: { x: 31, y: 92 },
    interactive: true,
    compact: true,
  },
  {
    id: 'experiments',
    label: 'Experiments',
    kind: 'concept',
    icon: Atom,
    accent: 'quiet',
    summary: 'A conceptual space for technical experiments.',
    desktopPosition: { x: 92, y: 72 },
    mobilePosition: { x: 92, y: 63 },
    interactive: false,
    compact: true,
  },
  {
    id: 'technical-thinking',
    label: 'Technical Thinking',
    kind: 'concept',
    icon: Network,
    accent: 'quiet',
    summary: 'The thinking that connects systems, decisions, and lessons.',
    desktopPosition: { x: 87, y: 92 },
    mobilePosition: { x: 79, y: 91 },
    interactive: false,
    compact: true,
  },
] as const

export const relationships: readonly Relationship[] = [
  { from: 'identity', to: 'profile' },
  { from: 'identity', to: 'projects' },
  { from: 'identity', to: 'simulations' },
  { from: 'identity', to: 'services' },
  { from: 'identity', to: 'notes' },
  { from: 'projects', to: 'little-worlds' },
  { from: 'simulations', to: 'little-worlds' },
  { from: 'services', to: 'website-in-two-days' },
  { from: 'services', to: 'engagements' },
  { from: 'notes', to: 'technical-thinking' },
  { from: 'simulations', to: 'experiments' },
] as const

export const nodeById = new Map(nodes.map((node) => [node.id, node]))
export const featuredNode = nodes.find((node) => node.featured)!

export function relatedNodeIds(id: NodeId): Set<NodeId> {
  const related = new Set<NodeId>([id])
  relationships.forEach(({ from, to }) => {
    if (from === id) related.add(to)
    if (to === id) related.add(from)
  })
  return related
}

export function relationshipTouches(
  relationship: Relationship,
  id: NodeId | null,
): boolean {
  return id !== null && (relationship.from === id || relationship.to === id)
}
