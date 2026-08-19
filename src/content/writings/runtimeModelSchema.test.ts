import { describe, expect, it } from 'vitest'
import { classifyRuntimeTopology, classifyRuntimeTransition } from './runtimeModelTopology'
import { parseWritingSource } from './schema'
import type { WritingSegment } from './types'

const publishedMetadata = `title: "Runtime model"
description: "Runtime model test"
format: article
publishedAt: "2026-08-19"
draft: false`

const readerMetadata = `${publishedMetadata}
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp`

const directModel = `states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: variable
        label: count
        directValue:
          type: int
          value: "10"
    relationships: []`

const bindingModel = `states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: name
        label: count
      - id: int-10
        kind: object
        typeLabel: int
        scalarValue: "10"
    relationships:
      - kind: binding
        from: count
        to: int-10`

function objectModel(
  sourceKind: 'variable' | 'name',
  relationshipKind: 'reference' | 'binding',
  memberKind: 'field' | 'property',
  memberName: string,
) {
  return `states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: ${sourceKind}
        label: a
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: ${memberName}
            kind: ${memberKind}
            value: "10"
    relationships:
      - kind: ${relationshipKind}
        from: a
        to: counter`
}

function sharedObjectModel(
  sourceKind: 'variable' | 'name',
  relationshipKind: 'reference' | 'binding',
  objectValue = `members:
          - name: value
            kind: field
            value: "10"`,
  relationshipSources: [string, string] = ['a', 'b'],
) {
  return `states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: ${sourceKind}
        label: a
      - id: b
        kind: ${sourceKind}
        label: b
      - id: counter
        kind: object
        typeLabel: Counter
        ${objectValue}
    relationships:
      - kind: ${relationshipKind}
        from: ${relationshipSources[0]}
        to: counter
      - kind: ${relationshipKind}
        from: ${relationshipSources[1]}
        to: counter`
}

function transitionModel(
  sourceKind: 'variable' | 'name' = 'variable',
  relationshipKind: 'reference' | 'binding' = 'reference',
  beforeValue = '10',
  afterValue = '20',
) {
  const state = (id: 'before' | 'after', value: string) => sharedObjectModel(
    sourceKind,
    relationshipKind,
    `members:\n          - name: value\n            kind: field\n            value: "${value}"`,
  ).replace('states:\n', '').replace('id: current', `id: ${id}`)
  return `states:\n${state('before', beforeValue)}\n${state('after', afterValue)}`
}

function splitTransitionModel(
  sourceKind: 'variable' | 'name' = 'variable',
  relationshipKind: 'reference' | 'binding' = 'reference',
  memberKind: 'field' | 'property' = 'field',
  memberName = 'value',
) {
  return `states:
  - id: before
    label: Before change
    entities:
      - { id: a, kind: ${sourceKind}, label: a }
      - { id: b, kind: ${sourceKind}, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: ${memberName}, kind: ${memberKind}, value: "10" }
    relationships:
      - { kind: ${relationshipKind}, from: a, to: counter }
      - { kind: ${relationshipKind}, from: b, to: counter }
  - id: after
    label: After change
    entities:
      - id: counter-new
        kind: object
        typeLabel: Counter
        members:
          - { name: ${memberName}, kind: ${memberKind}, value: "20" }
      - { id: b, kind: ${sourceKind}, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: ${memberName}, kind: ${memberKind}, value: "10" }
      - { id: a, kind: ${sourceKind}, label: a }
    relationships:
      - { kind: ${relationshipKind}, from: b, to: counter-new }
      - { kind: ${relationshipKind}, from: a, to: counter }`
}

function directValuesModel(aValue = '10', bValue = '10') {
  return `states:
  - id: current
    label: Current
    entities:
      - { id: a, kind: variable, label: a, directValue: { type: int, value: "${aValue}" } }
      - { id: b, kind: variable, label: b, directValue: { type: int, value: "${bValue}" } }
    relationships: []`
}

function directValueTransitionModel(afterValue = '20') {
  return `states:
  - id: before
    label: Before assignment
    entities:
      - { id: count, kind: variable, label: count, directValue: { type: int, value: "10" } }
    relationships: []
  - id: after
    label: After assignment
    entities:
      - { id: count, kind: variable, label: count, directValue: { type: int, value: "${afterValue}" } }
    relationships: []`
}

function directValuesTransitionModel(afterB = '20') {
  return `${directValuesModel().replace('id: current', 'id: before').replace('label: Current', 'label: Before assignment')}
  - id: after
    label: After assignment
    entities:
      - { id: b, kind: variable, label: b, directValue: { type: int, value: "${afterB}" } }
      - { id: a, kind: variable, label: a, directValue: { type: int, value: "10" } }
    relationships: []`
}

