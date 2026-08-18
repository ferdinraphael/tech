import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../App'

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
    ['/profile', /Experience across systems/],
    ['/projects', /Built to explore/],
    ['/services', /Focused engagements/],
  ])('renders %s', (path, heading) => {
    renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to overview/ })).toBeInTheDocument()
  })

  it('renders the published writing separately from development drafts', async () => {
    renderRoute('/writings')
    expect(await screen.findByRole('heading', { level: 1, name: /writing space is taking shape/i }, { timeout: 5_000 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No published writings yet.' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Latest writings' })).toBeInTheDocument()
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

  it('loads the published writing without draft metadata', async () => {
    renderRoute('/writings/when-the-workaround-becomes-the-architecture')
    expect(await screen.findByRole('heading', { level: 1, name: 'When the Workaround Becomes the Architecture' }, { timeout: 5_000 })).toBeInTheDocument()
    expect(screen.getByText('ARTICLE')).toBeInTheDocument()
    expect(screen.getByText('Published May 10, 2026')).toBeInTheDocument()
    expect(screen.queryByText('DRAFT')).not.toBeInTheDocument()
    expect(screen.queryByText('Unpublished draft')).not.toBeInTheDocument()
  })

  it('loads a draft writing directly in development with Writings navigation active', async () => {
    renderRoute('/writings/framework-preview')
    expect(await screen.findByRole('heading', { level: 1, name: 'Technical writing framework preview' }, { timeout: 5_000 })).toBeInTheDocument()
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
