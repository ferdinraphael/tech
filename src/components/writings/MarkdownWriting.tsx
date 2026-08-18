import { Fragment, createElement, type ReactNode } from 'react'
import GithubSlugger from 'github-slugger'
import { marked, type Token } from 'marked'
import { normalizeCodeLanguage } from '../../content/writings/languages'
import type { WritingSegment } from '../../content/writings/types'
import { CodeBlock } from './CodeBlock'
import { CodeTabs } from './CodeTabs'
import styles from './Writings.module.css'

type MarkedToken = Token & { text?: string; tokens?: MarkedToken[] }

function safeUrl(value: string | undefined, image = false): string | null {
  if (!value) return null
  const normalized = value.trim()
  if (/^(?:javascript|vbscript|data):/i.test(normalized)) return null
  if (image && /^(?:mailto|tel):/i.test(normalized)) return null
  return normalized
}

function tokenText(token: MarkedToken): string {
  if (token.tokens) return token.tokens.map(tokenText).join('')
  return token.text ?? ''
}

function inlineTokens(tokens: MarkedToken[] | undefined, keyPrefix: string): ReactNode[] {
  return (tokens ?? []).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'text':
      case 'escape':
        return <Fragment key={key}>{token.tokens ? inlineTokens(token.tokens, key) : token.text}</Fragment>
      case 'strong':
        return <strong key={key}>{inlineTokens(token.tokens, key)}</strong>
      case 'em':
        return <em key={key}>{inlineTokens(token.tokens, key)}</em>
      case 'del':
        return <del key={key}>{inlineTokens(token.tokens, key)}</del>
      case 'codespan':
        return <code key={key}>{token.text}</code>
      case 'br':
        return <br key={key} />
      case 'link': {
        const href = safeUrl(token.href)
        if (!href) return <Fragment key={key}>{inlineTokens(token.tokens, key)}</Fragment>
        const external = /^https?:\/\//i.test(href)
        return (
          <a
            key={key}
            href={href}
            title={token.title ?? undefined}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
          >
            {inlineTokens(token.tokens, key)}
          </a>
        )
      }
      case 'image': {
        const src = safeUrl(token.href, true)
        return src ? (
          <img
            key={key}
            src={src}
            alt={token.text ?? ''}
            title={token.title ?? undefined}
            loading="lazy"
          />
        ) : null
      }
      case 'html':
        return <Fragment key={key}>{token.raw}</Fragment>
      default:
        return <Fragment key={key}>{token.text}</Fragment>
    }
  })
}

function blockTokens(
  tokens: MarkedToken[] | undefined,
  keyPrefix: string,
  slugger: GithubSlugger,
): ReactNode[] {
  return (tokens ?? []).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'space':
        return null
      case 'paragraph':
        return <p key={key}>{inlineTokens(token.tokens, key)}</p>
      case 'text':
        return <Fragment key={key}>{inlineTokens(token.tokens, key)}</Fragment>
      case 'heading': {
        const depth = Math.min(6, Math.max(1, token.depth ?? 2))
        const text = tokenText(token)
        const id = slugger.slug(text)
        return createElement(
          `h${depth}`,
          { key, id },
          inlineTokens(token.tokens, key),
          createElement('a', { href: `#${id}`, 'aria-label': `Link to ${text}` }, '#'),
        )
      }
      case 'code': {
        const rawLanguage = token.lang?.trim().split(/\s+/)[0]
        const language = normalizeCodeLanguage(rawLanguage)
        return (
          <CodeBlock
            key={key}
            code={token.text ?? ''}
            language={language}
            label={language ? undefined : rawLanguage || 'Code'}
          />
        )
      }
      case 'blockquote':
        return <blockquote key={key}>{blockTokens(token.tokens, key, slugger)}</blockquote>
      case 'list': {
        const List = token.ordered ? 'ol' : 'ul'
        const start = token.ordered && token.start ? Number(token.start) : undefined
        return (
          <List key={key} start={start}>
            {(token.items ?? []).map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>
                {blockTokens(item.tokens, `${key}-${itemIndex}`, slugger)}
              </li>
            ))}
          </List>
        )
      }
      case 'table':
        return (
          <div key={key} className={styles.tableScroll} tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {(token.header ?? []).map((cell, cellIndex) => (
                    <th key={`${key}-h-${cellIndex}`} style={{ textAlign: token.align?.[cellIndex] ?? undefined }}>
                      {inlineTokens(cell.tokens, `${key}-h-${cellIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(token.rows ?? []).map((row, rowIndex) => (
                  <tr key={`${key}-r-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${key}-r-${rowIndex}-${cellIndex}`} style={{ textAlign: token.align?.[cellIndex] ?? undefined }}>
                        {inlineTokens(cell.tokens, `${key}-r-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'hr':
        return <hr key={key} />
      case 'html':
        return <p key={key}>{token.raw}</p>
      default:
        return token.tokens ? (
          <Fragment key={key}>{blockTokens(token.tokens, key, slugger)}</Fragment>
        ) : null
    }
  })
}

export function MarkdownWriting({ segments }: { segments: WritingSegment[] }) {
  const slugger = new GithubSlugger()
  return (
    <div className={styles.markdownBody}>
      {segments.map((segment, index) =>
        segment.type === 'code-tabs' ? (
          <CodeTabs key={`tabs-${index}`} samples={segment.samples} />
        ) : (
          <Fragment key={`markdown-${index}`}>
            {blockTokens(marked.lexer(segment.source, { gfm: true }), `segment-${index}`, slugger)}
          </Fragment>
        ),
      )}
    </div>
  )
}
