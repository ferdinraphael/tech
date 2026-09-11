import { useEffect } from 'react'
import { initializeAnalytics } from './analytics'
import { resolvePageMetadata, type PageMetadata } from './seo'

function setMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attribute}="${key}"]`
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  if (content === null) {
    existing?.remove()
    return
  }
  const meta = existing ?? document.createElement('meta')
  meta.setAttribute(attribute, key)
  meta.content = content
  if (!existing) document.head.append(meta)
}

export function usePageSeo({ title, description, path }: PageMetadata) {
  useEffect(() => {
    const { fullTitle, canonicalUrl, robots } = resolvePageMetadata({ title, description, path })
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonicalUrl) {
      const canonical = existing ?? document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = canonicalUrl
      if (!existing) document.head.append(canonical)
    } else {
      existing?.remove()
    }
    // Configure GA once, after the first resolved page's metadata. No manual page views.
    initializeAnalytics()
  }, [title, description, path])
}
