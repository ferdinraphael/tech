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
import {
  runtimeModelDescription,
  runtimeModelTransitionDescription,
} from './runtimeModelDescription'

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
      { id: 'counter', kind: 'object', typeLabel: 'Counter', members: [member] },
    ],
    relationships: [{
      kind: sourceKind === 'name' ? 'binding' : 'reference',
      from: 'a',
      to: 'counter',
    }],
  }
}

function sharedState(
  sourceKind: 'variable' | 'name',
  member?: RuntimeObjectMember,
  typeLabel = 'Counter',
): RuntimeState {
  return {
    id: 'current',
    label: 'Current',
    entities: [
      { id: 'a', kind: sourceKind, label: 'a' },
      { id: 'b', kind: sourceKind, label: 'b' },
      {
        id: 'counter',
        kind: 'object',
        typeLabel,
        ...(member ? { members: [member] } : { scalarValue: '10' }),
      },
    ],
    relationships: [
      {
        kind: sourceKind === 'name' ? 'binding' : 'reference',
        from: 'b',
        to: 'counter',
      },
      {
        kind: sourceKind === 'name' ? 'binding' : 'reference',
        from: 'a',
        to: 'counter',
      },
    ],
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

function sharedVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    {
      language: 'csharp',
      code: { language: 'csharp', code: 'var a = new Counter { Value = 10 };\nvar b = a;' },
      states: [sharedState('variable', { name: 'Value', kind: 'property', value: '10' })],
    },
    {
      language: 'java',
      code: { language: 'java', code: 'Counter a = new Counter(10);\nCounter b = a;' },
      states: [sharedState('variable', { name: 'value', kind: 'field', value: '10' })],
    },
    {
      language: 'python',
      code: { language: 'python', code: 'a = Counter(value=10)\nb = a' },
      states: [sharedState('name', { name: 'value', kind: 'field', value: '10' })],
    },
  ]
}

function mutationState(sourceKind: 'variable' | 'name', id: 'before' | 'after', value: string) {
  return {
    ...sharedState(sourceKind, { name: sourceKind === 'variable' ? 'Value' : 'value', kind: sourceKind === 'variable' ? 'property' : 'field', value }),
    id,
    label: id === 'before' ? 'Before mutation' : 'After mutation',
  } satisfies RuntimeState
}

function mutationVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    { language: 'csharp', code: { language: 'csharp', code: 'var b = a;\nb.Value = 20;' }, states: [mutationState('variable', 'before', '10'), mutationState('variable', 'after', '20')] },
    { language: 'java', code: { language: 'java', code: 'Counter b = a;\nb.value = 20;' }, states: [mutationState('variable', 'before', '10'), mutationState('variable', 'after', '20')] },
    { language: 'python', code: { language: 'python', code: 'b = a\nb.value = 20' }, states: [mutationState('name', 'before', '10'), mutationState('name', 'after', '20')] },
  ]
}

function splitStates(
  sourceKind: 'variable' | 'name',
  member: RuntimeObjectMember,
): [RuntimeState, RuntimeState] {
  const relationshipKind = sourceKind === 'name' ? 'binding' : 'reference'
  return [
    {
      ...sharedState(sourceKind, { ...member, value: '10' }),
      id: 'before',
      label: sourceKind === 'name' ? 'Before rebinding' : 'Before reassignment',
    },
    {
      id: 'after',
      label: sourceKind === 'name' ? 'After rebinding' : 'After reassignment',
      entities: [
        { id: 'counter-new', kind: 'object', typeLabel: 'Counter', members: [{ ...member, value: '20' }] },
        { id: 'b', kind: sourceKind, label: 'b' },
        { id: 'counter', kind: 'object', typeLabel: 'Counter', members: [{ ...member, value: '10' }] },
        { id: 'a', kind: sourceKind, label: 'a' },
      ],
      relationships: [
        { kind: relationshipKind, from: 'b', to: 'counter-new' },
        { kind: relationshipKind, from: 'a', to: 'counter' },
      ],
    },
  ]
}

function splitVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  const csharp = splitStates('variable', { name: 'Value', kind: 'property', value: '10' })
  const java = splitStates('variable', { name: 'value', kind: 'field', value: '10' })
  const python = splitStates('name', { name: 'value', kind: 'field', value: '10' })
  return [
    { language: 'csharp', code: { language: 'csharp', code: 'var b = a;\nb = new Counter { Value = 20 };' }, states: csharp },
    { language: 'java', code: { language: 'java', code: 'Counter b = a;\nb = new Counter(20);' }, states: java },
    { language: 'python', code: { language: 'python', code: 'b = a\nb = Counter(value=20)' }, states: python },
  ]
}

function directChangeStates(): [RuntimeState, RuntimeState] {
  return [
    { ...directState(), id: 'before', label: 'Before assignment' },
    {
      ...directState(),
      id: 'after',
      label: 'After assignment',
      entities: [{
        id: 'count',
        kind: 'variable',
        label: 'count',
        directValue: { type: 'int', value: '20' },
      }],
    },
  ]
}

function singleScalarRebindingStates(): [RuntimeState, RuntimeState] {
  return [
    {
      id: 'before',
      label: 'Before rebinding',
      entities: [
        { id: 'count', kind: 'name', label: 'count' },
        { id: 'int-10', kind: 'object', typeLabel: 'int', scalarValue: '10' },
      ],
      relationships: [{ kind: 'binding', from: 'count', to: 'int-10' }],
    },
    {
      id: 'after',
      label: 'After rebinding',
      entities: [
        { id: 'count', kind: 'name', label: 'count' },
        { id: 'int-20', kind: 'object', typeLabel: 'int', scalarValue: '20' },
      ],
      relationships: [{ kind: 'binding', from: 'count', to: 'int-20' }],
    },
  ]
}

function directValuesStates(): [RuntimeState, RuntimeState] {
  return [
    {
      id: 'before',
      label: 'Before assignment',
      entities: [
        { id: 'a', kind: 'variable', label: 'a', directValue: { type: 'int', value: '10' } },
        { id: 'b', kind: 'variable', label: 'b', directValue: { type: 'int', value: '10' } },
      ],
      relationships: [],
    },
    {
      id: 'after',
      label: 'After assignment',
      entities: [
        { id: 'b', kind: 'variable', label: 'b', directValue: { type: 'int', value: '20' } },
        { id: 'a', kind: 'variable', label: 'a', directValue: { type: 'int', value: '10' } },
      ],
      relationships: [],
    },
  ]
}

function scalarSplitStates(): [RuntimeState, RuntimeState] {
  return [
    {
      ...sharedState('name', undefined, 'int'),
      id: 'before',
      label: 'Before rebinding',
    },
    {
      id: 'after',
      label: 'After rebinding',
      entities: [
        { id: 'int-20', kind: 'object', typeLabel: 'int', scalarValue: '20' },
        { id: 'b', kind: 'name', label: 'b' },
        { id: 'counter', kind: 'object', typeLabel: 'int', scalarValue: '10' },
        { id: 'a', kind: 'name', label: 'a' },
      ],
      relationships: [
        { kind: 'binding', from: 'b', to: 'int-20' },
        { kind: 'binding', from: 'a', to: 'counter' },
      ],
    },
  ]
}

function scalarChangeVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    { language: 'csharp', code: { language: 'csharp', code: 'int count = 10;\ncount = 20;' }, states: directChangeStates() },
    { language: 'java', code: { language: 'java', code: 'int count = 10;\ncount = 20;' }, states: directChangeStates() },
    { language: 'python', code: { language: 'python', code: 'count = 10\ncount = 20' }, states: singleScalarRebindingStates() },
  ]
}

