import highlighter from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import powershell from 'highlight.js/lib/languages/powershell'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import type { CanonicalCodeLanguage } from '../../content/writings/types'

highlighter.registerLanguage('bash', bash)
highlighter.registerLanguage('csharp', csharp)
highlighter.registerLanguage('css', css)
highlighter.registerLanguage('javascript', javascript)
highlighter.registerLanguage('json', json)
highlighter.registerLanguage('powershell', powershell)
highlighter.registerLanguage('python', python)
highlighter.registerLanguage('sql', sql)
highlighter.registerLanguage('typescript', typescript)
highlighter.registerLanguage('xml', xml)

function escapeHtml(code: string): string {
  return code
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function highlightCode(
  code: string,
  language: CanonicalCodeLanguage | null,
): string {
  if (!language || language === 'text') return escapeHtml(code)
  const grammar = language === 'html' ? 'xml' : language
  return highlighter.highlight(code, { language: grammar }).value
}
