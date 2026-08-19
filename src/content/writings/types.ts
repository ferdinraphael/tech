import type { ProjectId } from '../../data/site'
import type { ReaderLanguage } from './readerLanguages'

export type WritingFormat =
  | 'article'
  | 'concept-note'
  | 'mental-model'
  | 'worked-example'
  | 'practice-set'
  | 'mini-project'
  | 'debugging-note'
  | 'reference-sheet'

export interface WritingSeries {
  name: string
  order: number
}

export interface WritingMetadata {
  title: string
  description: string
  format: WritingFormat
  publishedAt?: string
  updatedAt?: string
  draft: boolean
  tags: string[]
  technologies: string[]
  series?: WritingSeries
  relatedProjects: ProjectId[]
  featured: boolean
  readerLanguages?: ReaderLanguage[]
  defaultReaderLanguage?: ReaderLanguage
}

export type ReadingMode = 'single' | 'compare'

export interface ReadingState {
  mode: ReadingMode
  language: ReaderLanguage
}

export interface WritingHeading {
  depth: 2 | 3
  id: string
  text: string
}

export interface CodeSample {
  language: CanonicalCodeLanguage
  code: string
}

export type WritingSegment =
  | { type: 'markdown'; source: string }
  | { type: 'code-tabs'; samples: CodeSample[] }

export interface WritingRecord extends WritingMetadata {
  slug: string
  sourcePath: string
  body: string
  headings: WritingHeading[]
  segments: WritingSegment[]
}

export type CanonicalCodeLanguage =
  | 'csharp'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'json'
  | 'bash'
  | 'powershell'
  | 'sql'
  | 'html'
  | 'css'
  | 'text'

export interface WritingSource {
  path: string
  source: string
}

export interface WritingCatalogue {
  all: WritingRecord[]
  published: WritingRecord[]
  drafts: WritingRecord[]
  visible: WritingRecord[]
  getBySlug(slug: string): WritingRecord | undefined
}
