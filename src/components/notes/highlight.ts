import highlighter from '../../vendor/highlight/core.min.js'
import bash from '../../vendor/highlight/languages/bash.min.js'
import csharp from '../../vendor/highlight/languages/csharp.min.js'
import css from '../../vendor/highlight/languages/css.min.js'
import javascript from '../../vendor/highlight/languages/javascript.min.js'
import json from '../../vendor/highlight/languages/json.min.js'
import powershell from '../../vendor/highlight/languages/powershell.min.js'
import python from '../../vendor/highlight/languages/python.min.js'
import sql from '../../vendor/highlight/languages/sql.min.js'
import typescript from '../../vendor/highlight/languages/typescript.min.js'
import xml from '../../vendor/highlight/languages/xml.min.js'
import type { CanonicalCodeLanguage } from '../../content/notes/types'

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
