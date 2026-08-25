import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const EXPECTED_HEAD = '080d35781398e56313f898d8530ff889066107a3'
const EXPECTED_BRANCH = 'feature/language-aware-writings'

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trimEnd()
}

function fromHead(path) {
  return git('show', `HEAD:${path}`).replace(/\r\n?/g, '\n')
}

function replaceOnce(source, oldText, newText, label) {
  const first = source.indexOf(oldText)
  if (first < 0) throw new Error(`Could not find expected Stage H text: ${label}`)
  if (source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`Expected Stage H text occurs more than once: ${label}`)
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length)
}

const head = git('rev-parse', 'HEAD').trim()
const branch = git('branch', '--show-current').trim()

if (head !== EXPECTED_HEAD) {
  throw new Error(`Expected HEAD ${EXPECTED_HEAD}, found ${head}. No files were changed.`)
}
if (branch !== EXPECTED_BRANCH) {
  throw new Error(`Expected branch ${EXPECTED_BRANCH}, found ${branch}. No files were changed.`)
}

const files = new Map()

// Build every modified file entirely from HEAD first.
// Nothing is written until ALL transformations succeed.

{
  const path = 'src/content/writings/directives.ts'
  let s = fromHead(path)

  s = replaceOnce(
    s,
`export type KnownDirectiveName =
  | 'code-tabs'
  | 'language-content'
  | 'runtime-model'
  | 'language'
`,
`export type KnownDirectiveName =
  | 'code-tabs'
  | 'language-content'
  | 'runtime-model'
  | 'language-only'
  | 'language'
`,
    `${path}: KnownDirectiveName`,
  )

  s = replaceOnce(
    s,
`export function scanWritingDirectives(
`,
`function scanLanguageOnly(
  lines: string[],
  openIndex: number,
  start: DirectiveStart,
  failure: DirectiveFailure,
): { node: DirectiveNode; nextIndex: number } {
  let index = openIndex + 1
  const bodyStart = index

  while (index < lines.length) {
    if (isDirectiveClose(lines[index], 4)) {
      return {
        node: {
          name: 'language-only',
          markerLength: 4,
          argument: start.argument,
          startLine: openIndex + 1,
          body: lines.slice(bodyStart, index).join('\\n'),
          children: [],
        },
        nextIndex: index + 1,
      }
    }

    if (fenceStart(lines[index])) {
      index = skipFence(lines, index, failure)
      continue
    }

    const nestedStart = directiveStart(lines[index])
    if (
      nestedStart &&
      (
        nestedStart.name === 'code-tabs' ||
        nestedStart.name === 'language-content' ||
        nestedStart.name === 'runtime-model' ||
        nestedStart.name === 'language-only' ||
        nestedStart.name === 'language'
      )
    ) {
      failure(
        index + 1,
        'nested framework directives are not allowed in language-only blocks',
      )
    }

    index += 1
  }

  failure(openIndex + 1, 'language-only block is missing its closing ::::')
}

export function scanWritingDirectives(
`,
    `${path}: insert scanLanguageOnly`,
  )

  s = replaceOnce(
    s,
`    const isRuntimeModel =
      start?.markerLength === 4 && start.name === 'runtime-model' && !start.argument
    if (!isCodeTabs && !isLanguageContent && !isRuntimeModel) {
`,
`    const isRuntimeModel =
      start?.markerLength === 4 && start.name === 'runtime-model' && !start.argument
    const isLanguageOnly =
      start?.markerLength === 4 && start.name === 'language-only'
    if (!isCodeTabs && !isLanguageContent && !isRuntimeModel && !isLanguageOnly) {
`,
    `${path}: recognize language-only`,
  )

  s = replaceOnce(
    s,
`    const scanned = isCodeTabs
      ? scanCodeTabs(lines, index, failure)
      : scanLanguageContainer(
`,
`    const scanned = isCodeTabs
      ? scanCodeTabs(lines, index, failure)
      : isLanguageOnly
        ? scanLanguageOnly(lines, index, start!, failure)
        : scanLanguageContainer(
`,
    `${path}: dispatch language-only`,
  )

  files.set(path, s)
}

