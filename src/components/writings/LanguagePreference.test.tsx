import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { preferredLanguageStorageKey } from '../../content/writings/languages'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { useLanguagePreference } from './useLanguagePreference'

function PreferenceProbe() {
  const {
    preferredLanguage,
    readerConfiguration,
    readingState,
    selectCompare,
    selectLanguage,
    selectReaderLanguage,
    selectSingle,
  } = useLanguagePreference()

  return (
    <>
      <output data-testid="preferred-language">{preferredLanguage ?? 'none'}</output>
      <output data-testid="reader-configuration">
        {readerConfiguration
          ? `${readerConfiguration.languages.join(',')}:${readerConfiguration.defaultLanguage}`
          : 'ordinary'}
      </output>
      <output data-testid="reading-state">
        {readingState ? `${readingState.mode}:${readingState.language}` : 'ordinary'}
      </output>
      <button type="button" onClick={() => selectLanguage('typescript')}>
        Prefer TypeScript
      </button>
      <button type="button" onClick={() => selectReaderLanguage('python')}>
        Read Python
      </button>
      <button type="button" onClick={selectCompare}>Compare</button>
      <button type="button" onClick={selectSingle}>Single</button>
    </>
  )
}

function renderReaderProvider() {
  return render(
    <LanguagePreferenceProvider
      readerLanguages={['csharp', 'java', 'python']}
      defaultReaderLanguage="csharp"
    >
      <PreferenceProbe />
    </LanguagePreferenceProvider>,
  )
}

describe('article language preference state', () => {
  beforeEach(() => window.localStorage.clear())

  it('uses the article default without persisting it when no preference exists', () => {
    renderReaderProvider()

    expect(screen.getByTestId('preferred-language')).toHaveTextContent('none')
    expect(screen.getByTestId('reader-configuration')).toHaveTextContent(
      'csharp,java,python:csharp',
    )
    expect(screen.getByTestId('reading-state')).toHaveTextContent('single:csharp')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBeNull()
  })

  it('uses a supported persisted reader language instead of the article default', () => {
    window.localStorage.setItem(preferredLanguageStorageKey, 'python')
    renderReaderProvider()

    expect(screen.getByTestId('preferred-language')).toHaveTextContent('python')
    expect(screen.getByTestId('reading-state')).toHaveTextContent('single:python')
  })

  it('falls back from an unsupported persisted code language without overwriting it', () => {
    window.localStorage.setItem(preferredLanguageStorageKey, 'typescript')
    renderReaderProvider()

    expect(screen.getByTestId('preferred-language')).toHaveTextContent('typescript')
    expect(screen.getByTestId('reading-state')).toHaveTextContent('single:csharp')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('typescript')
  })

  it('persists explicit reader selection while Compare remains local and remembers language', async () => {
    const user = userEvent.setup()
    renderReaderProvider()

    await user.click(screen.getByRole('button', { name: 'Read Python' }))
    expect(screen.getByTestId('preferred-language')).toHaveTextContent('python')
    expect(screen.getByTestId('reading-state')).toHaveTextContent('single:python')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('python')

    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByTestId('reading-state')).toHaveTextContent('compare:python')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('python')

    await user.click(screen.getByRole('button', { name: 'Single' }))
    expect(screen.getByTestId('reading-state')).toHaveTextContent('single:python')
  })

  it('preserves ordinary-writing preference behavior and TypeScript support', async () => {
    const user = userEvent.setup()
    render(
      <LanguagePreferenceProvider>
        <PreferenceProbe />
      </LanguagePreferenceProvider>,
    )

    expect(screen.getByTestId('reader-configuration')).toHaveTextContent('ordinary')
    expect(screen.getByTestId('reading-state')).toHaveTextContent('ordinary')
    await user.click(screen.getByRole('button', { name: 'Prefer TypeScript' }))
    expect(screen.getByTestId('preferred-language')).toHaveTextContent('typescript')
    expect(window.localStorage.getItem(preferredLanguageStorageKey)).toBe('typescript')
    expect(screen.getByTestId('reading-state')).toHaveTextContent('ordinary')
  })
})
