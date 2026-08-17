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

  it('keeps Website in 2 Days in a non-clickable Coming Soon state', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^Website in 2 Days\./ }))
    const panel = screen.getByRole('article', { name: /Website in 2 Days selected content/ })
    expect(within(panel).getAllByText('Coming Soon').length).toBeGreaterThan(0)
    expect(within(panel).queryByRole('link')).not.toBeInTheDocument()
  })

  it('uses the approved email action for More Ways to Work Together', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('button', { name: /^More Ways to Work Together\./ }))
    const panel = screen.getByRole('article', { name: /More Ways to Work Together selected content/ })
    expect(within(panel).getByRole('link', { name: /Discuss your requirement/ })).toHaveAttribute(
      'href',
      links.enquiry,
    )
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
    await user.click(screen.getByRole('button', { name: /^Notes\./ }))
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
      }),
    )
  })

  it('supports keyboard activation of constellation nodes', () => {
    renderOverview()
    const notes = screen.getByRole('button', { name: /^Notes\./ })
    notes.focus()
    fireEvent.keyDown(notes, { key: 'Enter' })
    fireEvent.click(notes)
    expect(notes).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders an intentional notes empty state without articles', () => {
    renderOverview()
    expect(screen.getByText('NOTES / PREPARING')).toBeInTheDocument()
    expect(screen.getByText(/Technical notes are being prepared/)).toBeInTheDocument()
    expect(screen.queryByText('Designing Modular Simulation Systems')).not.toBeInTheDocument()
  })
})
