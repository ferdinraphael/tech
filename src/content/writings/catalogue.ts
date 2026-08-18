import { projectIds } from '../../data/site'
import { buildWritingCatalogue } from './schema'
import type { WritingSource } from './types'

const publishedFiles = import.meta.glob('./published/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const includeDevelopmentDrafts =
  import.meta.env.DEV || import.meta.env.VITE_INCLUDE_DRAFTS === 'true'

const developmentDraftFiles = includeDevelopmentDrafts
  ? (import.meta.glob('./drafts/*.md', {
      eager: true,
      import: 'default',
      query: '?raw',
    }) as Record<string, string>)
  : {}

function writingSources(files: Record<string, string>): WritingSource[] {
  return Object.entries(files).map(([path, source]) => ({ path, source }))
}

export const writingCatalogue = buildWritingCatalogue(
  [...writingSources(publishedFiles), ...writingSources(developmentDraftFiles)],
  {
    includeDrafts: includeDevelopmentDrafts,
    validProjectIds: new Set(projectIds),
  },
)
