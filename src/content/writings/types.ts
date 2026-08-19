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

export interface LanguageContentVariant {
  language: ReaderLanguage
  source: string
}

export type LanguageVariant<T> = T & { language: ReaderLanguage }

export interface RuntimeDirectValue {
  type: string
  value: string
}

export interface RuntimeObjectMember {
  name: string
  kind: 'field' | 'property'
  value: string
}

export interface RuntimeVariableEntity {
  id: string
  kind: 'variable'
  label: string
  directValue?: RuntimeDirectValue
}

export interface RuntimeNameEntity {
  id: string
  kind: 'name'
  label: string
}

export interface RuntimeObjectEntity {
  id: string
  kind: 'object'
  typeLabel: string
  scalarValue?: string
  fields?: RuntimeObjectMember[]
}

export type RuntimeEntity =
  | RuntimeVariableEntity
  | RuntimeNameEntity
  | RuntimeObjectEntity

export interface RuntimeRelationship {
  kind: 'reference' | 'binding'
  from: string
  to: string
}

export interface RuntimeState {
  id: 'current'
  label: string
  entities: RuntimeEntity[]
  relationships: RuntimeRelationship[]
}

export interface RuntimeModelVariant {
  code: CodeSample
  states: RuntimeState[]
}

export interface RuntimeModelSegment {
  type: 'runtime-model'
  variants: LanguageVariant<RuntimeModelVariant>[]
}

export type WritingSegment =
  | { type: 'markdown'; source: string }
  | { type: 'code-tabs'; samples: CodeSample[] }
  | { type: 'language-content'; variants: LanguageContentVariant[] }
  | RuntimeModelSegment

export interface WritingRecord extends WritingMetadata {
  slug: string
  sourcePath: string
  body: string
  headings: WritingHeading[]
  segments: WritingSegment[]
}

export type CanonicalCodeLanguage =
  | 'csharp'
  | 'java'
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
