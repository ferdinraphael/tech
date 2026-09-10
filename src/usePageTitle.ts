import { useEffect } from 'react'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Ferdin Raphael` : 'Ferdin Raphael — Software & Systems'
  }, [title])
}
