import { load as loadYaml } from 'js-yaml'

export class WritingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WritingValidationError'
  }
}

export function fail(sourcePath: string, message: string): never {
  throw new WritingValidationError(`${sourcePath}: ${message}`)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function requiredString(
  value: unknown,
  field: string,
  sourcePath: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(sourcePath, `frontmatter field "${field}" must be a non-empty string`)
  }
  return value.trim()
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

export function slugFromPath(sourcePath: string): string {
  const filename = sourcePath.replace(/\\/g, '/').split('/').pop() ?? ''
  const slug = filename.replace(/\.md$/i, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(sourcePath, 'filename must form a lowercase kebab-case writing slug')
  }
  return slug
}

// Shared identity fields used by the full catalogue and build-time SEO.
export function parseWritingIdentity(value: unknown, sourcePath: string) {
  if (!isRecord(value)) fail(sourcePath, 'frontmatter must be a YAML mapping')
  const title = requiredString(value.title, 'title', sourcePath)
  const description = requiredString(value.description, 'description', sourcePath)
  if (typeof value.draft !== 'boolean') {
    fail(sourcePath, 'frontmatter field "draft" must be explicitly true or false')
  }
  return { title, description, draft: value.draft }
}
