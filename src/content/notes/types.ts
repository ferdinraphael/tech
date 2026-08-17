import type { ProjectId } from '../../data/site'

export interface ArticleSeries {
  name: string
  order: number
}

export interface ArticleMetadata {
  title: string
  description: string
  publishedAt?: string
  updatedAt?: string
  draft: boolean
  tags: string[]
  technologies: string[]
  series?: ArticleSeries
  relatedProjects: ProjectId[]
  featured: boolean
}

export interface ArticleHeading {
  depth: 2 | 3
  id: string
  text: string
}

export interface CodeSample {
  language: CanonicalCodeLanguage
  code: string
}

export type ArticleSegment =
  | { type: 'markdown'; source: string }
  | { type: 'code-tabs'; samples: CodeSample[] }

export interface ArticleRecord extends ArticleMetadata {
  slug: string
  sourcePath: string
  body: string
  headings: ArticleHeading[]
  segments: ArticleSegment[]
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

export interface ArticleSource {
  path: string
  source: string
}

export interface ArticleCatalogue {
  all: ArticleRecord[]
  published: ArticleRecord[]
  drafts: ArticleRecord[]
  visible: ArticleRecord[]
  getBySlug(slug: string): ArticleRecord | undefined
}
