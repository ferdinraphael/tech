import type { LucideIcon } from 'lucide-react'
import {
  Atom,
  BookOpen,
  Code2,
  Dices,
  FileText,
  GraduationCap,
  Network,
  Package,
  PanelsTopLeft,
  ShieldCheck,
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
  | 'projects'
  | 'built-and-published'
  | 'services'
  | 'writings'
  | 'little-worlds'
  | 'experiments'
  | 'technical-thinking'

export type NodeKind = 'core' | 'category' | 'project' | 'concept'

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

export const writingsCopy =
  'Technical writing about software, systems, implementation decisions, and lessons from building and debugging them.'

export const profileSummary =
  'Senior full-stack developer and technical consultant with 15+ years of experience across .NET, Angular, Azure, integrations, and product delivery.'

export const projectsCopy =
  'Substantial exploratory work used to investigate systems, behaviour, and technical ideas.'

export const builtAndPublishedCopy =
  'Books, tools, and other smaller pieces of work that stand on their own.'

export const servicesCopy =
  'I build software, help people make difficult technical decisions, and teach people who want to become stronger at doing the work themselves.'

export const littleWorlds = {
  title: 'Little Worlds',
  status: 'Public project',
  description:
    'A browser-based artificial-life simulation exploring evolving microbes in deterministic virtual worlds.',
  tags: ['TypeScript', 'Canvas', 'Simulation'] as const,
  highlights: [
    'Deterministic simulation worlds',
    'Evolving microbes with observable behaviour',
    'Interactive browser-based simulation',
  ] as const,
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

export type PublishedOutputId =
  | 'csharp-debugging-drills'
  | 'sql-data-cleaning-cookbook'
  | 'envguard'
  | 'rpg-data-forge'

export type PublishedOutputAction =
  | { kind: 'external'; label: string; href: string }
  | { kind: 'download'; label: string; href: string; fileName?: string }
  | { kind: 'internal'; label: string; route: string }

export interface PublishedOutput {
  id: PublishedOutputId
  title: string
  kind: 'book' | 'tool'
  description: string
  tags?: readonly string[]
  image?: string
  icon?: LucideIcon
  actions?: readonly PublishedOutputAction[]
  overviewAction?: PublishedOutputAction
}

const csharpDebuggingDrillsAction = {
  kind: 'external',
  label: 'View on Amazon',
  href: 'https://www.amazon.com/Debugging-Drills-Real-World-Bugs-Find-ebook/dp/B0HF8MLZ52/',
} as const satisfies PublishedOutputAction

const sqlDataCleaningAction = {
  kind: 'external',
  label: 'View on Amazon',
  href: 'https://www.amazon.in/SQL-Data-Cleaning-Cookbook-Real-World-ebook/dp/B0HF8KL378',
} as const satisfies PublishedOutputAction

const envGuardFreeAction = {
  kind: 'external',
  label: 'Free version',
  href: 'https://payhip.com/b/KJzvD',
} as const satisfies PublishedOutputAction

const rpgDataForgeAction = {
  kind: 'external',
  label: 'View on itch.io',
  href: 'https://ferdinraphael.itch.io/rpg-data-forge',
} as const satisfies PublishedOutputAction

export const publishedOutputs: readonly PublishedOutput[] = [
  {
    id: 'csharp-debugging-drills',
    title: 'C# Debugging Drills: 20 Real-World Bugs to Find and Fix',
    kind: 'book',
    description: 'Hands-on C# debugging exercises built around realistic bugs.',
    tags: ['C#', 'Debugging', 'Exercises'],
    actions: [csharpDebuggingDrillsAction],
    overviewAction: csharpDebuggingDrillsAction,
  },
  {
    id: 'sql-data-cleaning-cookbook',
    title: 'SQL Data Cleaning Cookbook: 43 Practical Recipes for Messy Real-World Data',
    kind: 'book',
    description: 'Practical SQL recipes for cleaning messy real-world data.',
    tags: ['SQL', 'Data cleaning', 'Recipes'],
    actions: [sqlDataCleaningAction],
    overviewAction: sqlDataCleaningAction,
  },
  {
    id: 'envguard',
    title: 'EnvGuard',
    kind: 'tool',
    description:
      'A local-first .env comparison tool for finding missing, extra, changed, malformed, duplicate, and risky configuration values.',
    tags: ['Local-first', '.env', 'Configuration'],
    icon: ShieldCheck,
    actions: [
      envGuardFreeAction,
      { kind: 'external', label: 'Pro version', href: 'https://payhip.com/b/r3Tn7' },
    ],
    overviewAction: { ...envGuardFreeAction, label: 'View EnvGuard' },
  },
  {
    id: 'rpg-data-forge',
    title: 'RPG Data Forge',
    kind: 'tool',
    description:
      'An offline browser tool for generating RPG weapons, armor, consumables, enemies, loot tables, and shops, with deterministic seeds and JSON/CSV export.',
    tags: ['Offline', 'Deterministic', 'JSON / CSV'],
    icon: Dices,
    actions: [rpgDataForgeAction],
    overviewAction: rpgDataForgeAction,
  },
]

export interface PublishedOutputShelf {
  id: 'books' | 'tools'
  title: string
  description: string
  itemIds: readonly PublishedOutputId[]
}

export const publishedOutputShelves: readonly PublishedOutputShelf[] = [
  {
    id: 'books',
    title: 'Bookshelf',
    description: 'Practical technical books built around worked problems and repeatable skills.',
    itemIds: ['csharp-debugging-drills', 'sql-data-cleaning-cookbook'],
  },
  {
    id: 'tools',
    title: 'Tool Shelf',
    description: 'Small tools built to solve specific problems.',
    itemIds: ['envguard', 'rpg-data-forge'],
  },
]

export const publishedOutputById = new Map(
  publishedOutputs.map((output) => [output.id, output]),
)

export function outputsForShelf(shelf: PublishedOutputShelf): PublishedOutput[] {
  return shelf.itemIds.map((id) => publishedOutputById.get(id)!)
}

export interface ServiceOffering {
  id: 'software-development' | 'technical-consulting' | 'mentoring-teaching'
  title: string
  question: string
  description: string
  icon: LucideIcon
  accent: Accent
}

export const serviceOfferings: readonly ServiceOffering[] = [
  {
    id: 'software-development',
    title: 'Software Development',
    question: 'Need something built?',
    description: 'I can build a focused piece of software, take a product idea toward an MVP, extend an existing product, or provide part-time development help when you do not need another full-time hire.',
    icon: Code2,
    accent: 'cyan',
  },
  {
    id: 'technical-consulting',
    title: 'Technical Consulting',
    question: 'Need to work out what to do before building it?',
    description: 'I can review an existing system, help untangle an architecture or scalability problem, plan modernization or cloud/AI adoption, or stay involved as an ongoing technical advisor.',
    icon: Network,
    accent: 'blue',
  },
  {
    id: 'mentoring-teaching',
    title: 'Mentoring & Teaching',
    question: 'Want to learn, improve, or get unstuck?',
    description: 'I work with beginners, students, developers, QA engineers, career switchers, and small teams through practical 1-on-1 learning, developer mentoring, and focused group training.',
    icon: GraduationCap,
    accent: 'mint',
  },
]

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
    id: 'projects',
    label: 'Projects',
    kind: 'category',
    icon: Package,
    accent: 'cyan',
    summary: projectsCopy,
    description: 'Public project: Little Worlds.',
    route: '/projects',
    actions: [
      { label: 'View Projects', route: '/projects' },
      { label: 'GitHub', href: links.github },
    ],
    desktopPosition: { x: 29, y: 31 },
    mobilePosition: { x: 25, y: 34 },
    interactive: true,
  },
  {
    id: 'built-and-published',
    label: 'Built & Published',
    kind: 'category',
    icon: BookOpen,
    accent: 'blue',
    summary: builtAndPublishedCopy,
    description: 'Technical books, EnvGuard, and RPG Data Forge.',
    route: '/built-and-published',
    actions: [{ label: 'View Built & Published', route: '/built-and-published' }],
    desktopPosition: { x: 70, y: 28 },
    mobilePosition: { x: 70, y: 24 },
    interactive: true,
  },
  {
    id: 'services',
    label: 'Services',
    kind: 'category',
    icon: PanelsTopLeft,
    accent: 'amber',
    summary: servicesCopy,
    description: 'Individually scoped work with practical next steps.',
    route: '/services',
    actions: [{ label: 'View Services', route: '/services' }],
    desktopPosition: { x: 31, y: 72 },
    mobilePosition: { x: 28, y: 66 },
    interactive: true,
  },
  {
    id: 'writings',
    label: 'Writings',
    kind: 'category',
    icon: FileText,
    accent: 'violet',
    summary: writingsCopy,
    route: '/writings',
    actions: [{ label: 'View Writings', route: '/writings' }],
    desktopPosition: { x: 70, y: 72 },
    mobilePosition: { x: 72, y: 66 },
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
    desktopPosition: { x: 10, y: 12 },
    mobilePosition: { x: 9, y: 12 },
    featured: true,
    interactive: true,
    compact: true,
  },
  {
    id: 'experiments',
    label: 'Experiments',
    kind: 'concept',
    icon: Atom,
    accent: 'quiet',
    summary: 'Technical experiments used to investigate behaviour and constraints.',
    desktopPosition: { x: 10, y: 85 },
    mobilePosition: { x: 10, y: 86 },
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
    desktopPosition: { x: 90, y: 86 },
    mobilePosition: { x: 89, y: 87 },
    interactive: false,
    compact: true,
  },
] as const

export const relationships: readonly Relationship[] = [
  { from: 'identity', to: 'projects' },
  { from: 'identity', to: 'built-and-published' },
  { from: 'identity', to: 'services' },
  { from: 'identity', to: 'writings' },
  { from: 'projects', to: 'little-worlds' },
  { from: 'little-worlds', to: 'experiments' },
  { from: 'experiments', to: 'built-and-published' },
  { from: 'writings', to: 'technical-thinking' },
  { from: 'built-and-published', to: 'technical-thinking' },
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
