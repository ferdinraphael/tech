import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  LanguageVariant,
  RuntimeModelVariant,
  RuntimeObjectMember,
  RuntimeState,
  WritingSegment,
} from '../../content/writings/types'
import { LanguagePreferenceProvider } from './LanguagePreference'
import { MarkdownWriting } from './MarkdownWriting'
import { runtimeModelDescription } from './runtimeModelDescription'

function directState(): RuntimeState {
  return {
    id: 'current',
    label: 'Current',
    entities: [{
      id: 'count',
      kind: 'variable',
      label: 'count',
      directValue: { type: 'int', value: '10' },
    }],
    relationships: [],
  }
}

function objectState(
  sourceKind: 'variable' | 'name',
  member: RuntimeObjectMember,
): RuntimeState {
  return {
    id: 'current',
    label: 'Current',
    entities: [
      { id: 'a', kind: sourceKind, label: 'a' },
      { id: 'counter', kind: 'object', typeLabel: 'Counter', fields: [member] },
    ],
    relationships: [{
      kind: sourceKind === 'name' ? 'binding' : 'reference',
      from: 'a',
      to: 'counter',
    }],
  }
}

function numberVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    { language: 'csharp', code: { language: 'csharp', code: 'int count = 10;' }, states: [directState()] },
    { language: 'java', code: { language: 'java', code: 'int count = 10;' }, states: [directState()] },
    {
      language: 'python',
      code: { language: 'python', code: 'count = 10' },
      states: [{
        id: 'current',
        label: 'Current',
        entities: [
          { id: 'count', kind: 'name', label: 'count' },
          { id: 'int-10', kind: 'object', typeLabel: 'int', scalarValue: '10' },
        ],
        relationships: [{ kind: 'binding', from: 'count', to: 'int-10' }],
      }],
    },
  ]
}

function objectVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    {
      language: 'csharp',
      code: { language: 'csharp', code: 'var a = new Counter { Value = 10 };' },
      states: [objectState('variable', { name: 'Value', kind: 'property', value: '10' })],
    },
    {
      language: 'java',
      code: { language: 'java', code: 'Counter a = new Counter(10);' },
      states: [objectState('variable', { name: 'value', kind: 'field', value: '10' })],
    },
    {
      language: 'python',
      code: { language: 'python', code: 'a = Counter(value=10)' },
      states: [objectState('name', { name: 'value', kind: 'field', value: '10' })],
    },
  ]
}

const runtimeSegments: WritingSegment[] = [
  { type: 'runtime-model', variants: numberVariants() },
  {
    type: 'language-content',
    variants: [
      { language: 'csharp', source: 'C# prose.' },
      { language: 'java', source: 'Java prose.' },
      { language: 'python', source: 'Python prose.' },
    ],
  },
  {
    type: 'code-tabs',
    samples: [
      { language: 'csharp', code: 'C# tab' },
      { language: 'java', code: 'Java tab' },
      { language: 'python', code: 'Python tab' },
    ],
  },
  { type: 'runtime-model', variants: objectVariants() },
]

function renderRuntimeWriting() {
  return render(
    <LanguagePreferenceProvider
      readerLanguages={['csharp', 'java', 'python']}
      defaultReaderLanguage="csharp"
    >
      <MarkdownWriting segments={runtimeSegments} />
    </LanguagePreferenceProvider>,
  )
}

describe('RuntimeModel rendering', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the default direct value and places Read As before the first runtime model', () => {
    renderRuntimeWriting()
    const reader = screen.getByRole('group', { name: 'Read this article as' })
    const models = screen.getAllByRole('region', { name: 'C# runtime model' })
    expect(screen.getAllByRole('group', { name: 'Read this article as' })).toHaveLength(1)
    expect(reader.compareDocumentPosition(models[0]) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy()
    expect(within(models[0]).getByText('count')).toBeInTheDocument()
    expect(within(models[0]).getAllByText('int')).not.toHaveLength(0)
    expect(within(models[0]).getAllByText('10')).not.toHaveLength(0)
    expect(within(models[0]).getByText(
      'Variable count directly contains the int value 10.',
    )).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Current' })).not.toBeInTheDocument()
  })

  it('shares Java and Python selection with Read As, code tabs, prose, and runtime models', async () => {
    const user = userEvent.setup()
    renderRuntimeWriting()
    await user.click(screen.getByRole('radio', { name: 'Java' }))
    expect(screen.getAllByRole('region', { name: 'Java runtime model' })).toHaveLength(2)
    expect(screen.getByText('Java prose.')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Java', selected: true })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Python' }))
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    const pythonModels = screen.getAllByRole('region', { name: 'Python runtime model' })
    expect(pythonModels).toHaveLength(2)
    expect(screen.getByText('Python prose.')).toBeInTheDocument()
    expect(within(pythonModels[0]).getByText(
      'The name count is bound to an int object representing 10.',
    )).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('Counter')).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('value')).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('field')).toBeInTheDocument()
  })

  it('copies exact runtime-model code through the shared CodeBlock', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    renderRuntimeWriting()
    const model = screen.getAllByRole('region', { name: 'C# runtime model' })[0]
    await user.click(within(model).getByRole('button', { name: 'Copy C# code' }))
    expect(writeText).toHaveBeenCalledWith('int count = 10;')
  })

  it('retains the selected runtime language temporarily during Compare', async () => {
    const user = userEvent.setup()
    renderRuntimeWriting()
    await user.click(screen.getByRole('radio', { name: 'Python' }))
    await user.click(screen.getByRole('radio', { name: 'Compare' }))

    expect(screen.getByRole('radio', { name: 'Compare' })).toBeChecked()
    expect(screen.getAllByRole('region', { name: 'Python runtime model' })).toHaveLength(2)
    expect(screen.queryByRole('region', { name: 'C# runtime model' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Java runtime model' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Python' }))
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    expect(screen.getAllByRole('region', { name: 'Python runtime model' })).toHaveLength(2)
  })
})

describe('runtimeModelDescription', () => {
  it('describes direct values, bindings, reference fields, and reference properties', () => {
    expect(runtimeModelDescription(directState())).toBe(
      'Variable count directly contains the int value 10.',
    )
    expect(runtimeModelDescription(numberVariants()[2].states[0])).toBe(
      'The name count is bound to an int object representing 10.',
    )
    expect(runtimeModelDescription(
      objectState('variable', { name: 'value', kind: 'field', value: '10' }),
    )).toBe('Variable a refers to a Counter object. Its value field is 10.')
    expect(runtimeModelDescription(
      objectState('variable', { name: 'Value', kind: 'property', value: '10' }),
    )).toBe('Variable a refers to a Counter object. Its Value property is 10.')
  })
})
