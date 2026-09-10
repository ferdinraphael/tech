import type GithubSlugger from 'github-slugger'
import type { Token } from 'marked'

type HeadingToken = Token & { depth?: number; text?: string; tokens?: HeadingToken[] }

function headingText(token: HeadingToken): string {
  return token.tokens ? token.tokens.map(headingText).join('') : token.text ?? ''
}

// Both rendering and Contents allocate an ID for every heading, in document
// order. Filtering the levels shown in Contents happens only after allocation.
export function headingAnchor(token: HeadingToken, slugger: GithubSlugger) {
  const text = headingText(token)
  return { text, id: slugger.slug(text) }
}

export function* markdownHeadings(tokens: Token[]): Generator<HeadingToken> {
  for (const token of tokens) {
    if (token.type === 'heading') yield token
    else if (token.type === 'list') {
      for (const item of token.items) yield* markdownHeadings(item.tokens)
    } else if (token.type === 'blockquote') {
      yield* markdownHeadings(token.tokens)
    }
  }
}
