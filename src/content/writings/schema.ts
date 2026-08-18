import GithubSlugger from 'github-slugger'
import { load as loadYaml } from 'js-yaml'
import { marked, type Token } from 'marked'
import { projectIds, type ProjectId } from '../../data/site'
import { isWritingFormat } from './formats'
import { normalizeCodeLanguage } from './languages'
import type {
  WritingCatalogue,
  WritingHeading,
  WritingMetadata,
  WritingRecord,
  WritingSegment,
  WritingSource,
  CodeSample,
} from './types'

type MarkedToken = Token & { text?: string; tokens?: MarkedToken[] }

export class WritingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WritingValidationError'
  }
}

function fail(sourcePath: string, message: string): never {
  throw new WritingValidationError(`${sourcePath}: ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(
  value: unknown,
  field: string,
  sourcePath: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(sourcePath, `frontmatter field "${field}" must be a non-empty string`)
  }
  return value.trim()
}

function optionalStringArray(
  value: unknown,
  field: string,
  sourcePath: string,
): string[] {
  if (value === undefined) return []
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || item.trim() === '')
  ) {
    fail(sourcePath, `frontmatter field "${field}" must be a list of non-empty strings`)
  }
  return value.map((item) => item.trim())
}

function validDate(
  value: unknown,
  field: string,
  sourcePath: string,
): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(sourcePath, `frontmatter field "${field}" must use YYYY-MM-DD`)
  }
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(sourcePath, `frontmatter field "${field}" is not a valid calendar date`)
  }
  return value
}

function parseMetadata(
  value: unknown,
  sourcePath: string,
  validProjectIds: ReadonlySet<string>,
): WritingMetadata {
  if (!isRecord(value)) fail(sourcePath, 'frontmatter must be a YAML mapping')

  const title = requiredString(value.title, 'title', sourcePath)
  const description = requiredString(value.description, 'description', sourcePath)
  if (!isWritingFormat(value.format)) {
    fail(sourcePath, 'frontmatter field "format" must be a supported writing format')
  }
  const format = value.format
  if (typeof value.draft !== 'boolean') {
    fail(sourcePath, 'frontmatter field "draft" must be explicitly true or false')
  }
  const draft = value.draft as boolean

  const publishedAt = validDate(value.publishedAt, 'publishedAt', sourcePath)
  const updatedAt = validDate(value.updatedAt, 'updatedAt', sourcePath)
  if (!draft && !publishedAt) {
    fail(sourcePath, 'published writings require "publishedAt"')
  }
  if (publishedAt && updatedAt && updatedAt < publishedAt) {
    fail(sourcePath, '"updatedAt" cannot be earlier than "publishedAt"')
  }

  const relatedProjects = optionalStringArray(
    value.relatedProjects,
    'relatedProjects',
    sourcePath,
  )
  for (const projectId of relatedProjects) {
    if (!validProjectIds.has(projectId)) {
      fail(sourcePath, `related project "${projectId}" does not exist`)
    }
  }

  let series: WritingMetadata['series']
  if (value.series !== undefined) {
    if (!isRecord(value.series)) {
      fail(sourcePath, 'frontmatter field "series" must be a mapping')
    }
    const name = requiredString(value.series.name, 'series.name', sourcePath)
    if (!Number.isInteger(value.series.order) || Number(value.series.order) < 1) {
      fail(sourcePath, 'frontmatter field "series.order" must be a positive integer')
    }
    series = { name, order: Number(value.series.order) }
  }

  if (value.featured !== undefined && typeof value.featured !== 'boolean') {
    fail(sourcePath, 'frontmatter field "featured" must be true or false')
  }
  const featured = value.featured === true

  return {
    title,
    description,
    format,
    publishedAt,
    updatedAt,
    draft,
    tags: optionalStringArray(value.tags, 'tags', sourcePath),
    technologies: optionalStringArray(
      value.technologies,
      'technologies',
      sourcePath,
    ),
    series,
    relatedProjects: relatedProjects as ProjectId[],
    featured,
  }
}

export function splitFrontmatter(
  source: string,
  sourcePath: string,
): { frontmatter: unknown; body: string } {
  const normalized = source.replace(/\r\n?/g, '\n')
  if (!normalized.startsWith('---\n')) {
    return fail(sourcePath, 'writing must begin with YAML frontmatter')
  }
  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return fail(sourcePath, 'frontmatter closing delimiter is missing')

  try {
    return {
      frontmatter: loadYaml(normalized.slice(4, end)),
      body: normalized.slice(end + 5).trim(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
    return fail(sourcePath, `invalid YAML frontmatter: ${message}`)
  }
}

function fenceStart(line: string): { marker: string; language?: string } | null {
  const match = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`~]+)?\s*$/)
  return match ? { marker: match[1], language: match[2] } : null
}

function isFenceClose(line: string, marker: string): boolean {
  const character = marker[0]
  return new RegExp(`^\\s*${character}{${marker.length},}\\s*$`).test(line)
}

