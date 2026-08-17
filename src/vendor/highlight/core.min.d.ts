export interface HighlightResult {
  value: string
}

export interface HighlightCore {
  registerLanguage(name: string, definition: unknown): void
  getLanguage(name: string): unknown
  highlight(code: string, options: { language: string }): HighlightResult
}

declare const highlighter: HighlightCore
export default highlighter
