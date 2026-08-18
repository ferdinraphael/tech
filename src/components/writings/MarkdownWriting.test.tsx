import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { preferredLanguageStorageKey } from '../../content/writings/languages'
import type { WritingSegment } from '../../content/writings/types'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { MarkdownWriting } from './MarkdownWriting'

const tabSegments: WritingSegment[] = [
  {
    type: 'code-tabs',
    samples: [
      { language: 'csharp', code: 'var language = "csharp";' },
      { language: 'typescript', code: 'const language = "typescript"' },
      { language: 'python', code: 'language = "python"' },
    ],
  },
  {
    type: 'code-tabs',
    samples: [
      { language: 'typescript', code: 'const second = true' },
      { language: 'python', code: 'second = True' },
    ],
  },
]

function renderWriting(segments: WritingSegment[]) {
  return render(
    <LanguagePreferenceProvider>
      <MarkdownWriting segments={segments} />
    </LanguagePreferenceProvider>,
  )
}

describe('Markdown writing rendering', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders normal fenced code with highlighting and an independent copy action', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    renderWriting([{ type: 'markdown', source: '```ts\nconst answer: number = 42\n```' }])
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByLabelText('TypeScript code')).toHaveTextContent('const answer: number = 42')
    await user.click(screen.getByRole('button', { name: 'Copy TypeScript code' }))
    expect(writeText).toHaveBeenCalledWith('const answer: number = 42')
    expect(screen.getByRole('button', { name: 'Copy TypeScript code' })).toHaveTextContent('Copied')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBeNull()
  })

  it('uses the first tab by default and synchronizes compatible blocks', async () => {
    const user = userEvent.setup()
    renderWriting(tabSegments)
    expect(screen.getByRole('tab', { name: 'C#', selected: true })).toBeInTheDocument()

    await user.click(screen.getAllByRole('tab', { name: 'Python' })[0])
    expect(screen.getAllByRole('tab', { name: 'Python', selected: true })).toHaveLength(2)
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('python')
  })

  it('restores a persisted preference on a future render', () => {
    window.localStorage.setItem(preferredLanguageStorageKey, 'typescript')
    renderWriting(tabSegments)
    expect(screen.getAllByRole('tab', { name: 'TypeScript', selected: true })).toHaveLength(2)
  })

  it('falls back locally without overwriting an unavailable global preference', () => {
    window.localStorage.setItem(preferredLanguageStorageKey, 'csharp')
    renderWriting([tabSegments[1]])
    expect(screen.getByRole('tab', { name: 'TypeScript', selected: true })).toBeInTheDocument()
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('csharp')
  })

  it('supports arrow, Home, and End keyboard tab navigation', async () => {
    const user = userEvent.setup()
    renderWriting([tabSegments[0]])
    const csharp = screen.getByRole('tab', { name: 'C#' })
    csharp.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'TypeScript', selected: true })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Python', selected: true })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(csharp).toHaveAttribute('aria-selected', 'true')
    expect(csharp).toHaveFocus()
  })

  it('copies only the currently selected code-tab language', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    renderWriting([tabSegments[0]])
    await user.click(screen.getByRole('tab', { name: 'Python' }))
    const panel = screen.getByRole('tabpanel')
    await user.click(within(panel).getByRole('button', { name: 'Copy Python code' }))
    expect(writeText).toHaveBeenCalledWith('language = "python"')
  })

  it('renders raw HTML as inert text instead of executable elements', () => {
    const { container } = renderWriting([
      { type: 'markdown', source: '<img src="x" onerror="alert(1)">\n\nSafe paragraph.' },
    ])
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/onerror/)).toBeInTheDocument()
    expect(screen.getByText('Safe paragraph.')).toBeInTheDocument()
  })

  it('renders GFM structure, safe links, and stable formatted heading anchors', () => {
    const { container } = renderWriting([{
      type: 'markdown',
      source: [
        '## A **formatted** heading',
        '',
        '- one',
        '- two',
        '',
        '| Name | Value |',
        '| --- | ---: |',
        '| Answer | 42 |',
        '',
        '[External](https://example.com) and [unsafe](javascript:alert(1)).',
      ].join('\n'),
    }])

    expect(screen.getByRole('heading', { name: /A formatted heading/ })).toHaveAttribute('id', 'a-formatted-heading')
    expect(screen.getByRole('list')).toHaveTextContent('onetwo')
    expect(screen.getByRole('table')).toHaveTextContent('Answer42')
    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'unsafe' })).not.toBeInTheDocument()
    expect(container.querySelector('[href^="javascript:"]')).toBeNull()
  })
})
