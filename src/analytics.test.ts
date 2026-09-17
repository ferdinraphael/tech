import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { links } from './data/site'

let analytics: typeof import('./analytics')

beforeEach(async () => {
  vi.resetModules()
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_INCLUDE_DRAFTS', 'false')
  vi.stubGlobal('window', {
    location: { origin: 'https://ferdinraphael.github.io', pathname: '/tech/projects' },
    gtag: vi.fn(),
  })
  analytics = await import('./analytics')
})

afterEach(() => {
  document.getElementById('site-ga4')?.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('GA4 initialization and failure isolation', () => {
  it.each([
    ['http://localhost:4173', '/tech/', true, false],
    ['http://127.0.0.1:4173', '/tech/', true, false],
    ['https://preview.example.com', '/tech/', true, false],
    ['https://ferdinraphael.github.io', '/wildpath/', true, false],
    ['https://ferdinraphael.github.io', '/tech/', false, false],
    ['https://ferdinraphael.github.io', '/tech/', true, true],
  ])('disables analytics at %s%s (production=%s, drafts=%s)', (origin, pathname, production, drafts) => {
    expect(analytics.analyticsAllowed({ origin, pathname }, production, drafts)).toBe(false)
  })

  it('loads and configures the direct Google tag only once without custom page views', () => {
    analytics.initializeAnalytics()
    analytics.initializeAnalytics()
    expect(document.querySelectorAll('#site-ga4')).toHaveLength(1)
    expect(document.getElementById('site-ga4')).toHaveAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-G1V96CEM5J')
    expect(window.gtag).toHaveBeenCalledTimes(2)
    expect(window.gtag).toHaveBeenNthCalledWith(1, 'js', expect.any(Date))
    expect(window.gtag).toHaveBeenNthCalledWith(2, 'config', 'G-G1V96CEM5J')
  })

  it('queues commands when the Google script has not loaded', () => {
    delete window.gtag
    analytics.initializeAnalytics()
    const commands = window.dataLayer?.map((command) => Array.from(command as IArguments))
    expect(commands).toEqual([['js', expect.any(Date)], ['config', 'G-G1V96CEM5J']])
  })

  it('does not initialize or send events during development even with gtag present', () => {
    vi.stubEnv('PROD', false)
    analytics.initializeAnalytics()
    analytics.trackSiteLink(links.littleWorldsDemo, '/projects')
    expect(document.getElementById('site-ga4')).toBeNull()
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it('safely no-ops without gtag or when an analytics implementation throws', () => {
    delete window.gtag
    expect(() => analytics.trackSiteLink(links.enquiry, '/services')).not.toThrow()
    window.gtag = vi.fn(() => { throw new Error('blocked') })
    expect(() => analytics.trackSiteLink(links.littleWorldsDemo, '/projects')).not.toThrow()
    expect(() => analytics.initializeAnalytics()).not.toThrow()
    analytics.initializeAnalytics()
    expect(window.gtag).toHaveBeenCalledTimes(2)
  })
})

describe('approved custom events', () => {
  it.each(['/services/software-development', '/services/software-development/'])('preserves service event labels at %s', (pathname) => {
    analytics.trackSiteLink(links.enquiry, pathname)
    expect(window.gtag).toHaveBeenCalledExactlyOnceWith('event', 'service_enquiry', {
      source_page: 'software-development', service_category: 'Software Development', link_type: 'mailto',
    })
  })

  it('records a service category without transmitting mail or arbitrary route content', () => {
    analytics.trackSiteLink(links.enquiry, '/services/software-development')
    expect(window.gtag).toHaveBeenLastCalledWith('event', 'service_enquiry', {
      source_page: 'software-development', service_category: 'Software Development', link_type: 'mailto',
    })
    analytics.trackSiteLink(links.email, '/private@example.com?message=secret')
    expect(window.gtag).toHaveBeenLastCalledWith('event', 'service_enquiry', { source_page: 'other', link_type: 'mailto' })
  })

  it.each([
    [links.littleWorldsDemo, 'Little Worlds'],
    [links.wildpathDemo, 'Wildpath'],
  ])('records a live project action for %s', (href, projectName) => {
    analytics.trackSiteLink(href, '/projects')
    expect(window.gtag).toHaveBeenCalledExactlyOnceWith('event', 'project_open', { project_name: projectName, destination_type: 'live_demo' })
  })

  it.each([
    ['https://www.amazon.com/Debugging-Drills-Real-World-Bugs-Find-ebook/dp/B0HF8MLZ52/', 'book', 'www.amazon.com'],
    ['https://www.amazon.in/SQL-Data-Cleaning-Cookbook-Real-World-ebook/dp/B0HF8KL378', 'book', 'www.amazon.in'],
    ['https://payhip.com/b/KJzvD', 'tool', 'payhip.com'],
    ['https://payhip.com/b/r3Tn7', 'tool', 'payhip.com'],
    ['https://ferdinraphael.itch.io/rpg-data-forge', 'tool', 'ferdinraphael.itch.io'],
  ])('records a published destination for %s', (href, itemType, destination) => {
    analytics.trackSiteLink(href, '/built-and-published')
    expect(window.gtag).toHaveBeenCalledExactlyOnceWith('event', 'published_output_open', {
      item_name: expect.any(String), item_type: itemType, destination,
    })
  })

  it('does not duplicate generic outbound or repository clicks', () => {
    for (const href of [links.github, links.littleWorldsRepository, 'https://example.com', '/services', 'mailto:someone@example.com']) {
      analytics.trackSiteLink(href, '/projects')
    }
    expect(window.gtag).not.toHaveBeenCalled()
  })
})
