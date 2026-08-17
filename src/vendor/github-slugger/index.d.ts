export default class GithubSlugger {
  slug(value: string, maintainCase?: boolean): string
  reset(): void
}

export function slug(value: string, maintainCase?: boolean): string
