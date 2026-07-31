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
    ['/notes', /writing space is taking shape/],
  ])('renders %s', (path, heading) => {
    renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to overview/ })).toBeInTheDocument()
  })

  it('renders a useful invalid route', () => {
    renderRoute('/not-a-real-place')
    expect(screen.getByRole('heading', { name: /not in the constellation/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to overview/ })).toHaveAttribute('href', '/')
  })
})
