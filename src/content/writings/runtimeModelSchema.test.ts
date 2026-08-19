import { describe, expect, it } from 'vitest'
import { classifyRuntimeTopology } from './runtimeModelTopology'
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
    ['more than one state', `${directModel}\n  - id: current\n    label: Later\n    entities: []\n    relationships: []`, /exactly one state/],
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
})
