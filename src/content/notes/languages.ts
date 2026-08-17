import type { CanonicalCodeLanguage } from './types'

export const preferredLanguageStorageKey =
  'ferdinraphael.tech.preferred-code-language'

const aliases: Record<string, CanonicalCodeLanguage> = {
  csharp: 'csharp',
  cs: 'csharp',
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  py: 'python',
  json: 'json',
  bash: 'bash',
  shell: 'bash',
  powershell: 'powershell',
  ps1: 'powershell',
  sql: 'sql',
  html: 'html',
  css: 'css',
  text: 'text',
  plaintext: 'text',
}

const labels: Record<CanonicalCodeLanguage, string> = {
  csharp: 'C#',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  json: 'JSON',
  bash: 'Bash',
  powershell: 'PowerShell',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  text: 'Plain text',
}

export function normalizeCodeLanguage(
  language: string | undefined,
): CanonicalCodeLanguage | null {
  if (!language) return null
  return aliases[language.trim().toLowerCase()] ?? null
}

export function codeLanguageLabel(language: CanonicalCodeLanguage): string {
  return labels[language]
}
