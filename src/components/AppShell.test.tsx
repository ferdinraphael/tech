import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

// jsdom does not apply viewport media queries. Browser tests verify responsive
// visibility; these tests exercise the shell's interaction behavior directly.
vi.mock('./Tech.module.css', () => ({ default: {} }))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/services']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="services" element={<a href="#service">Service content</a>} />
          <Route path="projects" element={<h1>Projects content</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('mobile navigation drawer', () => {
  it.each(['Services', 'Projects'])('closes on %s, including the current destination, and restores focus', async (destination) => {
    const user = userEvent.setup()
    renderShell()
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    await user.click(trigger)
    const drawer = screen.getByRole('navigation', { name: 'Mobile navigation' })
    await user.click(within(drawer).getByRole('link', { name: destination }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('main')).not.toHaveAttribute('inert')
    if (destination === 'Projects') expect(screen.getByRole('heading', { name: 'Projects content' })).toBeInTheDocument()
  })

  it('contains keyboard focus in both directions, makes the background inert, and restores focus on Escape', async () => {
    const user = userEvent.setup()
    renderShell()
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' })
    const close = within(dialog).getByRole('button', { name: 'Close navigation menu' })
    const email = within(dialog).getByRole('link', { name: 'Email' })
    expect(close).toHaveFocus()
    expect(screen.getByRole('main')).toHaveAttribute('inert')
    expect(screen.getByRole('banner')).toHaveAttribute('inert')
    expect(screen.getByRole('navigation', { name: 'Mobile primary navigation' })).toHaveAttribute('inert')
    await user.tab({ shift: true })
    expect(email).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    for (let index = 0; index < 9; index += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it.each(['Close navigation menu', 'Email', 'GitHub'])('dismisses through %s and restores focus', async (action) => {
    const user = userEvent.setup()
    renderShell()
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    const control = within(dialog).getByRole(action === 'Close navigation menu' ? 'button' : 'link', { name: action })
    // Exercise dismissal without opening an external application in the test.
    control.addEventListener('click', (event) => event.preventDefault(), { once: true })
    await user.click(control)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('dismisses on the backdrop and leaves desktop navigation behavior intact', async () => {
    const user = userEvent.setup()
    renderShell()
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    await user.click(trigger)
    await user.click(screen.getByRole('dialog'))
    expect(trigger).toHaveFocus()
    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('link', { name: 'Projects' }))
    expect(screen.getByRole('heading', { name: 'Projects content' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
