import { links, projectById, publishedOutputs } from './data/site'
import { pageMetadata } from './seo'

export const gaMeasurementId = 'G-G1V96CEM5J'
let initialized = false

interface AnalyticsEvents {
  service_enquiry: { source_page: string; service_category?: string; link_type: 'mailto' }
  project_open: { project_name: string; destination_type: 'live_demo' }
  published_output_open: { item_name: string; item_type: 'book' | 'tool'; destination: string }
}

type Gtag = {
  (command: 'js', date: Date): void
  (command: 'config', id: string): void
  <Event extends keyof AnalyticsEvents>(command: 'event', event: Event, parameters: AnalyticsEvents[Event]): void
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export function analyticsAllowed(
  location: Pick<Location, 'origin' | 'pathname'>,
  production = import.meta.env.PROD,
  includeDrafts = import.meta.env.VITE_INCLUDE_DRAFTS === 'true',
) {
  return production && !includeDrafts && location.origin === 'https://ferdinraphael.github.io'
    && (location.pathname === '/tech' || location.pathname.startsWith('/tech/'))
}

export function initializeAnalytics() {
  if (!analyticsAllowed(window.location) || initialized || document.getElementById('site-ga4')) return
  initialized = true
  try {
    window.dataLayer ??= []
    window.gtag ??= function () { window.dataLayer?.push(arguments) }
    window.gtag('js', new Date())
    // Initial page view is automatic; Enhanced Measurement owns subsequent history views.
    window.gtag('config', gaMeasurementId)
    const script = document.createElement('script')
    script.id = 'site-ga4'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
    document.head.append(script)
  } catch {
    // Analytics is optional; blocked scripts must not interrupt rendering.
  }
}

export function trackEvent<Event extends keyof AnalyticsEvents>(event: Event, parameters: AnalyticsEvents[Event]) {
  if (!analyticsAllowed(window.location)) return
  try {
    window.gtag?.('event', event, parameters)
  } catch {
    // Never hold up a link or mail client for analytics.
  }
}

// Match only approved destinations; no arbitrary href, query, email, or message data is sent.
export function trackSiteLink(href: string, pathname: string) {
  if (href === links.email || href === links.enquiry) {
    const source = Object.entries(pageMetadata).find(([, metadata]) => metadata.path === pathname)
    const service = source && ['software-development', 'technical-consulting', 'mentoring-teaching'].includes(source[0])
      && 'title' in source[1] ? source[1].title : undefined
    trackEvent('service_enquiry', {
      source_page: source?.[0] ?? (pathname.startsWith('/writings/') ? 'writing' : 'other'),
      ...(service ? { service_category: service } : {}),
      link_type: 'mailto',
    })
    return
  }
  const project = Object.values(projectById).find((item) => item.liveDemo === href)
  if (project) {
    trackEvent('project_open', { project_name: project.title, destination_type: 'live_demo' })
    return
  }
  const output = publishedOutputs.find((item) => [...(item.actions ?? []), ...(item.overviewAction ? [item.overviewAction] : [])]
    .some((action) => action.kind === 'external' && action.href === href))
  if (output) {
    trackEvent('published_output_open', { item_name: output.title, item_type: output.kind, destination: new URL(href).hostname })
  }
}
