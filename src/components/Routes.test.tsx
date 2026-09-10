import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../App'
import { publishedWritingPresentation } from './writings/writingFormat'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('foundation routes', () => {
  it.each([
    ['/', 'Ferdin Raphael — Software & Systems'],
    ['/profile', 'Profile — Ferdin Raphael'],
    ['/projects', 'Projects — Ferdin Raphael'],
    ['/built-and-published', 'Built & Published — Ferdin Raphael'],
    ['/services', 'Services — Ferdin Raphael'],
    ['/services/software-development', 'Software Development — Ferdin Raphael'],
    ['/services/technical-consulting', 'Technical Consulting — Ferdin Raphael'],
    ['/services/mentoring-teaching', 'Mentoring & Teaching — Ferdin Raphael'],
    ['/writings', 'Writings — Ferdin Raphael'],
    ['/not-a-real-place', 'Not Found — Ferdin Raphael'],
  ])('sets the browser title for %s', (path, title) => {
    renderRoute(path)
    expect(document.title).toBe(title)
  })

  it('updates the title during client navigation and the overview redirect', async () => {
    renderRoute('/overview')
    expect(document.title).toBe('Ferdin Raphael — Software & Systems')
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    fireEvent.click(within(navigation).getByRole('link', { name: 'Projects' }))
    expect(document.title).toBe('Projects — Ferdin Raphael')
    fireEvent.click(within(navigation).getByRole('link', { name: 'Overview' }))
    expect(document.title).toBe('Ferdin Raphael — Software & Systems')
  })

  it.each([
    ['/profile', /Experience across systems/],
    ['/projects', /Built to explore/],
    ['/built-and-published', /Things I've finished/],
    ['/services', /Practical technical help/],
  ])('renders %s', (path, heading) => {
    renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to overview/ })).toBeInTheDocument()
  })

  it('renders the published writing separately from development drafts', async () => {
    renderRoute('/writings')
    expect(await screen.findByRole('heading', { level: 1, name: /Writing about software, systems/i }, { timeout: 5_000 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No published writings yet.' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Latest writing' })).toBeInTheDocument()
    expect(screen.queryByText('1 writing')).not.toBeInTheDocument()
    expect(document.querySelector('[data-layout="single"]')).not.toBeNull()
    const publishedCard = screen.getByRole('heading', { name: 'When the Workaround Becomes the Architecture' }).closest('article')
    expect(publishedCard).not.toBeNull()
    expect(within(publishedCard!).getByText('Article')).toBeInTheDocument()
    expect(within(publishedCard!).getByText('Published May 10, 2026')).toBeInTheDocument()
    expect(within(publishedCard!).queryByText('DRAFT')).not.toBeInTheDocument()
    expect(within(publishedCard!).getByRole('link', { name: 'Read writing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Draft previews' })).toBeInTheDocument()
    const frameworkPreviewCard = screen.getByRole('heading', { name: 'Technical writing framework preview' }).closest('article')
    expect(frameworkPreviewCard).not.toBeNull()
    expect(within(frameworkPreviewCard!).getByText('Connected to Little Worlds')).toBeInTheDocument()
    expect(within(frameworkPreviewCard!).getByText('DRAFT')).toBeInTheDocument()
    expect(within(frameworkPreviewCard!).getByText('Article')).toBeInTheDocument()
    expect(within(frameworkPreviewCard!).getByRole('link', { name: 'Preview draft' })).toBeInTheDocument()
    expect(document.querySelectorAll('a[href^="/notes"]')).toHaveLength(0)
  })

  it('keeps plural writing presentation and grid behavior for multiple entries', () => {
    expect(publishedWritingPresentation(2)).toEqual({
      heading: 'Latest writings',
      layout: 'grid',
      showCount: true,
    })
  })

  it('keeps the public navigation focused on the launch information architecture', () => {
    renderRoute('/')
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Overview',
      'Projects',
      'Built & Published',
      'Services',
      'Writings',
    ])
    expect(within(navigation).queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
  })

  it('keeps the mobile drawer limited to public navigation, GitHub, and Email', () => {
    renderRoute('/')
    fireEvent.click(document.querySelector('[aria-label="Open navigation menu"]')!)
    const drawer = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(within(drawer).getAllByRole('link').map((link) => link.textContent?.trim())).toEqual([
      'Overview',
      'Projects',
      'Built & Published',
      'Services',
      'Writings',
      'GitHub',
      'Email',
    ])
    expect(within(drawer).queryByText('Existing identity site')).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
  })

  it('renders verified Built & Published shelves with their exact actions', () => {
    renderRoute('/built-and-published')
    expect(screen.getByRole('heading', { name: 'Bookshelf' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tool Shelf' })).toBeInTheDocument()
    const csharpBook = screen.getByRole('heading', { name: /C# Debugging Drills/ }).closest('article')!
    const sqlBook = screen.getByRole('heading', { name: /SQL Data Cleaning Cookbook/ }).closest('article')!
    const envGuard = screen.getByRole('heading', { name: 'EnvGuard' }).closest('article')!
    const rpgDataForge = screen.getByRole('heading', { name: 'RPG Data Forge' }).closest('article')!
    expect(within(csharpBook).getByRole('link', { name: /View on Amazon/ })).toHaveAttribute(
      'href',
      'https://www.amazon.com/Debugging-Drills-Real-World-Bugs-Find-ebook/dp/B0HF8MLZ52/',
    )
    expect(within(sqlBook).getByRole('link', { name: /View on Amazon/ })).toHaveAttribute(
      'href',
      'https://www.amazon.in/SQL-Data-Cleaning-Cookbook-Real-World-ebook/dp/B0HF8KL378',
    )
    expect(within(envGuard).getByRole('link', { name: /Free version/ })).toHaveAttribute('href', 'https://payhip.com/b/KJzvD')
    expect(within(envGuard).getByRole('link', { name: /Pro version/ })).toHaveAttribute('href', 'https://payhip.com/b/r3Tn7')
    expect(within(rpgDataForge).getByRole('link', { name: /View on itch.io/ })).toHaveAttribute(
      'href',
      'https://ferdinraphael.itch.io/rpg-data-forge',
    )
    expect(screen.queryByText(/Only verified names/i)).not.toBeInTheDocument()
  })

  it('makes the focused project scope and Built & Published relationship explicit', () => {
    renderRoute('/projects')
    expect(screen.getByText('Deterministic simulation worlds')).toBeInTheDocument()
    expect(screen.getByText(/Evolving microbes with observable behaviour/)).toBeInTheDocument()
    expect(screen.getByText(/Interactive browser-based simulation/)).toBeInTheDocument()
    const outputRelationship = screen.getByText(/Smaller finished tools and publications/)
    expect(within(outputRelationship).getByRole('link', { name: 'Built & Published' })).toHaveAttribute(
      'href',
      '/built-and-published',
    )
  })

  it('renders both public projects with only their available external actions', () => {
    renderRoute('/projects')
    const littleWorlds = within(screen.getByRole('region', { name: 'Little Worlds' }))
    const wildpath = within(screen.getByRole('region', { name: 'Wildpath' }))
    expect(littleWorlds.getByRole('link', { name: 'Live Demo' })).toHaveAttribute('href', 'https://ferdinraphael.github.io/little-worlds')
    expect(littleWorlds.getByRole('link', { name: 'Repository' })).toHaveAttribute('href', 'https://github.com/ferdinraphael/little-worlds/')
    const play = wildpath.getByRole('link', { name: 'Play Wildpath' })
    expect(play).toHaveAttribute('href', 'https://ferdinraphael.github.io/wildpath/')
    expect(play).toHaveAttribute('target', '_blank')
    expect(play).toHaveAttribute('rel', 'noreferrer')
    expect(wildpath.getAllByRole('link')).toHaveLength(1)
    expect(wildpath.queryByRole('link', { name: 'Repository' })).not.toBeInTheDocument()
    expect(wildpath.getByText('Responsive browser gameplay with touch support')).toBeInTheDocument()
  })

  it('keeps service detail useful without repeated template eyebrows', () => {
    renderRoute('/services')
    expect(screen.queryByText('SCOPED SERVICE')).not.toBeInTheDocument()
    expect(screen.getByText('All services are remote.')).toBeInTheDocument()
  })

  it('loads the published writing without draft metadata', async () => {
    renderRoute('/writings/when-the-workaround-becomes-the-architecture')
    expect(await screen.findByRole('heading', { level: 1, name: 'When the Workaround Becomes the Architecture' }, { timeout: 5_000 })).toBeInTheDocument()
    expect(document.title).toBe('When the Workaround Becomes the Architecture — Ferdin Raphael')
    expect(screen.getByText('ARTICLE')).toBeInTheDocument()
    expect(screen.getByText('Published May 10, 2026')).toBeInTheDocument()
    expect(screen.queryByText('DRAFT')).not.toBeInTheDocument()
    expect(screen.queryByText('Unpublished draft')).not.toBeInTheDocument()
  })

  it('loads a draft writing directly in development with Writings navigation active', async () => {
    renderRoute('/writings/framework-preview')
    expect(await screen.findByRole('heading', { level: 1, name: 'Technical writing framework preview' }, { timeout: 5_000 })).toBeInTheDocument()
    expect(document.title).toBe('Technical writing framework preview — Ferdin Raphael')
    expect(screen.getByText('ARTICLE')).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
    expect(screen.getByText('Unpublished draft')).toBeInTheDocument()
    expect(screen.queryByText('FRAMEWORK PREVIEW')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Related projects' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Little Worlds' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Writings' }).some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
  })

  it('renders an intentional writing-not-found state for an unknown canonical slug', async () => {
    renderRoute('/writings/not-a-real-writing')
    expect(await screen.findByRole('heading', { name: 'That writing is not available.' })).toBeInTheDocument()
    expect(document.title).toBe('Not Found — Ferdin Raphael')
    expect(screen.getByRole('link', { name: /Return to Writings/ })).toHaveAttribute('href', '/writings')
  })

  it.each([
    ['/notes', '/writings'],
    ['/notes/when-the-workaround-becomes-the-architecture', '/writings/when-the-workaround-becomes-the-architecture'],
    ['/notes/framework-preview?mode=review#equivalent-examples', '/writings/framework-preview?mode=review#equivalent-examples'],
  ])('redirects legacy %s with replace-style canonical location', async (legacy, canonical) => {
    renderRoute(legacy)
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(canonical))
  })

  it('renders a useful invalid route', () => {
    renderRoute('/not-a-real-place')
    expect(screen.getByRole('heading', { name: /not in the constellation/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to overview/ })).toHaveAttribute('href', '/')
  })
})
