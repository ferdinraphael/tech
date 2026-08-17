import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../App'

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
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

  it('renders the Notes index with an intentional empty state and separate development drafts', async () => {
    renderRoute('/notes')
    expect(await screen.findByRole('heading', { level: 1, name: /Writing shaped around/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No published articles yet.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Framework draft previews' })).toBeInTheDocument()
    expect(screen.getByText('Connected to Little Worlds')).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('loads a draft article directly in development with Notes navigation active', async () => {
    renderRoute('/notes/framework-preview')
    expect(await screen.findByRole('heading', { level: 1, name: 'Technical writing framework preview' })).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Related projects' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Little Worlds' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Notes' }).some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
  })

  it('renders an intentional article-not-found state for an unknown slug', async () => {
    renderRoute('/notes/not-a-real-note')
    expect(await screen.findByRole('heading', { name: 'That technical note is not available.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to Notes/ })).toHaveAttribute('href', '/notes')
  })

  it('renders a useful invalid route', () => {
    renderRoute('/not-a-real-place')
    expect(screen.getByRole('heading', { name: /not in the constellation/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to overview/ })).toHaveAttribute('href', '/')
  })
})
