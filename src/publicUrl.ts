// Serialize known public directory routes; callers retain route identities and
// decide whether a hidden/draft/unknown route is eligible for a public URL.
export function publicPath(target: string): string {
  // External, protocol-relative, relative, query-only and fragment-only links
  // are outside the router's root-relative directory URL model.
  if (!target.startsWith('/') || target.startsWith('//')) return target
  const boundary = target.search(/[?#]/)
  const pathname = boundary === -1 ? target : target.slice(0, boundary)
  const suffix = boundary === -1 ? '' : target.slice(boundary)
  const directory = pathname.replace(/\/+$/, '')
  if (/\.[^/]+$/.test(directory)) return target
  return `${directory}/${suffix}`
}
