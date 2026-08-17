import { projectIds } from '../../data/site'
import { buildArticleCatalogue } from './schema'
import type { ArticleSource } from './types'

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

function articleSources(files: Record<string, string>): ArticleSource[] {
  return Object.entries(files).map(([path, source]) => ({ path, source }))
}

export const articleCatalogue = buildArticleCatalogue(
  [...articleSources(publishedFiles), ...articleSources(developmentDraftFiles)],
  {
    includeDrafts: includeDevelopmentDrafts,
    validProjectIds: new Set(projectIds),
  },
)