function singleScalarRebindingModel(afterValue = '20') {
  return `states:
  - id: before
    label: Before rebinding
    entities:
      - { id: count, kind: name, label: count }
      - { id: int-10, kind: object, typeLabel: int, scalarValue: "10" }
    relationships:
      - { kind: binding, from: count, to: int-10 }
  - id: after
    label: After rebinding
    entities:
      - { id: int-20, kind: object, typeLabel: int, scalarValue: "${afterValue}" }
      - { id: count, kind: name, label: count }
    relationships:
      - { kind: binding, from: count, to: int-20 }`
}

function scalarSplitModel() {
  return `states:
  - id: before
    label: Before rebinding
    entities:
      - { id: a, kind: name, label: a }
      - { id: b, kind: name, label: b }
      - { id: int-10, kind: object, typeLabel: int, scalarValue: "10" }
    relationships:
      - { kind: binding, from: b, to: int-10 }
      - { kind: binding, from: a, to: int-10 }
  - id: after
    label: After rebinding
    entities:
      - { id: int-20, kind: object, typeLabel: int, scalarValue: "20" }
      - { id: b, kind: name, label: b }
      - { id: int-10, kind: object, typeLabel: int, scalarValue: "10" }
      - { id: a, kind: name, label: a }
    relationships:
      - { kind: binding, from: b, to: int-20 }
      - { kind: binding, from: a, to: int-10 }`
}

function changeAfter(model: string, change: (after: string) => string): string {
  const afterIndex = model.indexOf('  - id: after')
  return model.slice(0, afterIndex) + change(model.slice(afterIndex))
}

function twoStates(model: string): string {
  const state = model.replace('states:\n', '')
  return `states:\n${state.replace('id: current', 'id: before')}\n${state.replace('id: current', 'id: after')}`
}

function languageVariant(
  language: string,
  model: string,
  options: { codeLanguage?: string; code?: string; extra?: string } = {},
) {
  const codeLanguage = options.codeLanguage ?? language
  const code = options.code ?? `${language} code`
  return `:::language ${language}

\`\`\`${codeLanguage}
${code}
\`\`\`

\`\`\`model
${model}
\`\`\`
${options.extra ?? ''}
:::`
}

function runtimeModelBody(variants: string[]) {
  return `::::runtime-model

${variants.join('\n\n')}

::::`
}

function validRuntimeModelBody() {
  return runtimeModelBody([
    languageVariant('csharp', directModel, { code: 'int count = 10;' }),
    languageVariant('java', directModel, { code: 'int count = 10;' }),
    languageVariant('python', bindingModel, { code: 'count = 10' }),
  ])
}

function writing(body: string, metadata = readerMetadata) {
  return {
    path: 'runtime-model.md',
    source: `---\n${metadata}\n---\n\n## Stable heading\n\n${body}`,
  }
}

function runtimeSegment(segments: WritingSegment[]) {
  const segment = segments.find(({ type }) => type === 'runtime-model')
  if (!segment || segment.type !== 'runtime-model') {
    throw new Error('runtime-model segment was not parsed')
  }
  return segment
}

function bodyWithModel(model: string) {
  return runtimeModelBody([
    languageVariant('csharp', model),
    languageVariant('java', directModel),
    languageVariant('python', bindingModel),
  ])
}

