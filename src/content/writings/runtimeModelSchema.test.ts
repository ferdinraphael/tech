import { describe, expect, it } from 'vitest'
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
        fields:
          - name: ${memberName}
            kind: ${memberKind}
            value: "10"
    relationships:
      - kind: ${relationshipKind}
        from: a
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

  it('parses one-source object models with fields and properties', () => {
    const body = runtimeModelBody([
      languageVariant('csharp', objectModel('variable', 'reference', 'property', 'Value')),
      languageVariant('java', objectModel('variable', 'reference', 'field', 'value')),
      languageVariant('python', objectModel('name', 'binding', 'field', 'value')),
    ])
    const segment = runtimeSegment(parseWritingSource(writing(body)).segments)
    expect(segment.variants[0].states[0].entities[1]).toEqual(expect.objectContaining({
      kind: 'object',
      fields: [{ name: 'Value', kind: 'property', value: '10' }],
    }))
    expect(segment.variants[1].states[0].entities[1]).toEqual(expect.objectContaining({
      fields: [{ name: 'value', kind: 'field', value: '10' }],
    }))
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
    ['shared target', `states:\n  - id: current\n    label: Current\n    entities:\n      - id: a\n        kind: variable\n        label: a\n      - id: b\n        kind: variable\n        label: b\n      - id: counter\n        kind: object\n        typeLabel: Counter\n        scalarValue: "10"\n    relationships:\n      - kind: reference\n        from: a\n        to: counter\n      - kind: reference\n        from: b\n        to: counter`, /shared-target relationships are unsupported/],
    ['scalar and fields together', bindingModel.replace('        scalarValue: "10"', '        scalarValue: "10"\n        fields:\n          - name: value\n            kind: field\n            value: "10"'), /cannot contain both scalarValue and fields/],
    ['layout coordinates', directModel.replace('        label: count', '        label: count\n        x: 10'), /unsupported property "x"/],
    ['missing relationships array', directModel.replace('    relationships: []', ''), /state requires relationships/],
  ])('rejects invalid model semantics: %s', (_label, model, expected) => {
    expect(() => parseWritingSource(writing(bodyWithModel(model)))).toThrow(expected)
  })
})
