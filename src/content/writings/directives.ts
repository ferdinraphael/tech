export type KnownDirectiveName =
  | 'code-tabs'
  | 'language-content'
  | 'runtime-model'
  | 'language'

export interface DirectiveNode {
  name: KnownDirectiveName
  argument?: string
  markerLength: 3 | 4
  startLine: number
  body: string
  children: DirectiveNode[]
}

export type ScannedWritingPart =
  | { type: 'markdown'; source: string }
  | { type: 'directive'; node: DirectiveNode }

export type DirectiveFailure = (line: number, message: string) => never

interface DirectiveStart {
  markerLength: number
  name: string
  argument?: string
}

export function fenceStart(
  line: string,
): { marker: string; language?: string } | null {
  const match = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`~]+)?\s*$/)
  return match ? { marker: match[1], language: match[2] } : null
}

export function isFenceClose(line: string, marker: string): boolean {
  const character = marker[0]
  return new RegExp(`^\\s*${character}{${marker.length},}\\s*$`).test(line)
}

function directiveStart(line: string): DirectiveStart | null {
  const match = line.match(/^\s*(:{3,})([a-z][a-z0-9-]*)(?:\s+(.+?))?\s*$/)
  return match
    ? {
        markerLength: match[1].length,
        name: match[2],
        argument: match[3]?.trim(),
      }
    : null
}

function isDirectiveClose(line: string, markerLength: number): boolean {
  return new RegExp(`^\\s*:{${markerLength}}\\s*$`).test(line)
}

function skipFence(
  lines: string[],
  index: number,
  failure: DirectiveFailure,
): number {
  const fence = fenceStart(lines[index])
  if (!fence) return index
  const startLine = index + 1
  index += 1
  while (index < lines.length && !isFenceClose(lines[index], fence.marker)) {
    index += 1
  }
  if (index >= lines.length) {
    failure(startLine, 'fenced code block is missing its closing fence')
  }
  return index + 1
}

function scanCodeTabs(
  lines: string[],
  openIndex: number,
  failure: DirectiveFailure,
): { node: DirectiveNode; nextIndex: number } {
  let index = openIndex + 1
  const bodyStart = index
  while (index < lines.length) {
    if (isDirectiveClose(lines[index], 3)) {
      return {
        node: {
          name: 'code-tabs',
          markerLength: 3,
          startLine: openIndex + 1,
          body: lines.slice(bodyStart, index).join('\n'),
          children: [],
        },
        nextIndex: index + 1,
      }
    }
    if (fenceStart(lines[index])) {
      index = skipFence(lines, index, failure)
      continue
    }
    index += 1
  }
  failure(openIndex + 1, 'code-tabs group is missing its closing :::')
}

function scanLanguageChild(
  lines: string[],
  openIndex: number,
  start: DirectiveStart,
  failure: DirectiveFailure,
): { node: DirectiveNode; nextIndex: number } {
  let index = openIndex + 1
  const bodyStart = index
  while (index < lines.length) {
    if (isDirectiveClose(lines[index], 3)) {
      return {
        node: {
          name: 'language',
          markerLength: 3,
          argument: start.argument,
          startLine: openIndex + 1,
          body: lines.slice(bodyStart, index).join('\n'),
          children: [],
        },
        nextIndex: index + 1,
      }
    }
    if (isDirectiveClose(lines[index], 4)) {
      failure(openIndex + 1, 'language block is missing its closing :::')
    }
    if (fenceStart(lines[index])) {
      index = skipFence(lines, index, failure)
      continue
    }
    const nestedStart = directiveStart(lines[index])
    if (nestedStart?.markerLength === 3 && nestedStart.name === 'language') {
      failure(openIndex + 1, 'language block is missing its closing :::')
    }
    if (nestedStart) {
      failure(index + 1, 'nested framework directives are not allowed in language blocks')
    }
    index += 1
  }
  failure(openIndex + 1, 'language block is missing its closing :::')
}

function scanLanguageContainer(
  lines: string[],
  openIndex: number,
  name: 'language-content' | 'runtime-model',
  failure: DirectiveFailure,
): { node: DirectiveNode; nextIndex: number } {
  let index = openIndex + 1
  const children: DirectiveNode[] = []

  while (index < lines.length) {
    if (isDirectiveClose(lines[index], 4)) {
      return {
        node: {
          name,
          markerLength: 4,
          startLine: openIndex + 1,
          body: '',
          children,
        },
        nextIndex: index + 1,
      }
    }
    if (lines[index].trim() === '') {
      index += 1
      continue
    }

    const start = directiveStart(lines[index])
    if (!start || start.markerLength !== 3 || start.name !== 'language') {
      failure(
        index + 1,
        `${name} may contain only :::language blocks`,
      )
    }
    const child = scanLanguageChild(lines, index, start, failure)
    children.push(child.node)
    index = child.nextIndex
  }

  failure(openIndex + 1, `${name} is missing its closing ::::`)
}

export function scanWritingDirectives(
  body: string,
  failure: DirectiveFailure,
): ScannedWritingPart[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n')
  const parts: ScannedWritingPart[] = []
  let markdownStart = 0
  let index = 0

  const flushMarkdown = (end: number) => {
    const source = lines.slice(markdownStart, end).join('\n').trim()
    if (source) parts.push({ type: 'markdown', source })
  }

  while (index < lines.length) {
    const ordinaryFence = fenceStart(lines[index])
    if (ordinaryFence) {
      index += 1
      while (index < lines.length && !isFenceClose(lines[index], ordinaryFence.marker)) {
        index += 1
      }
      if (index < lines.length) index += 1
      continue
    }

    const start = directiveStart(lines[index])
    const isCodeTabs =
      start?.markerLength === 3 && start.name === 'code-tabs' && !start.argument
    const isLanguageContent =
      start?.markerLength === 4 && start.name === 'language-content' && !start.argument
    const isRuntimeModel =
      start?.markerLength === 4 && start.name === 'runtime-model' && !start.argument
    if (!isCodeTabs && !isLanguageContent && !isRuntimeModel) {
      index += 1
      continue
    }

    flushMarkdown(index)
    const scanned = isCodeTabs
      ? scanCodeTabs(lines, index, failure)
      : scanLanguageContainer(
          lines,
          index,
          isLanguageContent ? 'language-content' : 'runtime-model',
          failure,
        )
    parts.push({ type: 'directive', node: scanned.node })
    index = scanned.nextIndex
    markdownStart = index
  }

  flushMarkdown(lines.length)
  return parts
}
