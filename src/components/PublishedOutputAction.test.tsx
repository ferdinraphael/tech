import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PublishedOutputAction } from './PublishedOutputAction'

describe('PublishedOutputAction', () => {
  it('supports internal, external, and direct-download destinations', () => {
    render(
      <MemoryRouter>
        <PublishedOutputAction action={{ kind: 'internal', label: 'Read more', route: '/output' }} />
        <PublishedOutputAction action={{ kind: 'external', label: 'View publisher', href: 'https://example.com/book' }} />
        <PublishedOutputAction action={{ kind: 'download', label: 'Download ebook', href: '/files/book.epub', fileName: 'book.epub' }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /Read more/ })).toHaveAttribute('href', '/output/')
    expect(screen.getByRole('link', { name: /View publisher/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /View publisher/ })).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('link', { name: /Download ebook/ })).toHaveAttribute('download', 'book.epub')
  })
})
