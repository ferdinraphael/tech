import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { preferredLanguageStorageKey } from '../../content/writings/languages'
import type { WritingSegment } from '../../content/writings/types'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { MarkdownWriting } from './MarkdownWriting'
import styles from './Writings.module.css'

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

const languageSegments: WritingSegment[] = [
  { type: 'markdown', source: '## Start with a number\n\nGeneric introduction.' },
  {
    type: 'language-content',
    variants: [
      { language: 'csharp', source: 'C# first uses `count` with **strong text**.' },
      { language: 'java', source: 'Java first uses `count` with *emphasis*.' },
      { language: 'python', source: 'Python first uses [a link](https://example.com).' },
    ],
  },
  {
    type: 'language-content',
    variants: [
      { language: 'csharp', source: '- C# second one\n- C# second two' },
      { language: 'java', source: '- Java second one\n- Java second two' },
      { language: 'python', source: '- Python second one\n- Python second two' },
    ],
  },
]

const languageAwareCodeSegments: WritingSegment[] = [
  {
    type: 'code-tabs',
    samples: [
      { language: 'csharp', code: 'int first = 1;' },
      { language: 'java', code: 'int first = 1;' },
      { language: 'python', code: 'first = 1' },
    ],
  },
  ...languageSegments,
  {
    type: 'code-tabs',
    samples: [
      { language: 'csharp', code: 'int second = 2;' },
      { language: 'java', code: 'int second = 2;' },
      { language: 'python', code: 'second = 2' },
    ],
  },
]