{
  const path = 'src/content/writings/types.ts'
  let s = fromHead(path)

  s = replaceOnce(
    s,
`export interface WritingHeading {
  depth: 2 | 3
  id: string
  text: string
}
`,
`export interface WritingHeading {
  depth: 2 | 3
  id: string
  text: string
  languages?: ReaderLanguage[]
}
`,
    `${path}: WritingHeading`,
  )

  s = replaceOnce(
    s,
`export interface RuntimeModelSegment {
  type: 'runtime-model'
  variants: LanguageVariant<RuntimeModelVariant>[]
}

export type WritingSegment =
`,
`export interface RuntimeModelSegment {
  type: 'runtime-model'
  variants: LanguageVariant<RuntimeModelVariant>[]
}

export interface LanguageOnlySegment {
  type: 'language-only'
  languages: ReaderLanguage[]
  source: string
}

export type WritingSegment =
`,
    `${path}: LanguageOnlySegment`,
  )

  s = replaceOnce(
    s,
`  | { type: 'language-content'; variants: LanguageContentVariant[] }
  | RuntimeModelSegment
`,
`  | { type: 'language-content'; variants: LanguageContentVariant[] }
  | LanguageOnlySegment
  | RuntimeModelSegment
`,
    `${path}: WritingSegment union`,
  )

  files.set(path, s)
}

{
  const path = 'src/content/writings/schema.ts'
  let s = fromHead(path)

  s = replaceOnce(
    s,
`function parseRuntimeModelVariant(
`,
`function parseLanguageOnly(
  node: DirectiveNode,
  sourcePath: string,
  declaredLanguages: ReaderLanguage[] | undefined,
): WritingSegment {
  if (!declaredLanguages) {
    fail(
      sourcePath,
      \`line \${node.startLine}: language-only requires frontmatter readerLanguages\`,
    )
  }

  const argumentsList = node.argument?.trim().split(/\\s+/).filter(Boolean) ?? []
  if (argumentsList.length === 0) {
    fail(
      sourcePath,
      \`line \${node.startLine}: language-only requires at least one language argument\`,
    )
  }

  const declared = new Set(declaredLanguages)
  const seen = new Set<ReaderLanguage>()
  const languages: ReaderLanguage[] = []

  for (const argument of argumentsList) {
    if (!isReaderLanguage(argument)) {
      fail(sourcePath, \`line \${node.startLine}: unknown reader language "\${argument}"\`)
    }
    if (!declared.has(argument)) {
      fail(sourcePath, \`line \${node.startLine}: undeclared reader language "\${argument}"\`)
    }
    if (seen.has(argument)) {
      fail(sourcePath, \`line \${node.startLine}: language-only repeats language "\${argument}"\`)
    }
    seen.add(argument)
    languages.push(argument)
  }

  const source = node.body.trim()
  if (!source) {
    fail(sourcePath, \`line \${node.startLine}: language-only block cannot be empty\`)
  }

  return {
    type: 'language-only',
    languages,
    source,
  }
}

function parseRuntimeModelVariant(
`,
    `${path}: parseLanguageOnly`,
  )

  s = replaceOnce(
    s,
`    if (part.node.name === 'language-content') {
      return parseLanguageContent(part.node, sourcePath, readerLanguages)
    }
    return parseRuntimeModel(part.node, sourcePath, readerLanguages)
`,
`    if (part.node.name === 'language-content') {
      return parseLanguageContent(part.node, sourcePath, readerLanguages)
    }
    if (part.node.name === 'language-only') {
      return parseLanguageOnly(part.node, sourcePath, readerLanguages)
    }
    return parseRuntimeModel(part.node, sourcePath, readerLanguages)
`,
    `${path}: parseWritingSegments`,
  )

  s = replaceOnce(
    s,
`    for (const segment of segments) {
      if (segment.type !== 'markdown') continue
      for (const token of marked.lexer(segment.source, { gfm: true })) {
        if (token.type !== 'heading' || (token.depth !== 2 && token.depth !== 3)) continue
        const text = tokenText(token).trim()
        headings.push({ depth: token.depth, text, id: slugger.slug(text) })
      }
    }
`,
`    for (const segment of segments) {
      if (segment.type !== 'markdown' && segment.type !== 'language-only') continue
      for (const token of marked.lexer(segment.source, { gfm: true })) {
        if (token.type !== 'heading' || (token.depth !== 2 && token.depth !== 3)) continue
        const text = tokenText(token).trim()
        headings.push({
          depth: token.depth,
          text,
          id: slugger.slug(text),
          ...(segment.type === 'language-only' ? { languages: segment.languages } : {}),
        })
      }
    }
`,
    `${path}: extractHeadings`,
  )

  files.set(path, s)
}