function scalarCopyVariants(): Array<LanguageVariant<RuntimeModelVariant>> {
  return [
    { language: 'csharp', code: { language: 'csharp', code: 'int a = 10;\nint b = a;\nb = 20;' }, states: directValuesStates() },
    { language: 'java', code: { language: 'java', code: 'int a = 10;\nint b = a;\nb = 20;' }, states: directValuesStates() },
    { language: 'python', code: { language: 'python', code: 'a = 10\nb = a\nb = 20' }, states: scalarSplitStates() },
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
  { type: 'runtime-model', variants: sharedVariants() },
  { type: 'runtime-model', variants: mutationVariants() },
  { type: 'runtime-model', variants: splitVariants() },
  { type: 'runtime-model', variants: scalarChangeVariants() },
  { type: 'runtime-model', variants: scalarCopyVariants() },
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
    expect(screen.getAllByRole('region', { name: 'Java runtime model' })).toHaveLength(7)
    expect(screen.getByText('Java prose.')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Java', selected: true })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Python' }))
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    const pythonModels = screen.getAllByRole('region', { name: 'Python runtime model' })
    expect(pythonModels).toHaveLength(7)
    expect(screen.getByText('Python prose.')).toBeInTheDocument()
    expect(within(pythonModels[0]).getByText(
      'The name count is bound to an int object representing 10.',
    )).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('Counter')).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('value')).toBeInTheDocument()
    expect(within(pythonModels[1]).getByText('field')).toBeInTheDocument()
  })

  it('renders one code block and two shared states with a changed after member', () => {
    renderRuntimeWriting()
    const mutation = screen.getAllByRole('region', { name: 'C# runtime model' })[3]
    expect(mutation.querySelectorAll('pre')).toHaveLength(1)
    expect(within(mutation).getByText('Before mutation')).toBeInTheDocument()
    expect(within(mutation).getByText('After mutation')).toBeInTheDocument()
    expect(mutation.querySelectorAll('[data-runtime-entity="object"]')).toHaveLength(2)
    expect(mutation.querySelectorAll('[data-runtime-entity="variable"]')).toHaveLength(4)
    expect(mutation.querySelectorAll('[data-runtime-changed="true"]')).toHaveLength(1)
    expect(within(mutation).getByText('changed')).toBeInTheDocument()
    expect(within(mutation).getByText(
      'Before the mutation, variables a and b refer to the same Counter object. Its Value property is 10. After the mutation, a and b still refer to the same Counter object. Its Value property is 20.',
    )).toBeInTheDocument()
  })

  it('renders a shared before state and deterministic two-target split after state', () => {
    renderRuntimeWriting()
    const split = screen.getAllByRole('region', { name: 'C# runtime model' })[4]
    expect(split.querySelectorAll('pre')).toHaveLength(1)
    expect(split.querySelectorAll('[data-runtime-entity="variable"]')).toHaveLength(4)
    expect(split.querySelectorAll('[data-runtime-entity="object"]')).toHaveLength(3)
    const after = split.querySelector('[data-runtime-topology="split-target"]')!
    expect(after.querySelectorAll('[data-runtime-object-identity="original"]')).toHaveLength(1)
    expect(after.querySelectorAll('[data-runtime-object-identity="new"]')).toHaveLength(1)
    expect(after.querySelectorAll('[data-runtime-relationship-changed="true"]')).toHaveLength(1)
    const pairs = after.querySelectorAll('[data-runtime-entity="variable"]')
    expect(Array.from(pairs, (source) => source.textContent)).toEqual(['variablea', 'variableb'])
    const changed = after.querySelector('[data-runtime-relationship-changed="true"]')!
    expect(changed).toHaveTextContent('b')
    expect(changed.querySelector('[data-runtime-object-identity="new"]')).toBeInTheDocument()
    expect(within(split).getByText('relationship changed')).toBeInTheDocument()
    expect(within(split).getByText('changed target')).toBeInTheDocument()
    expect(within(split).getByText(
      'Before the reassignment, variables a and b refer to the same Counter object, whose Value property is 10. After the reassignment, a still refers to the original Counter object with Value 10, while b refers to a new Counter object with Value 20.',
    )).toBeInTheDocument()
  })

  it('renders Python split semantics and its generated rebinding description', async () => {
    const user = userEvent.setup()
    renderRuntimeWriting()
    await user.click(screen.getByRole('radio', { name: 'Python' }))
    const split = screen.getAllByRole('region', { name: 'Python runtime model' })[4]
    expect(split.querySelectorAll('[data-runtime-entity="name"]')).toHaveLength(4)
    expect(within(split).getByText(
      'Before the rebinding, the names a and b are bound to the same Counter object, whose value field is 10. After the rebinding, a remains bound to the original Counter object with value 10, while b is bound to a new Counter object with value 20.',
    )).toBeInTheDocument()
  })

  it('renders one and two direct-value changes with semantic changed markers', () => {
    renderRuntimeWriting()
    const models = screen.getAllByRole('region', { name: 'C# runtime model' })
    const single = models[5]
    expect(single.querySelectorAll('pre')).toHaveLength(1)
    expect(single.querySelectorAll('[data-runtime-changed="true"]')).toHaveLength(1)
    expect(within(single).getByText('value assigned')).toBeInTheDocument()
    expect(within(single).getByText(
      'Variable count directly contains the int value 10 before the assignment. After the assignment, the same variable directly contains the int value 20.',
    )).toBeInTheDocument()

    const copy = models[6]
    expect(copy.querySelectorAll('pre')).toHaveLength(1)
    const directValueStates = copy.querySelectorAll('[data-runtime-topology="direct-values"]')
    expect(directValueStates).toHaveLength(2)
    expect(Array.from(directValueStates).every((state) => state.querySelector('svg') === null))
      .toBe(true)
    expect(copy.querySelectorAll('[data-runtime-changed="true"]')).toHaveLength(1)
    const afterVariables = copy.querySelectorAll('[data-runtime-topology="direct-values"]')[1]
      .querySelectorAll('[data-runtime-entity="variable"]')
    expect(Array.from(afterVariables, (source) => source.textContent)).toEqual([
      'aint10',
      'bint20changed',
    ])
    expect(within(copy).getByText(
      'Before the assignment, variables a and b each directly contain the int value 10. After the assignment, a still contains 10 while b directly contains 20.',
    )).toBeInTheDocument()
  })

  it('renders single and shared Python scalar rebinding semantics', async () => {
    const user = userEvent.setup()
    renderRuntimeWriting()
    await user.click(screen.getByRole('radio', { name: 'Python' }))
    const models = screen.getAllByRole('region', { name: 'Python runtime model' })
    const single = models[5]
    expect(single.querySelectorAll('[data-runtime-entity="name"]')).toHaveLength(2)
    expect(single.querySelectorAll('[data-runtime-entity="object"]')).toHaveLength(2)
    expect(within(single).getByText(
      'Before the rebinding, the name count is bound to an int object representing 10. After the rebinding, count is bound to a different int object representing 20.',
    )).toBeInTheDocument()

    const split = models[6]
    expect(split.querySelectorAll('[data-runtime-object-identity="original"]')).toHaveLength(2)
    expect(split.querySelectorAll('[data-runtime-object-identity="new"]')).toHaveLength(1)
    expect(split.querySelectorAll('[data-runtime-relationship-changed="true"]')).toHaveLength(1)
    expect(within(split).getByText(
      'Before the rebinding, the names a and b are bound to the same int object representing 10. After the rebinding, a remains bound to the original int object representing 10, while b is bound to a new int object representing 20.',
    )).toBeInTheDocument()
  })

  it('renders two declared-order sources converging on one shared object card', () => {
    renderRuntimeWriting()
    const sharedModel = screen.getAllByRole('region', { name: 'C# runtime model' })[2]
    const sourceCards = sharedModel.querySelectorAll('[data-runtime-entity="variable"]')
    expect(Array.from(sourceCards, (source) => source.textContent)).toEqual(['variablea', 'variableb'])
    expect(sharedModel.querySelectorAll('[data-runtime-entity="object"]')).toHaveLength(1)
    expect(within(sharedModel).getByText(
      'Variables a and b refer to the same Counter object. Its Value property is 10.',
    )).toBeInTheDocument()
    expect(within(sharedModel).getByText('Value')).toBeInTheDocument()
    expect(within(sharedModel).getByText('property')).toBeInTheDocument()
  })

  it('switches shared references and bindings with Read As and code tabs', async () => {
    const user = userEvent.setup()
    renderRuntimeWriting()
    await user.click(screen.getByRole('radio', { name: 'Java' }))
    const javaShared = screen.getAllByRole('region', { name: 'Java runtime model' })[2]
    expect(javaShared.querySelectorAll('[data-runtime-entity="variable"]')).toHaveLength(2)
    expect(within(javaShared).getByText(
      'Variables a and b refer to the same Counter object. Its value field is 10.',
    )).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Python' }))
    const pythonShared = screen.getAllByRole('region', { name: 'Python runtime model' })[2]
    expect(pythonShared.querySelectorAll('[data-runtime-entity="name"]')).toHaveLength(2)
    expect(within(pythonShared).getByText(
      'The names a and b are bound to the same Counter object. Its value field is 10.',
    )).toBeInTheDocument()
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
    expect(screen.getAllByRole('region', { name: 'Python runtime model' })).toHaveLength(7)
    expect(screen.queryByRole('region', { name: 'C# runtime model' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Java runtime model' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Python' }))
    expect(screen.getByRole('radio', { name: 'Python' })).toBeChecked()
    expect(screen.getAllByRole('region', { name: 'Python runtime model' })).toHaveLength(7)
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

  it('describes shared references, bindings, and scalar objects with same-object semantics', () => {
    expect(runtimeModelDescription(
      sharedState('variable', { name: 'Value', kind: 'property', value: '10' }),
    )).toBe('Variables a and b refer to the same Counter object. Its Value property is 10.')
    expect(runtimeModelDescription(
      sharedState('name', { name: 'value', kind: 'field', value: '10' }),
    )).toBe('The names a and b are bound to the same Counter object. Its value field is 10.')
    expect(runtimeModelDescription(sharedState('variable', undefined, 'int'))).toBe(
      'Variables a and b refer to the same int object representing 10.',
    )
  })

  it('describes reference and binding mutation continuity', () => {
    expect(runtimeModelTransitionDescription(
      mutationState('variable', 'before', '10'),
      mutationState('variable', 'after', '20'),
    )).toContain('After the mutation, a and b still refer to the same Counter object')
    expect(runtimeModelTransitionDescription(
      mutationState('name', 'before', '10'),
      mutationState('name', 'after', '20'),
    )).toBe('Before the mutation, the names a and b are bound to the same Counter object. Its value field is 10. After the mutation, a and b are still bound to the same Counter object. Its value field is 20.')
  })

  it('describes C#, Java, and Python split transitions with reassignment semantics', () => {
    const [csharpBefore, csharpAfter] = splitStates(
      'variable',
      { name: 'Value', kind: 'property', value: '10' },
    )
    const [javaBefore, javaAfter] = splitStates(
      'variable',
      { name: 'value', kind: 'field', value: '10' },
    )
    const [pythonBefore, pythonAfter] = splitStates(
      'name',
      { name: 'value', kind: 'field', value: '10' },
    )
    expect(runtimeModelTransitionDescription(csharpBefore, csharpAfter)).toBe(
      'Before the reassignment, variables a and b refer to the same Counter object, whose Value property is 10. After the reassignment, a still refers to the original Counter object with Value 10, while b refers to a new Counter object with Value 20.',
    )
    expect(runtimeModelTransitionDescription(javaBefore, javaAfter)).toBe(
      'Before the reassignment, variables a and b refer to the same Counter object, whose value field is 10. After the reassignment, a still refers to the original Counter object with value 10, while b refers to a new Counter object with value 20.',
    )
    expect(runtimeModelTransitionDescription(pythonBefore, pythonAfter)).toBe(
      'Before the rebinding, the names a and b are bound to the same Counter object, whose value field is 10. After the rebinding, a remains bound to the original Counter object with value 10, while b is bound to a new Counter object with value 20.',
    )
  })

  it('describes current and changing scalar value semantics', () => {
    expect(runtimeModelDescription(directValuesStates()[0])).toBe(
      'Variables a and b each directly contain the int value 10.',
    )
    expect(runtimeModelDescription(directValuesStates()[1])).toBe(
      'Variable b directly contains the int value 20, while variable a directly contains the int value 10.',
    )
    expect(runtimeModelTransitionDescription(...directChangeStates())).toBe(
      'Variable count directly contains the int value 10 before the assignment. After the assignment, the same variable directly contains the int value 20.',
    )
    expect(runtimeModelTransitionDescription(...directValuesStates())).toBe(
      'Before the assignment, variables a and b each directly contain the int value 10. After the assignment, a still contains 10 while b directly contains 20.',
    )
    expect(runtimeModelTransitionDescription(...singleScalarRebindingStates())).toBe(
      'Before the rebinding, the name count is bound to an int object representing 10. After the rebinding, count is bound to a different int object representing 20.',
    )
    expect(runtimeModelTransitionDescription(...scalarSplitStates())).toBe(
      'Before the rebinding, the names a and b are bound to the same int object representing 10. After the rebinding, a remains bound to the original int object representing 10, while b is bound to a new int object representing 20.',
    )
  })
})
