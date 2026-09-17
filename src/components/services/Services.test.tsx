import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../../App'
import { links } from '../../data/site'

const services = [
  {
    slug: 'software-development',
    title: 'Software Development',
    heading: 'From a problem or idea to working software.',
    group: 'Three ways we can work',
    offers: ['Build something new', 'Build or extend a product', 'Part-time development support'],
    remote: 'Remote engagements only.',
    action: 'Discuss your requirement',
  },
  {
    slug: 'technical-consulting',
    title: 'Technical Consulting',
    heading: 'Understand the problem before committing to the solution.',
    group: 'Three ways I can help',
    offers: ['Technical review & assessment', 'Modernization & adoption planning', 'Ongoing technical advisory'],
    remote: 'Remote engagements only.',
    action: 'Discuss the situation',
  },
  {
    slug: 'mentoring-teaching',
    title: 'Mentoring & Teaching',
    heading: 'Learn by understanding the problem and doing the work.',
    group: 'Three ways to learn',
    offers: ['1-on-1 learning & tutoring', 'Developer mentoring & problem-solving', 'Team or small-group training'],
    remote: 'All sessions are remote.',
    action: 'Discuss your learning goal',
  },
]

function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

describe('launch services', () => {
  it('shows exactly the three approved categories with direct detail links', () => {
    renderRoute('/services')
    const main = within(screen.getByRole('main'))
    expect(main.getAllByRole('article')).toHaveLength(3)
    expect(main.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(services.map(({ title }) => title))
    for (const service of services) {
      const card = within(main.getByRole('article', { name: service.title }))
      expect(card.getByRole('link', { name: `Explore ${service.title}` })).toHaveAttribute('href', `/services/${service.slug}/`)
    }
    expect(main.getByText('All services are remote.')).toBeInTheDocument()
    expect(main.queryByText(/Technical Content|Website in 2 Days/i)).not.toBeInTheDocument()
  })

  it.each(services)('renders $title with its offers, remote boundary and email action', (service) => {
    renderRoute(`/services/${service.slug}`)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: service.heading })).toBeInTheDocument()
    const offers = within(screen.getByRole('region', { name: service.group }))
    expect(offers.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(service.offers)
    expect(screen.getByText(service.remote)).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', { name: service.action })) {
      expect(link).toHaveAttribute('href', links.enquiry)
    }
    expect(screen.getByRole('link', { name: 'Back to Services' })).toHaveAttribute('href', '/services/')
    const nav = within(screen.getByRole('navigation', { name: 'Primary navigation' }))
    expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getAllByRole('link')).toHaveLength(5)
    expect(nav.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Technical Content|Website in 2 Days/i)).not.toBeInTheDocument()
    expect(document.querySelector('form')).toBeNull()
  })

  it.each(services.slice(0, 2))('keeps numeric rates private on $title', ({ slug }) => {
    renderRoute(`/services/${slug}`)
    const text = screen.getByRole('main').textContent!
    expect(text).not.toMatch(/[₹$€£]|\b(?:INR|USD|Rs\.?)[\s\d]|\d[\d,.]*\s*(?:\/|per\s+)(?:hour|hr|day|week|month)/i)
    expect(screen.getAllByText(/^(Pricing|Engagement):/)).toHaveLength(3)
  })

  it('shows the agreed mentoring rate for both 1-on-1 offers without invented discount tiers', () => {
    renderRoute('/services/mentoring-teaching')
    expect(screen.getAllByText('₹1,500/hour', { exact: true })).toHaveLength(2)
    expect(screen.getByText('Reduced rates are available for recurring monthly plans paid in advance.')).toBeInTheDocument()
    expect(screen.getByRole('main').textContent?.match(/₹[\d,]+\/hour/g)).toEqual(['₹1,500/hour', '₹1,500/hour'])
    expect(screen.getByRole('main')).not.toHaveTextContent(/\d+\s*%/)
    expect(screen.getByText(/Quoted per workshop or short series/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Practical by default' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'A few boundaries' })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).not.toHaveTextContent(/graded assignments or exams|job placement|recordings|counts as mentoring time/i)
  })

  it('preserves development boundaries and keeps consulting focused on its public offer', () => {
    const development = renderRoute('/services/software-development')
    expect(screen.getByText(/The discovery output is yours even if/)).toBeInTheDocument()
    expect(screen.getByText(/not an on-call or 24\/7 support arrangement/)).toBeInTheDocument()
    development.unmount()
    renderRoute('/services/technical-consulting')
    expect(screen.getByRole('main')).not.toHaveTextContent(/fractional CTO|penetration testing|security audit|production access|on-call|unlimited/i)
    for (const heading of [
      'Consulting or implementation?', 'Access and confidentiality', 'Security boundary',
      'The output is yours', 'Focused advisory review', 'Structured technical assessment',
    ]) {
      expect(screen.queryByRole('heading', { name: heading })).not.toBeInTheDocument()
    }
    const process = within(screen.getByRole('region', { name: 'How a consulting engagement usually works' }))
    expect(process.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      '1. Start with the problem', '2. Review the relevant context',
      '3. Work through the options', '4. Leave with practical next steps',
    ])
  })

  it('returns from a detail page through the mobile drawer and follows another service', async () => {
    const user = userEvent.setup()
    renderRoute('/services/software-development')
    // jsdom does not apply viewport media queries; the production E2E covers visibility.
    await user.click(screen.getByLabelText('Open navigation menu'))
    const drawer = within(screen.getByRole('navigation', { name: 'Mobile navigation' }))
    expect(drawer.getAllByRole('link').map((link) => link.textContent?.trim())).toEqual([
      'Overview', 'Projects', 'Built & Published', 'Services', 'Writings', 'GitHub', 'Email',
    ])
    await user.click(drawer.getByRole('link', { name: 'Services' }))
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Explore Mentoring & Teaching' }))
    expect(screen.getByRole('heading', { name: services[2].heading })).toBeInTheDocument()
  })
})