{
  const path = 'src/components/writings/MarkdownWriting.tsx'
  let s = fromHead(path)

  s = replaceOnce(
    s,
`import GithubSlugger from 'github-slugger'
import type { WritingSegment } from '../../content/writings/types'
`,
`import GithubSlugger from 'github-slugger'
import { codeLanguageLabel } from '../../content/writings/languages'
import type { WritingSegment } from '../../content/writings/types'
`,
    `${path}: language label import`,
  )

  s = replaceOnce(
    s,
`import { RuntimeModel } from './RuntimeModel'
import styles from './Writings.module.css'
`,
`import { RuntimeModel } from './RuntimeModel'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './Writings.module.css'
`,
    `${path}: language preference import`,
  )

  s = replaceOnce(
    s,
`export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
`,
`export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
  const { readingState } = useLanguagePreference()
`,
    `${path}: reading state`,
  )

  s = replaceOnce(
    s,
`      segment.type === 'code-tabs' ||
      segment.type === 'language-content' ||
      segment.type === 'runtime-model',
`,
`      segment.type === 'code-tabs' ||
      segment.type === 'language-content' ||
      segment.type === 'language-only' ||
      segment.type === 'runtime-model',
`,
    `${path}: first language-aware segment`,
  )

  s = replaceOnce(
    s,
`          ) : segment.type === 'runtime-model' ? (
            <RuntimeModel variants={segment.variants} />
`,
`          ) : segment.type === 'language-only' ? (
            (() => {
              if (!readingState) {
                throw new Error('language-only requires an article reader configuration')
              }

              const visible =
                readingState.mode === 'compare' ||
                segment.languages.includes(readingState.language)

              const content = (
                <MarkdownBlocks
                  source={segment.source}
                  keyPrefix={\`language-only-\${index}\`}
                  slugger={slugger}
                />
              )

              if (!visible) return <div hidden>{content}</div>
              if (readingState.mode === 'single') return content

              return (
                <section
                  className={styles.languageComparison}
                  aria-label="Language-specific section"
                >
                  <div className={styles.languageComparisonItem}>
                    <p className={styles.languageComparisonLabel}>
                      {segment.languages.map(codeLanguageLabel).join(' / ')}
                    </p>
                    {content}
                  </div>
                </section>
              )
            })()
          ) : segment.type === 'runtime-model' ? (
            <RuntimeModel variants={segment.variants} />
`,
    `${path}: render language-only`,
  )

  files.set(path, s)
}

files.set(
  'src/components/writings/visibleWritingHeadings.ts',
`import type {
  ReadingState,
  WritingHeading,
} from '../../content/writings/types'

export function visibleWritingHeadings(
  headings: WritingHeading[],
  readingState: ReadingState | undefined,
): WritingHeading[] {
  if (!readingState || readingState.mode === 'compare') return headings

  return headings.filter(
    (heading) =>
      !heading.languages ||
      heading.languages.includes(readingState.language),
  )
}
`,
)

