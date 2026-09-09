import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { links } from '../data/site'

function renderOverview() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
}

describe('overview interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('starts neutral while showing Little Worlds as featured desktop content', () => {
    renderOverview()
    expect(screen.getByText('No constellation node selected.')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: /Little Worlds featured content/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Projects\./ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Featured, not selected')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Featured Project' })).toBeInTheDocument()
  })

  it('selects Projects, switches context, and clears with Escape', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Projects\./ }))
    expect(screen.getByRole('button', { name: /^Projects\./ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('article', { name: /Projects selected content/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View Projects/ })).toHaveAttribute('href', '/projects')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /^Projects\./ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('article', { name: /Little Worlds featured content/ })).toBeInTheDocument()
  })

  it('renders approved Little Worlds selected content', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Little Worlds\./ }))
    const panel = screen.getByRole('article', { name: /Little Worlds selected content/ })
    expect(within(panel).getByText('TypeScript')).toBeInTheDocument()
    expect(within(panel).getByText('Canvas')).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: /Live Demo/ })).toHaveAttribute(
      'href',
      links.littleWorldsDemo,
    )
    expect(within(panel).queryByText('Python')).not.toBeInTheDocument()
  })

  it('opens Built & Published as a top-level constellation category', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Built & Published\./ }))
    const panel = screen.getByRole('article', { name: /Built & Published selected content/ })
    expect(within(panel).getByRole('link', { name: /View Built & Published/ })).toHaveAttribute(
      'href',
      '/built-and-published',
    )
  })

  it('selects Wildpath without replacing Little Worlds as the featured project', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Wildpath\./ }))
    const panel = within(screen.getByRole('article', { name: 'Wildpath selected content' }))
    expect(panel.getByText('Game Development')).toBeInTheDocument()
    expect(panel.getByText('Public project')).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Play Wildpath' })).toHaveAttribute('href', links.wildpathDemo)
    expect(panel.queryByRole('link', { name: 'Repository' })).not.toBeInTheDocument()
    const featured = within(screen.getByRole('region', { name: 'Featured Project' }))
    expect(featured.getByRole('heading', { name: 'Little Worlds' })).toBeInTheDocument()
    expect(featured.queryByRole('heading', { name: 'Wildpath' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('article', { name: 'Little Worlds featured content' })).toBeInTheDocument()
  })

  it('renders mobile context inline, preserves relationships, updates, and clears', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 })
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query.includes('767px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const user = userEvent.setup()
    renderOverview()
    const trigger = screen.getByRole('button', { name: /^Little Worlds\./ })
    await user.click(trigger)
    const inline = screen.getByRole('region', { name: /Little Worlds inline details/ })
    expect(within(inline).getByRole('article', { name: /Little Worlds selected content/ })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-pressed', 'true')
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Close Little Worlds details/ })).not.toBeInTheDocument()
    expect(
      screen
        .getByLabelText("Interactive map of Ferdin Raphael's technical work")
        .querySelectorAll('[data-active="true"]'),
    ).toHaveLength(4)
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      }),
    )

    const projects = screen.getByRole('button', { name: /^Projects\./ })
    await user.click(projects)
    const updatedInline = screen.getByRole('region', { name: /Projects inline details/ })
    expect(within(updatedInline).getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(projects).toHaveAttribute('aria-pressed', 'true')
    expect(trigger).toHaveAttribute('aria-pressed', 'false')

    await user.click(within(updatedInline).getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByRole('region', { name: /inline details/ })).not.toBeInTheDocument()
    expect(projects).toHaveAttribute('aria-pressed', 'false')
  })

  it('uses immediate scrolling for reduced-motion mobile selection', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 })
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query.includes('767px') || query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Writings\./ }))
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
      }),
    )
  })

  it('supports keyboard activation of constellation nodes', () => {
    renderOverview()
    const writings = screen.getByRole('button', { name: /^Writings\./ })
    writings.focus()
    fireEvent.keyDown(writings, { key: 'Enter' })
    fireEvent.click(writings)
    expect(writings).toHaveAttribute('aria-pressed', 'true')
  })

  it('derives the latest published writing and never previews a draft', async () => {
    renderOverview()
    const latestTitle = await screen.findByRole('heading', { name: 'When the Workaround Becomes the Architecture' })
    const latest = latestTitle.closest('section')!
    expect(latest).toHaveAccessibleName('Latest Writing')
    expect(within(latest).getByText(/Published May 10, 2026/)).toBeInTheDocument()
    expect(within(latest).getByRole('link', { name: /Read article/ })).toHaveAttribute(
      'href',
      '/writings/when-the-workaround-becomes-the-architecture',
    )
    expect(screen.queryByText(/Variables Are Simple/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Technical writing framework preview/i)).not.toBeInTheDocument()
  })

  it('previews books, tools, and differentiated service metadata from shared data', () => {
    renderOverview()
    const books = screen.getByRole('region', { name: 'Books' })
    expect(within(books).getByRole('heading', { name: /C# Debugging Drills/ })).toBeInTheDocument()
    expect(within(books).getByRole('heading', { name: /SQL Data Cleaning Cookbook/ })).toBeInTheDocument()
    expect(within(books).getAllByRole('article')).toHaveLength(2)
    expect(within(books).getAllByRole('link', { name: /View on Amazon/ })).toHaveLength(2)

    const tools = screen.getByRole('region', { name: 'Recent Tools' })
    expect(within(tools).getByText(/local-first .env comparison tool/i)).toBeInTheDocument()
    expect(within(tools).getByText(/offline browser tool for generating RPG/i)).toBeInTheDocument()
    expect(within(tools).getByRole('link', { name: /View EnvGuard/ })).toHaveAttribute(
      'href',
      'https://payhip.com/b/KJzvD',
    )
    expect(within(tools).getByRole('link', { name: /View on itch.io/ })).toHaveAttribute(
      'href',
      'https://ferdinraphael.itch.io/rpg-data-forge',
    )
    expect(within(tools).queryByRole('link', { name: /Pro version/ })).not.toBeInTheDocument()

    for (const title of ['Software Development', 'Technical Consulting', 'Mentoring & Teaching']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
    const services = screen.getByRole('region', { name: 'Services' })
    expect(within(services).getAllByRole('article')).toHaveLength(3)
    for (const [title, slug] of [
      ['Software Development', 'software-development'],
      ['Technical Consulting', 'technical-consulting'],
      ['Mentoring & Teaching', 'mentoring-teaching'],
    ]) {
      expect(within(services).getByRole('link', { name: `Explore ${title}` })).toHaveAttribute('href', `/services/${slug}`)
    }
    expect(within(services).getByText('All services are remote.')).toBeInTheDocument()
    expect(screen.queryByText(/Technical Content/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/preparing/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Website in 2 Days/i)).not.toBeInTheDocument()
  })
})