describe('runtime-model schema', () => {
  it('parses direct values and name-to-scalar-object models in reader language order', () => {
    const body = runtimeModelBody([
      languageVariant('python', bindingModel, { code: 'count = 10' }),
      languageVariant('csharp', directModel, { code: 'int count = 10;' }),
      languageVariant('java', directModel, { code: 'int count = 10;' }),
    ])
    const result = parseWritingSource(writing(body))
    const segment = runtimeSegment(result.segments)
    expect(segment.variants.map(({ language }) => language)).toEqual([
      'csharp',
      'java',
      'python',
    ])
    expect(segment.variants[0]).toEqual(expect.objectContaining({
      code: { language: 'csharp', code: 'int count = 10;' },
      states: [expect.objectContaining({
        id: 'current',
        entities: [expect.objectContaining({ kind: 'variable', directValue: { type: 'int', value: '10' } })],
      })],
    }))
    expect(segment.variants[2].states[0].relationships).toEqual([
      { kind: 'binding', from: 'count', to: 'int-10' },
    ])
    expect(result.headings).toEqual([
      { depth: 2, text: 'Stable heading', id: 'stable-heading' },
    ])
  })

  it('parses one-source object models with fields and properties as members', () => {
    const body = runtimeModelBody([
      languageVariant('csharp', objectModel('variable', 'reference', 'property', 'Value')),
      languageVariant('java', objectModel('variable', 'reference', 'field', 'value')),
      languageVariant('python', objectModel('name', 'binding', 'field', 'value')),
    ])
    const segment = runtimeSegment(parseWritingSource(writing(body)).segments)
    expect(segment.variants[0].states[0].entities[1]).toEqual(expect.objectContaining({
      kind: 'object',
      members: [{ name: 'Value', kind: 'property', value: '10' }],
    }))
    expect(segment.variants[1].states[0].entities[1]).toEqual(expect.objectContaining({
      members: [{ name: 'value', kind: 'field', value: '10' }],
    }))
  })

  it('parses exactly-two shared references and bindings to one object', () => {
    const references = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      sharedObjectModel('variable', 'reference', `members:
          - name: Value
            kind: property
            value: "10"`),
    ))).segments).variants[0].states[0]
    const bindings = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      sharedObjectModel('name', 'binding'),
    ))).segments).variants[0].states[0]

    expect(classifyRuntimeTopology(references)).toMatchObject({
      kind: 'shared-target',
      sources: [{ id: 'a' }, { id: 'b' }],
      target: { id: 'counter', members: [{ name: 'Value', kind: 'property', value: '10' }] },
    })
    expect(classifyRuntimeTopology(bindings)).toMatchObject({
      kind: 'shared-target',
      sources: [{ kind: 'name', id: 'a' }, { kind: 'name', id: 'b' }],
      relationships: [{ kind: 'binding' }, { kind: 'binding' }],
    })
  })

  it('supports a shared scalar object', () => {
    const state = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      sharedObjectModel('variable', 'reference', 'scalarValue: "10"'),
    ))).segments).variants[0].states[0]
    expect(classifyRuntimeTopology(state)).toMatchObject({
      kind: 'shared-target',
      target: { typeLabel: 'Counter', scalarValue: '10' },
    })
  })

  it('preserves entity declaration order when relationships use the opposite order', () => {
    const state = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      sharedObjectModel('variable', 'reference', undefined, ['b', 'a']),
    ))).segments).variants[0].states[0]
    const topology = classifyRuntimeTopology(state)
    expect(topology.kind).toBe('shared-target')
    if (topology.kind !== 'shared-target') throw new Error('Expected shared target')
    expect(topology.sources.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(topology.relationships.map(({ from }) => from)).toEqual(['a', 'b'])
  })

  it('parses shared-target runtime-model equivalently with LF and CRLF line endings', () => {
    const lf = writing(bodyWithModel(sharedObjectModel('variable', 'reference')))
    const crlf = { ...lf, source: lf.source.replace(/\n/g, '\r\n') }
    expect(parseWritingSource(crlf)).toEqual(parseWritingSource(lf))
  })

  it('parses and classifies shared-reference and shared-binding mutations', () => {
    for (const model of [
      transitionModel('variable', 'reference'),
      transitionModel('name', 'binding'),
    ]) {
      const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(model))).segments)
        .variants[0].states
      expect(states.map(({ id }) => id)).toEqual(['before', 'after'])
      if (states.length !== 2) throw new Error('Expected transition')
      expect(classifyRuntimeTransition(states[0], states[1])).toMatchObject({
        kind: 'shared-target-mutation',
        before: { sources: [{ id: 'a' }, { id: 'b' }], target: { id: 'counter' } },
        changedMembers: [{ name: 'value', beforeValue: '10', afterValue: '20' }],
      })
    }
  })

  it.each([
    ['C#', splitTransitionModel('variable', 'reference', 'property', 'Value')],
    ['Java', splitTransitionModel('variable', 'reference')],
    ['Python', splitTransitionModel('name', 'binding')],
  ])('parses and classifies a %s shared-target split', (_language, model) => {
    const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(model))).segments)
      .variants[0].states
    if (states.length !== 2) throw new Error('Expected transition')
    const transition = classifyRuntimeTransition(states[0], states[1])
    expect(transition).toMatchObject({
      kind: 'shared-target-split',
      before: { sources: [{ id: 'a' }, { id: 'b' }], target: { id: 'counter' } },
      stableSource: { id: 'a' },
      changedSource: { id: 'b' },
      originalTargetBefore: { id: 'counter' },
      originalTargetAfter: { id: 'counter' },
      newTarget: { id: 'counter-new' },
    })
    if (transition.kind !== 'shared-target-split') throw new Error('Expected split')
    expect(transition.before.sources.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(transition.after.relationships.map(({ from }) => from)).toEqual(['b', 'a'])
  })

  it('discovers the opposite stable source without relying on source IDs', () => {
    const model = changeAfter(splitTransitionModel(), (after) => after
      .replace('from: b, to: counter-new', 'from: b, to: counter')
      .replace('from: a, to: counter }', 'from: a, to: counter-new }'))
    const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(model))).segments)
      .variants[0].states
    if (states.length !== 2) throw new Error('Expected transition')
    expect(classifyRuntimeTransition(states[0], states[1])).toMatchObject({
      kind: 'shared-target-split',
      stableSource: { id: 'b' },
      changedSource: { id: 'a' },
    })
  })

  it('parses split-transition authoring equivalently with LF and CRLF', () => {
    const lf = writing(bodyWithModel(splitTransitionModel()))
    expect(parseWritingSource({ ...lf, source: lf.source.replace(/\n/g, '\r\n') }))
      .toEqual(parseWritingSource(lf))
  })

  it('classifies exactly two independent direct-value variables in declaration order', () => {
    const state = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      directValuesModel(),
    ))).segments).variants[0].states[0]
    expect(classifyRuntimeTopology(state)).toMatchObject({
      kind: 'direct-values',
      sources: [{ id: 'a' }, { id: 'b' }],
    })
  })

  it.each([
    ['one direct value', directValueTransitionModel(), 'direct-value-change'],
    ['two direct values', directValuesTransitionModel(), 'direct-values-change'],
    ['single scalar name', singleScalarRebindingModel(), 'single-scalar-rebinding'],
    ['shared scalar names', scalarSplitModel(), 'shared-target-split'],
  ])('classifies %s transition semantics', (_label, model, kind) => {
    const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(model))).segments)
      .variants[0].states
    if (states.length !== 2) throw new Error('Expected transition')
    expect(classifyRuntimeTransition(states[0], states[1])).toMatchObject({ kind })
  })

  it('derives changed direct-value sources by ID and preserves before display order', () => {
    const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      directValuesTransitionModel(),
    ))).segments).variants[0].states
    if (states.length !== 2) throw new Error('Expected transition')
    const transition = classifyRuntimeTransition(states[0], states[1])
    expect(transition).toMatchObject({
      kind: 'direct-values-change',
      before: { sources: [{ id: 'a' }, { id: 'b' }] },
      changedValues: [{ id: 'b', beforeValue: '10', afterValue: '20' }],
    })
  })

  it('normalizes reversed scalar transition states and line endings', () => {
    const model = scalarSplitModel()
    const afterIndex = model.indexOf('  - id: after')
    const reversed = `states:\n${model.slice(afterIndex)}\n${model.slice('states:\n'.length, afterIndex)}`
    const lf = writing(bodyWithModel(reversed))
    const parsed = parseWritingSource(lf)
    expect(runtimeSegment(parsed.segments).variants[0].states.map(({ id }) => id))
      .toEqual(['before', 'after'])
    expect(parseWritingSource({ ...lf, source: lf.source.replace(/\n/g, '\r\n') }))
      .toEqual(parsed)
  })

  it('normalizes reversed state order and ignores entity/relationship order', () => {
    const model = transitionModel('variable', 'reference')
    const afterIndex = model.indexOf('  - id: after')
    const before = model.slice('states:\n'.length, afterIndex)
    const after = model.slice(afterIndex)
      .replace('from: a', 'from: temporary')
      .replace('from: b', 'from: a')
      .replace('from: temporary', 'from: b')
    const states = runtimeSegment(parseWritingSource(writing(bodyWithModel(
      `states:\n${after}\n${before}`,
    ))).segments).variants[0].states
    expect(states.map(({ id }) => id)).toEqual(['before', 'after'])
  })

  it('parses transition authoring equivalently with LF and CRLF', () => {
    const lf = writing(bodyWithModel(transitionModel()))
    expect(parseWritingSource({ ...lf, source: lf.source.replace(/\n/g, '\r\n') }))
      .toEqual(parseWritingSource(lf))
  })

  it('parses runtime-model equivalently with LF and CRLF line endings', () => {
    const lf = writing(validRuntimeModelBody())
    const crlf = { ...lf, source: lf.source.replace(/\n/g, '\r\n') }
    expect(parseWritingSource(crlf)).toEqual(parseWritingSource(lf))
  })

  it.each([
    ['without readerLanguages', validRuntimeModelBody(), /requires frontmatter readerLanguages/, publishedMetadata],
    [
      'with a missing language',
      runtimeModelBody([
        languageVariant('csharp', directModel),
        languageVariant('java', directModel),
      ]),
      /missing declared language "python"/,
    ],
    [
      'with a duplicate language',
      runtimeModelBody([
        languageVariant('csharp', directModel),
        languageVariant('csharp', directModel),
        languageVariant('python', bindingModel),
      ]),
      /repeats language "csharp"/,
    ],
    [
      'with an undeclared language',
      runtimeModelBody([
        languageVariant('csharp', directModel),
        languageVariant('java', directModel),
        languageVariant('python', bindingModel),
      ]),
      /undeclared reader language "java"/,
      `${publishedMetadata}\nreaderLanguages:\n  - csharp\n  - python\ndefaultReaderLanguage: csharp`,
    ],
    [
      'with an unknown language',
      runtimeModelBody([
        languageVariant('csharp', directModel),
        languageVariant('java', directModel),
        languageVariant('ruby', directModel),
      ]),
      /unknown reader language "ruby"/,
    ],
    [
      'with a wrong code language',
      runtimeModelBody([
        languageVariant('csharp', directModel, { codeLanguage: 'java' }),
        languageVariant('java', directModel),
        languageVariant('python', bindingModel),
      ]),
      /does not match variant "csharp"/,
    ],
  ])('rejects language structure %s', (_label, body, expected, metadata = readerMetadata) => {
    expect(() => parseWritingSource(writing(body, metadata))).toThrow(expected)
  })

  it('rejects missing and duplicate code/model fences', () => {
    const modelOnly = `:::language csharp\n\n\`\`\`model\n${directModel}\n\`\`\`\n\n:::`
    const codeOnly = ':::language csharp\n\n```csharp\nint count = 10;\n```\n\n:::'
    const duplicateCode = languageVariant('csharp', directModel, {
      extra: '\n```csharp\nint other = 20;\n```\n',
    })
    const duplicateModel = languageVariant('csharp', directModel, {
      extra: `\n\`\`\`model\n${directModel}\n\`\`\`\n`,
    })
    const companions = [languageVariant('java', directModel), languageVariant('python', bindingModel)]
    expect(() => parseWritingSource(writing(runtimeModelBody([modelOnly, ...companions]))))
      .toThrow(/requires exactly one code fence/)
    expect(() => parseWritingSource(writing(runtimeModelBody([codeOnly, ...companions]))))
      .toThrow(/requires exactly one model fence/)
    expect(() => parseWritingSource(writing(runtimeModelBody([duplicateCode, ...companions]))))
      .toThrow(/repeats its code fence/)
    expect(() => parseWritingSource(writing(runtimeModelBody([duplicateModel, ...companions]))))
      .toThrow(/repeats its model fence/)
  })

  it.each([
    ['malformed YAML', 'states: [', /invalid runtime-model YAML/],
    ['root not mapping', '- states', /model root must be a mapping/],
    ['missing states', '{}', /model root requires states/],
    ['two current states', `${directModel}\n${directModel.replace('states:\n', '')}`, /exactly one "before" and one "after"/],
    ['state id not current', directModel.replace('id: current', 'id: later'), /state id must be "current"/],
    ['empty state label', directModel.replace('label: Current', 'label: ""'), /state.label must be a non-empty string/],
    ['duplicate entity id', directModel.replace('    relationships: []', '      - id: count\n        kind: variable\n        label: other\n        directValue:\n          type: int\n          value: "20"\n    relationships: []'), /repeats entity id "count"/],
    ['unknown entity kind', directModel.replace('kind: variable', 'kind: pointer'), /kind is unsupported/],
    ['variable without label', directModel.replace('        label: count\n', ''), /entities\[0\].label must be a non-empty string/],
    ['name with directValue', bindingModel.replace('        label: count', '        label: count\n        directValue:\n          type: int\n          value: "10"'), /name entities must not contain directValue/],
    ['object without typeLabel', bindingModel.replace('        typeLabel: int\n', ''), /typeLabel must be a non-empty string/],
    ['duplicate object member', objectModel('variable', 'reference', 'field', 'value').replace('    relationships:', '          - name: value\n            kind: field\n            value: "20"\n    relationships:'), /repeats member "value"/],
    ['missing relationship endpoint', bindingModel.replace('to: int-10', 'to: missing'), /target "missing" does not exist/],
    ['reference from wrong source kind', bindingModel.replace('kind: binding', 'kind: reference'), /reference relationships must originate from a variable/],
    ['binding from wrong source kind', objectModel('variable', 'binding', 'field', 'value'), /binding relationships must originate from a name/],
    ['relationship target not object', `states:\n  - id: current\n    label: Current\n    entities:\n      - id: a\n        kind: variable\n        label: a\n      - id: b\n        kind: variable\n        label: b\n    relationships:\n      - kind: reference\n        from: a\n        to: b`, /must target an object/],
    ['duplicate relationship', `${objectModel('variable', 'reference', 'field', 'value')}\n      - kind: reference\n        from: a\n        to: counter`, /duplicate relationship/],
    ['direct value plus reference', objectModel('variable', 'reference', 'field', 'value').replace('        label: a', '        label: a\n        directValue:\n          type: int\n          value: "10"'), /direct-value variable cannot also reference/],
    ['old fields property', objectModel('variable', 'reference', 'field', 'value').replace('members:', 'fields:'), /unsupported property "fields"/],
    ['scalar and members together', bindingModel.replace('        scalarValue: "10"', '        scalarValue: "10"\n        members:\n          - name: value\n            kind: field\n            value: "10"'), /cannot contain both scalarValue and members/],
    ['empty members', objectModel('variable', 'reference', 'field', 'value').replace('members:\n          - name: value\n            kind: field\n            value: "10"', 'members: []'), /members must not be empty/],
    ['object without scalar or members', bindingModel.replace('        scalarValue: "10"\n', ''), /requires scalarValue or members/],
    ['layout coordinates', directModel.replace('        label: count', '        label: count\n        x: 10'), /unsupported property "x"/],
    ['missing relationships array', directModel.replace('    relationships: []', ''), /state requires relationships/],
  ])('rejects invalid model semantics: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })

  const secondObject = `      - id: other
        kind: object
        typeLabel: Counter
        scalarValue: "20"
`
  const extraSource = `      - id: c
        kind: variable
        label: c
`
  const referenceShared = sharedObjectModel('variable', 'reference')
  const bindingShared = sharedObjectModel('name', 'binding')

  it.each([
    [
      'variables target different objects',
      referenceShared
        .replace('    relationships:', `${secondObject}    relationships:`)
        .replace('        from: b\n        to: counter', '        from: b\n        to: other'),
      /must target the same object/,
    ],
    [
      'names target different objects',
      bindingShared
        .replace('    relationships:', `${secondObject}    relationships:`)
        .replace('        from: b\n        to: counter', '        from: b\n        to: other'),
      /must target the same object/,
    ],
    [
      'mixed variable and name sources',
      referenceShared.replace('      - id: b\n        kind: variable', '      - id: b\n        kind: name'),
      /sources must use the same semantic kind/,
    ],
    [
      'mixed reference and binding relationships',
      referenceShared.replace(
        '      - kind: reference\n        from: b',
        '      - kind: binding\n        from: b',
      ),
      /relationships must use the same semantic kind/,
    ],
    [
      'one source targets two objects',
      referenceShared
        .replace('    relationships:', `${secondObject}    relationships:`)
        .replace('        from: b\n        to: counter', '        from: a\n        to: other'),
      /must target the same object/,
    ],
    [
      'duplicate relationship',
      referenceShared.replace('        from: b', '        from: a'),
      /duplicate relationship/,
    ],
    [
      'duplicate source IDs',
      referenceShared.replace('      - id: b', '      - id: a'),
      /repeats entity id "a"/,
    ],
    [
      'extra unrelated source',
      referenceShared.replace('      - id: counter', `${extraSource}      - id: counter`),
      /require exactly two sources and one object/,
    ],
    [
      'extra unrelated object',
      referenceShared.replace('    relationships:', `${secondObject}    relationships:`),
      /require exactly two sources and one object/,
    ],
    [
      'three sources',
      referenceShared
        .replace('      - id: counter', `${extraSource}      - id: counter`)
        .concat('\n      - kind: reference\n        from: c\n        to: counter'),
      /require exactly two relationships/,
    ],
    [
      'direct-value source plus shared target',
      referenceShared.replace(
        '        label: a',
        '        label: a\n        directValue:\n          type: int\n          value: "10"',
      ),
      /direct-value variable cannot also reference/,
    ],
    [
      'relationship target is another source',
      referenceShared.replace('        to: counter', '        to: b'),
      /must target an object/,
    ],
    [
      'object used as relationship source',
      referenceShared.replace('        from: a', '        from: counter'),
      /must originate from a variable or name/,
    ],
    [
      'shared target has only one relationship',
      referenceShared.replace(
        '\n      - kind: reference\n        from: b\n        to: counter',
        '',
      ),
      /single-target models require exactly one source and one object/,
    ],
    [
      'two relationships repeat the same source and target',
      referenceShared.replace('        from: b', '        from: a'),
      /duplicate relationship/,
    ],
    [
      'a declared source is disconnected',
      referenceShared.replace(
        '\n      - kind: reference\n        from: b\n        to: counter',
        '',
      ),
      /single-target models require exactly one source and one object/,
    ],
  ])('rejects unsupported shared-target topology: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })

  it.each([
    ['zero states', 'states: []', /either one current state or exactly before and after/],
    ['before only', directModel.replace('id: current', 'id: before'), /single-state.*current/],
    ['after only', directModel.replace('id: current', 'id: after'), /single-state.*current/],
    ['current and before', `${directModel}\n${directModel.replace('states:\n', '').replace('id: current', 'id: before')}`, /exactly one "before" and one "after"/],
    ['duplicate before', transitionModel().replace('id: after', 'id: before'), /exactly one "before" and one "after"/],
    ['duplicate after', transitionModel().replace('id: before', 'id: after'), /exactly one "before" and one "after"/],
    ['unknown state', directModel.replace('id: current', 'id: later'), /state id must be/],
    ['three states', `${transitionModel()}\n${directModel.replace('states:\n', '')}`, /either one current state or exactly before and after/],
  ])('rejects invalid state sequences: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })

  it.each([
    ['direct-value transition', twoStates(directModel), /must change the value/],
    ['single-target transition', twoStates(objectModel('variable', 'reference', 'field', 'value')), /require shared-target topology/],
    ['scalar transition', twoStates(sharedObjectModel('variable', 'reference', 'scalarValue: "10"')), /requires object members/],
    ['no changed value', transitionModel('variable', 'reference', '10', '10'), /must change at least one/],
    ['entity id changes', changeAfter(transitionModel(), (after) => after.replace('      - id: a\n', '      - id: renamed\n')), /source "a" does not exist/],
    ['source kind changes', changeAfter(transitionModel(), (after) => after.replaceAll('kind: variable', 'kind: name').replaceAll('kind: reference', 'kind: binding')), /must retain its kind/],
    ['source label changes', changeAfter(transitionModel(), (after) => after.replace('label: a', 'label: changed')), /retain its label/],
    ['target id changes', changeAfter(transitionModel(), (after) => after.replaceAll('counter', 'counter-2')), /same target object id/],
    ['target type changes', changeAfter(transitionModel(), (after) => after.replace('typeLabel: Counter', 'typeLabel: Other')), /retain the target object typeLabel/],
    ['relationship changes', changeAfter(transitionModel(), (after) => after.replace('from: a', 'from: b')), /duplicate relationship|same relationship set/],
    ['member added', changeAfter(transitionModel(), (after) => after.replace('    relationships:', '          - name: extra\n            kind: field\n            value: "1"\n    relationships:')), /same member names/],
    ['member removed', changeAfter(transitionModel(), (after) => after.replace('          - name: value\n            kind: field\n            value: "20"\n', '')), /members must be an array/],
    ['member renamed', changeAfter(transitionModel(), (after) => after.replace('name: value', 'name: renamed')), /same member names/],
    ['member kind changes', changeAfter(transitionModel(), (after) => after.replace('kind: field', 'kind: property')), /retain its kind/],
  ])('rejects invalid runtime transitions: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })

  it('does not accept split-target as a standalone current topology', () => {
    const after = splitTransitionModel().slice(splitTransitionModel().indexOf('  - id: after'))
      .replace('  - id: after', '  - id: current')
    expect(() => parseWritingSource(writing(bodyWithModel(`states:\n${after}`))))
      .toThrow(/shared-target relationships must target the same object/)
  })

  it.each([
    ['before is not shared', splitTransitionModel().replace('to: counter }\n      - { kind: reference, from: b, to: counter }', 'to: counter-new }\n      - { kind: reference, from: b, to: counter }'), /target "counter-new" does not exist|same object/],
    ['after has one object', changeAfter(splitTransitionModel(), (after) => after.replace(/      - id: counter-new[\s\S]*?          - \{ name: value, kind: field, value: "20" \}\n/, '').replace('to: counter-new', 'to: counter')), /change at least one|same relationship set/],
    ['after has three objects', changeAfter(splitTransitionModel(), (after) => after.replace('      - { id: a, kind: variable, label: a }', '      - { id: a, kind: variable, label: a }\n      - { id: counter-extra, kind: object, typeLabel: Counter, members: [{ name: value, kind: field, value: "30" }] }')), /unsupported runtime topology|shared-target/],
    ['after has one source', changeAfter(splitTransitionModel(), (after) => after.replace('      - { id: a, kind: variable, label: a }\n', '').replace('      - { kind: reference, from: a, to: counter }\n', '')), /exactly two sources|source "a" does not exist/],
    ['after has three sources', changeAfter(splitTransitionModel(), (after) => after.replace('      - { id: a, kind: variable, label: a }', '      - { id: a, kind: variable, label: a }\n      - { id: c, kind: variable, label: c }')), /unsupported runtime topology|shared-target/],
    ['after has an extra relationship', changeAfter(splitTransitionModel(), (after) => `${after}\n      - { kind: reference, from: a, to: counter-new }`), /exactly two relationships/],
    ['both still target old', changeAfter(splitTransitionModel(), (after) => after.replace('to: counter-new', 'to: counter')), /target different objects/],
    ['both target new', changeAfter(splitTransitionModel(), (after) => after.replace('from: a, to: counter', 'from: a, to: counter-new')), /target different objects/],
    ['changed source has two relationships', changeAfter(splitTransitionModel(), (after) => `${after}\n      - { kind: reference, from: b, to: counter }`), /exactly two relationships/],
    ['relationship kind changes', changeAfter(splitTransitionModel(), (after) => after.replace('kind: reference, from: b', 'kind: binding, from: b')), /binding relationships must originate from a name/],
    ['source kind changes', changeAfter(splitTransitionModel(), (after) => after.replace('id: b, kind: variable', 'id: b, kind: name').replace('kind: reference, from: b', 'kind: binding, from: b')), /same semantic kind|retain its kind/],
    ['source label changes', changeAfter(splitTransitionModel(), (after) => after.replace('id: b, kind: variable, label: b', 'id: b, kind: variable, label: changed')), /retain its label/],
    ['original target disappears', changeAfter(splitTransitionModel(), (after) => after.replaceAll('counter }', 'counter-other }').replace('id: counter\n', 'id: counter-other\n')), /retain the original target object id/],
    ['original type changes', changeAfter(splitTransitionModel(), (after) => after.replace('id: counter\n        kind: object\n        typeLabel: Counter', 'id: counter\n        kind: object\n        typeLabel: Other')), /original target object typeLabel/],
    ['original member mutates', changeAfter(splitTransitionModel(), (after) => after.replace('name: value, kind: field, value: "10"', 'name: value, kind: field, value: "11"')), /must not mutate the original target/],
    ['original member schema changes', changeAfter(splitTransitionModel(), (after) => after.replace('name: value, kind: field, value: "10"', 'name: renamed, kind: field, value: "10"')), /same member names/],
    ['new target reuses original id', changeAfter(splitTransitionModel(), (after) => after.replace('id: counter-new', 'id: counter')), /repeats entity id "counter"/],
    ['new target wrong type', changeAfter(splitTransitionModel(), (after) => after.replace('id: counter-new\n        kind: object\n        typeLabel: Counter', 'id: counter-new\n        kind: object\n        typeLabel: Other')), /new target.*typeLabel/],
    ['mixed mutation and reassignment', changeAfter(splitTransitionModel(), (after) => after.replace('name: value, kind: field, value: "10"', 'name: value, kind: field, value: "11"')), /must not mutate/],
    ['extra disconnected entity', changeAfter(splitTransitionModel(), (after) => after.replace('      - { id: a, kind: variable, label: a }', '      - { id: a, kind: variable, label: a }\n      - { id: unused, kind: object, typeLabel: Counter, members: [{ name: value, kind: field, value: "0" }] }')), /unsupported runtime topology|shared-target/],
    ['source targets non-object', changeAfter(splitTransitionModel(), (after) => after.replace('from: b, to: counter-new', 'from: b, to: a')), /must target an object/],
    ['object used as source', changeAfter(splitTransitionModel(), (after) => after.replace('from: b, to: counter-new', 'from: counter, to: counter-new')), /must originate from a variable or name/],
  ])('rejects invalid shared-target splits: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })

  it.each([
    ['three direct values', directValuesModel().replace('    relationships: []', '      - { id: c, kind: variable, label: c, directValue: { type: int, value: "10" } }\n    relationships: []'), /one or exactly two direct-value variables/],
    ['mixed direct value and name', directValuesModel().replace('id: b, kind: variable, label: b, directValue: { type: int, value: "10" }', 'id: b, kind: name, label: b'), /one or exactly two direct-value variables/],
    ['direct value with relationship', directValuesModel().replace('    relationships: []', '      - { id: value, kind: object, typeLabel: int, scalarValue: "10" }\n    relationships:\n      - { kind: reference, from: a, to: value }'), /direct-value variable cannot also reference/],
    ['direct variable id changes', changeAfter(directValueTransitionModel(), (after) => after.replace('id: count', 'id: other')), /same variable id/],
    ['direct variable label changes', changeAfter(directValueTransitionModel(), (after) => after.replace('label: count', 'label: other')), /retain the variable label/],
    ['direct variable type changes', changeAfter(directValueTransitionModel(), (after) => after.replace('type: int', 'type: long')), /retain the directValue type/],
    ['direct variable does not change', directValueTransitionModel('10'), /must change the value/],
    ['two-value id set changes', changeAfter(directValuesTransitionModel(), (after) => after.replace('id: b', 'id: c')), /same variable id set/],
    ['two-value label changes', changeAfter(directValuesTransitionModel(), (after) => after.replace('label: b', 'label: changed')), /retain its label/],
    ['two-value type changes', changeAfter(directValuesTransitionModel(), (after) => after.replace('type: int', 'type: long')), /retain its type/],
    ['two values do not change', directValuesTransitionModel('10'), /change at least one value/],
    ['scalar source id changes', changeAfter(singleScalarRebindingModel(), (after) => after.replace('id: count', 'id: other').replace('from: count', 'from: other')), /retain the source id/],
    ['scalar source label changes', changeAfter(singleScalarRebindingModel(), (after) => after.replace('label: count', 'label: other')), /retain the source label/],
    ['scalar uses variable reference', singleScalarRebindingModel().replaceAll('kind: name', 'kind: variable').replaceAll('kind: binding', 'kind: reference'), /name\/binding scalar rebinding/],
    ['scalar target type changes', changeAfter(singleScalarRebindingModel(), (after) => after.replace('typeLabel: int', 'typeLabel: long')), /retain the target typeLabel/],
    ['scalar target id unchanged', changeAfter(singleScalarRebindingModel(), (after) => after.replaceAll('int-20', 'int-10')), /new target object id/],
    ['scalar value unchanged', singleScalarRebindingModel('10'), /change the scalar value/],
    ['scalar becomes member-backed', changeAfter(singleScalarRebindingModel(), (after) => after.replace('scalarValue: "20"', 'members: [{ name: value, kind: field, value: "20" }]')), /requires scalarValue targets/],
    ['scalar split original value changes', changeAfter(scalarSplitModel(), (after) => after.replace('scalarValue: "10"', 'scalarValue: "11"')), /must not change the original scalar value/],
    ['scalar split original id disappears', changeAfter(scalarSplitModel(), (after) => after.replaceAll('int-10', 'int-11')), /retain the original target object id/],
    ['scalar split new type changes', changeAfter(scalarSplitModel(), (after) => after.replace('id: int-20, kind: object, typeLabel: int', 'id: int-20, kind: object, typeLabel: long')), /new target.*typeLabel/],
    ['scalar split both stay original', changeAfter(scalarSplitModel(), (after) => after.replace('from: b, to: int-20', 'from: b, to: int-10')), /target different objects/],
    ['scalar split mixed relationship', changeAfter(scalarSplitModel(), (after) => after.replace('kind: binding, from: b', 'kind: reference, from: b')), /reference relationships must originate from a variable/],
  ])('rejects invalid scalar semantics: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })
})