{
  const path = 'src/components/writings/WritingPage.tsx'
  let s = fromHead(path)

  s = replaceOnce(
    s,
`import { useActiveHeading, useMobileContentsVisibility } from './useWritingNavigation'
import styles from './Writings.module.css'
`,
`import { useActiveHeading, useMobileContentsVisibility } from './useWritingNavigation'
import { useLanguagePreference } from './useLanguagePreference'
import { visibleWritingHeadings } from './visibleWritingHeadings'
import styles from './Writings.module.css'
`,
    `${path}: imports`,
  )

  s = replaceOnce(
    s,
`function WritingView({ writing }: { writing: WritingRecord }) {
  const showToc = writing.headings.length >= 3
  const tocRef = useRef<HTMLElement>(null)
  const { activeHeading, activateHeading } = useActiveHeading(
    writing.headings.map(({ id }) => id),
  )
`,
`function WritingView({ writing }: { writing: WritingRecord }) {
  const { readingState } = useLanguagePreference()
  const headings = visibleWritingHeadings(writing.headings, readingState)
  const showToc = headings.length >= 3
  const tocRef = useRef<HTMLElement>(null)
  const { activeHeading, activateHeading } = useActiveHeading(
    headings.map(({ id }) => id),
  )
`,
    `${path}: WritingView state`,
  )

  s = replaceOnce(
    s,
`{writing.headings.map((heading) => (`,
`{headings.map((heading) => (`,
    `${path}: TOC heading source`,
  )

  s = replaceOnce(
    s,
`        <article className={styles.articleMain}>
          <LanguagePreferenceProvider
            key={writing.slug}
            readerLanguages={writing.readerLanguages}
            defaultReaderLanguage={writing.defaultReaderLanguage}
          >
            <MarkdownWriting segments={writing.segments} />
          </LanguagePreferenceProvider>

`,
`        <article className={styles.articleMain}>
          <MarkdownWriting segments={writing.segments} />

`,
    `${path}: remove inner provider`,
  )

  s = replaceOnce(
    s,
`export default function WritingPage() {
  const { slug = '' } = useParams()
  const writing = writingCatalogue.getBySlug(slug)
  return writing ? <WritingView writing={writing} /> : <WritingNotFound />
`,
`export default function WritingPage() {
  const { slug = '' } = useParams()
  const writing = writingCatalogue.getBySlug(slug)

  return writing ? (
    <LanguagePreferenceProvider
      key={writing.slug}
      readerLanguages={writing.readerLanguages}
      defaultReaderLanguage={writing.defaultReaderLanguage}
    >
      <WritingView writing={writing} />
    </LanguagePreferenceProvider>
  ) : (
    <WritingNotFound />
  )
}
`,
    `${path}: outer provider`,
  )

  files.set(path, s)
}

files.set(
  'src/content/writings/languageOnly.test.ts',
`import { describe, expect, it } from 'vitest'
import { parseWritingSource } from './schema'

function article(body: string) {
  return \`---
title: "Conditional section"
description: "Fixture"
format: article
draft: true
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp
---

\${body}
\`
}

describe('language-only authoring', () => {
  it('parses conditional Markdown and marks its headings', () => {
    const writing = parseWritingSource({
      path: 'src/content/writings/drafts/conditional-section.md',
      source: article(\`
## Shared

Shared prose.

::::language-only python

## Python detail

Python-only prose.

::::

## Ending

Done.
\`),
    })

    expect(writing.segments.map(({ type }) => type)).toEqual([
      'markdown',
      'language-only',
      'markdown',
    ])
    expect(writing.headings).toEqual([
      { depth: 2, id: 'shared', text: 'Shared' },
      {
        depth: 2,
        id: 'python-detail',
        text: 'Python detail',
        languages: ['python'],
      },
      { depth: 2, id: 'ending', text: 'Ending' },
    ])
  })

  it('supports a declared language subset', () => {
    const writing = parseWritingSource({
      path: 'src/content/writings/drafts/conditional-section.md',
      source: article(\`
::::language-only csharp java

## Static-language detail

Visible to C# and Java.

::::
\`),
    })
    const segment = writing.segments[0]
    expect(segment.type).toBe('language-only')
    if (segment.type === 'language-only') {
      expect(segment.languages).toEqual(['csharp', 'java'])
    }
  })

  it.each([
    ['::::language-only\\nText\\n::::', 'requires at least one language argument'],
    ['::::language-only ruby\\nText\\n::::', 'unknown reader language "ruby"'],
    ['::::language-only python python\\nText\\n::::', 'repeats language "python"'],
  ])('rejects invalid language-only authoring', (body, message) => {
    expect(() =>
      parseWritingSource({
        path: 'src/content/writings/drafts/conditional-section.md',
        source: article(body),
      }),
    ).toThrow(message)
  })
})
`,
)

