export interface MarkedToken {
  type: string
  raw: string
  text?: string
  depth?: number
  lang?: string
  href?: string
  title?: string | null
  ordered?: boolean
  start?: number | string
  checked?: boolean | null
  tokens?: MarkedToken[]
  items?: MarkedToken[]
  header?: MarkedToken[]
  rows?: MarkedToken[][]
  align?: Array<'center' | 'left' | 'right' | null>
}

export interface MarkedTokensList extends Array<MarkedToken> {
  links: Record<string, unknown>
}

export const marked: {
  lexer(source: string, options?: Record<string, unknown>): MarkedTokensList
}