export function parseWritingSegments(
  body: string,
  sourcePath: string,
): WritingSegment[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n')
  const segments: WritingSegment[] = []
  let markdownStart = 0
  let index = 0

  while (index < lines.length) {
    const ordinaryFence = fenceStart(lines[index])
    if (ordinaryFence) {
      index += 1
      while (index < lines.length && !isFenceClose(lines[index], ordinaryFence.marker)) {
        index += 1
      }
      index += 1
      continue
    }

    if (!/^\s*:::code-tabs\s*$/.test(lines[index])) {
      index += 1
      continue
    }

    const markdown = lines.slice(markdownStart, index).join('\n').trim()
    if (markdown) segments.push({ type: 'markdown', source: markdown })
    index += 1
    const samples: CodeSample[] = []
    const languages = new Set<string>()
    let closed = false

    while (index < lines.length) {
      if (/^\s*:::\s*$/.test(lines[index])) {
        closed = true
        index += 1
        break
      }
      if (lines[index].trim() === '') {
        index += 1
        continue
      }

      const fence = fenceStart(lines[index])
      if (!fence?.language) {
        return fail(
          sourcePath,
          'code-tabs groups may contain only labelled fenced code blocks',
        )
      }
      const language = normalizeCodeLanguage(fence.language)
      if (!language) {
        return fail(sourcePath, `unsupported code-tab language "${fence.language}"`)
      }
      if (languages.has(language)) {
        return fail(sourcePath, `code-tabs group repeats language "${language}"`)
      }
      languages.add(language)
      index += 1
      const code: string[] = []
      while (index < lines.length && !isFenceClose(lines[index], fence.marker)) {
        code.push(lines[index])
        index += 1
      }
      if (index >= lines.length) {
        return fail(sourcePath, `unclosed ${fence.language} fence in code-tabs group`)
      }
      index += 1
      samples.push({ language, code: code.join('\n').replace(/\s+$/, '') })
    }

    if (!closed) return fail(sourcePath, 'code-tabs group is missing its closing :::')
    if (samples.length < 2) {
      return fail(sourcePath, 'code-tabs groups require at least two language blocks')
    }
    segments.push({ type: 'code-tabs', samples })
    markdownStart = index
  }

  const remainder = lines.slice(markdownStart).join('\n').trim()
  if (remainder) segments.push({ type: 'markdown', source: remainder })
  return segments
}

function tokenText(token: MarkedToken): string {
  if (token.tokens) return token.tokens.map(tokenText).join('')
  return token.text ?? ''
}

function extractHeadings(
  segments: WritingSegment[],
  sourcePath: string,
): WritingHeading[] {
  const slugger = new GithubSlugger()
  const headings: WritingHeading[] = []
  try {
    for (const segment of segments) {
      if (segment.type !== 'markdown') continue
      for (const token of marked.lexer(segment.source, { gfm: true })) {
        if (token.type !== 'heading' || (token.depth !== 2 && token.depth !== 3)) continue
        const text = tokenText(token).trim()
        headings.push({ depth: token.depth, text, id: slugger.slug(text) })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    fail(sourcePath, `Markdown could not be parsed: ${message}`)
  }
  return headings
}

function slugFromPath(sourcePath: string): string {
  const filename = sourcePath.replace(/\\/g, '/').split('/').pop() ?? ''
  const slug = filename.replace(/\.md$/i, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(sourcePath, 'filename must form a lowercase kebab-case writing slug')
  }
  return slug
}

export function parseWritingSource(
  input: WritingSource,
  validProjectIds: ReadonlySet<string> = new Set(projectIds),
): WritingRecord {
  const { frontmatter, body } = splitFrontmatter(input.source, input.path)
  const metadata = parseMetadata(frontmatter, input.path, validProjectIds)
  const segments = parseWritingSegments(body, input.path)
  return {
    ...metadata,
    slug: slugFromPath(input.path),
    sourcePath: input.path,
    body,
    segments,
    headings: extractHeadings(segments, input.path),
  }
}

export function buildWritingCatalogue(
  sources: WritingSource[],
  options: {
    includeDrafts: boolean
    validProjectIds?: ReadonlySet<string>
  },
): WritingCatalogue {
  const validProjectIds = options.validProjectIds ?? new Set(projectIds)
  const all = sources.map((source) => parseWritingSource(source, validProjectIds))
  const seen = new Set<string>()
  for (const writing of all) {
    if (seen.has(writing.slug)) {
      fail(writing.sourcePath, `duplicate writing slug "${writing.slug}"`)
    }
    seen.add(writing.slug)
  }

  const published = all
    .filter((writing) => !writing.draft)
    .sort((left, right) => right.publishedAt!.localeCompare(left.publishedAt!))
  const drafts = all.filter((writing) => writing.draft)
  const visible = options.includeDrafts ? [...published, ...drafts] : published

  return {
    all,
    published,
    drafts: options.includeDrafts ? drafts : [],
    visible,
    getBySlug(slug: string) {
      return visible.find((writing) => writing.slug === slug)
    },
  }
}