files.set(
  'src/components/writings/visibleWritingHeadings.test.ts',
`import { describe, expect, it } from 'vitest'
import type { WritingHeading } from '../../content/writings/types'
import { visibleWritingHeadings } from './visibleWritingHeadings'

const headings: WritingHeading[] = [
  { depth: 2, id: 'shared', text: 'Shared' },
  { depth: 2, id: 'python', text: 'Python', languages: ['python'] },
  { depth: 2, id: 'static', text: 'Static', languages: ['csharp', 'java'] },
]

describe('visibleWritingHeadings', () => {
  it('filters conditional headings in single-language mode', () => {
    expect(
      visibleWritingHeadings(headings, { mode: 'single', language: 'csharp' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'static'])

    expect(
      visibleWritingHeadings(headings, { mode: 'single', language: 'python' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'python'])
  })

  it('shows all headings in Compare mode', () => {
    expect(
      visibleWritingHeadings(headings, { mode: 'compare', language: 'python' })
        .map(({ id }) => id),
    ).toEqual(['shared', 'python', 'static'])
  })
})
`,
)

{
  const path = 'docs/writings.md'
  let s = fromHead(path)
  s = replaceOnce(
    s,
`## Basic runtime models
`,
`## Language-only sections

Use \`::::language-only\` when a section itself belongs only to a subset of the writing's declared reader languages. Unlike \`language-content\`, which supplies different wording for the same conceptual place in a shared outline, \`language-only\` may contain ordinary Markdown headings and therefore may change the visible outline.

\`\`\`\`markdown
::::language-only python

## Why immutability hides the difference

This section exists only in the Python reading path.

::::
\`\`\`\`

One or more declared reader languages may be listed, for example \`::::language-only csharp java\`.

In single-language mode the entire block, including its headings, is hidden unless the selected reader language is listed. Its headings are also removed from Contents. In Compare mode the block is shown once with a label naming the languages it applies to, and its headings participate in Contents.

\`language-only\` requires \`readerLanguages\`, rejects unknown, undeclared, or repeated language arguments, and cannot be empty. Its body is ordinary Markdown, including headings and fenced code blocks. Framework directives may not be nested inside it.

Use \`language-content\` when the concept belongs to every reading path but the explanation differs. Use \`language-only\` only when the concept or detour genuinely should not exist in the other reading paths.

## Basic runtime models
`,
    `${path}: documentation`,
  )
  files.set(path, s)
}

// All transformations succeeded. Only now write to disk.
for (const [path, content] of files) {
  const slash = path.lastIndexOf('/')
  if (slash >= 0) fs.mkdirSync(path.slice(0, slash), { recursive: true })
  fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8')
}

console.log(`Applied language-only update to ${files.size} files.`)
console.log('The script rebuilt tracked framework files from HEAD, so it also repairs any partial changes left by the previous failed script.')
console.log('Your untracked article draft was not touched.')
console.log('No commit was created.')
