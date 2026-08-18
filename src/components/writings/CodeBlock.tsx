import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import type { CanonicalCodeLanguage } from '../../content/writings/types'
import { highlightCode } from './highlight'
import styles from './Writings.module.css'

interface CodeBlockProps {
  code: string
  language: CanonicalCodeLanguage | null
  label?: string
  labelledBy?: string
  showLanguageLabel?: boolean
  standalone?: boolean
}

export function CodeBlock({
  code,
  language,
  label,
  labelledBy,
  showLanguageLabel = true,
  standalone = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const languageLabel = label ?? (language ? codeLanguageLabel(language) : 'Code')
  const className = [
    styles.codeBlock,
    standalone ? styles.standaloneCodeBlock : undefined,
    standalone && language === 'text' ? styles.plainTextBlock : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={className} aria-labelledby={labelledBy}>
      <figcaption className={styles.codeToolbar}>
        {showLanguageLabel ? <span>{languageLabel}</span> : <span>CODE</span>}
        <button type="button" onClick={copyCode} aria-label={`Copy ${languageLabel} code`}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className={styles.srOnly} aria-live="polite">
          {copied ? `${languageLabel} code copied to clipboard.` : ''}
        </span>
      </figcaption>
      <pre tabIndex={0} aria-label={`${languageLabel} code`}>
        <code
          className={language ? `language-${language}` : undefined}
          dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
        />
      </pre>
    </figure>
  )
}