function renderWriting(segments: WritingSegment[], languageAware = false) {
  return render(
    <LanguagePreferenceProvider
      readerLanguages={languageAware ? ['csharp', 'java', 'python'] : undefined}
      defaultReaderLanguage={languageAware ? 'csharp' : undefined}
    >
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
    const code = screen.getByLabelText('TypeScript code')
    const figure = code.closest('figure')
    expect(code).toHaveTextContent('const answer: number = 42')
    expect(figure).toHaveClass(styles.standaloneCodeBlock)
    expect(figure).not.toHaveClass(styles.plainTextBlock)
    await user.click(screen.getByRole('button', { name: 'Copy TypeScript code' }))
    expect(writeText).toHaveBeenCalledWith('const answer: number = 42')
    expect(screen.getByRole('button', { name: 'Copy TypeScript code' })).toHaveTextContent('Copied')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBeNull()
  })

  it('wraps standalone plaintext while copying its exact original content', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    const plaintext = 'Keep  two spaces and\ta tab.\n- Preserve this explicit line break.\nA-very-long-prose-like-line'
    renderWriting([{ type: 'markdown', source: `\`\`\`plaintext\n${plaintext}\n\`\`\`` }])

    const code = screen.getByLabelText('Plain text code')
    const figure = code.closest('figure')
    expect(screen.getByText('Plain text')).toBeInTheDocument()
    expect(code.textContent).toBe(plaintext)
    expect(figure).toHaveClass(styles.standaloneCodeBlock, styles.plainTextBlock)

    await user.click(screen.getByRole('button', { name: 'Copy Plain text code' }))
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(plaintext)
  })

  it('keeps code-tab blocks on the existing non-standalone presentation', () => {
    renderWriting([tabSegments[0]])
    const panelFigure = screen.getByRole('tabpanel').querySelector('figure')
    expect(panelFigure).toHaveClass(styles.codeBlock)
    expect(panelFigure).not.toHaveClass(styles.standaloneCodeBlock, styles.plainTextBlock)
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

  it('omits Read As for ordinary writing and renders it once before language prose', () => {
    renderWriting([{ type: 'markdown', source: 'Ordinary writing.' }])
    expect(screen.queryByRole('group', { name: 'Read this article as' })).not.toBeInTheDocument()

    renderWriting(languageSegments, true)
    expect(screen.getAllByRole('group', { name: 'Read this article as' })).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'C#' })).toBeChecked()
    expect(screen.getByText(/C# first uses/)).toBeInTheDocument()
    expect(screen.getByText('C# second one')).toBeInTheDocument()
    expect(screen.queryByText(/Java first uses/)).not.toBeInTheDocument()
  })

  it('switches every language-content block and renders restricted Markdown semantics', async () => {
    const user = userEvent.setup()
    renderWriting(languageSegments, true)

    const java = screen.getByRole('radio', { name: 'Java' })
    await user.click(java)
    expect(java).toBeChecked()
    expect(java).toHaveFocus()
    expect(screen.getByText(/Java first uses/)).toBeInTheDocument()
    expect(screen.getByText('emphasis').tagName).toBe('EM')
    expect(screen.getByText('Java second one')).toBeInTheDocument()
    expect(screen.queryByText('C# second one')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('java')

    await user.click(screen.getByRole('radio', { name: 'Python' }))
    expect(screen.getByText(/Python first uses/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'a link' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByText('Python second one').closest('ul')).toBeInTheDocument()
  })

  it('renders Compare in declared order without persisting a fake value and returns to the prior language', async () => {
    const user = userEvent.setup()
    renderWriting(languageSegments, true)
    await user.click(screen.getByRole('radio', { name: 'Python' }))
    await user.click(screen.getByRole('radio', { name: 'Compare' }))

    expect(screen.getByRole('radio', { name: 'Compare' })).toBeChecked()
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('python')
    const firstComparison = screen.getAllByRole('region', { name: 'Language comparison' })[0]
    expect(within(firstComparison).getAllByText(/^(C#|Java|Python)$/).map((node) => node.textContent))
      .toEqual(['C#', 'Java', 'Python'])
    expect(screen.getByText(/C# first uses/)).toBeInTheDocument()
    expect(screen.getByText(/Java first uses/)).toBeInTheDocument()
    expect(screen.getByText(/Python first uses/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Python' }))
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    expect(screen.queryByText(/Java first uses/)).not.toBeInTheDocument()
  })

  it('initializes supported preferences and preserves unsupported TypeScript preferences', () => {
    window.localStorage.setItem(preferredLanguageStorageKey, 'python')
    const { unmount } = renderWriting(languageSegments, true)
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    unmount()

    window.localStorage.setItem(preferredLanguageStorageKey, 'typescript')
    renderWriting(languageSegments, true)
    expect(screen.getByRole('radio', { name: 'C#' })).toBeChecked()
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('typescript')
  })

  it('synchronizes language-aware code tabs with Read As and language-content', async () => {
    const user = userEvent.setup()
    renderWriting(languageAwareCodeSegments, true)

    expect(screen.getAllByRole('group', { name: 'Read this article as' })).toHaveLength(1)
    expect(screen.getAllByRole('tab', { name: 'C#', selected: true })).toHaveLength(2)
    await user.click(screen.getAllByRole('tab', { name: 'Java' })[0])

    expect(screen.getByRole('radio', { name: 'Java' })).toBeChecked()
    expect(screen.getAllByRole('tab', { name: 'Java', selected: true })).toHaveLength(2)
    expect(screen.getByText(/Java first uses/)).toBeInTheDocument()
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('java')

    await user.click(screen.getByRole('radio', { name: 'Python' }))
    expect(screen.getAllByRole('tab', { name: 'Python', selected: true })).toHaveLength(2)
    expect(screen.getByText(/Python first uses/)).toBeInTheDocument()
  })

  it('renders every language-aware code sample in Compare without tab semantics', async () => {
    const user = userEvent.setup()
    renderWriting(languageAwareCodeSegments, true)
    await user.click(screen.getByRole('radio', { name: 'Compare' }))

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
    const comparisons = screen.getAllByRole('region', { name: 'Equivalent code comparison' })
    expect(comparisons).toHaveLength(2)
    expect(within(comparisons[0]).getAllByText(/^(C#|Java|Python)$/).map((node) => node.textContent))
      .toEqual(['C#', 'Java', 'Python'])
    expect(within(comparisons[0]).getByLabelText('C# code'))
      .toHaveTextContent('int first = 1;')
    expect(within(comparisons[0]).getByLabelText('Java code'))
      .toHaveTextContent('int first = 1;')
    expect(within(comparisons[0]).getByLabelText('Python code'))
      .toHaveTextContent('first = 1')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBeNull()
  })
})
