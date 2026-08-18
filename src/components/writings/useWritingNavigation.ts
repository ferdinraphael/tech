import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

const mobileQuery = '(max-width: 767px)'

function hashHeading(ids: readonly string[]): string | undefined {
  const hash = window.location.hash.slice(1)
  if (!hash) return undefined
  try {
    const decoded = decodeURIComponent(hash)
    return ids.includes(decoded) ? decoded : undefined
  } catch {
    return ids.includes(hash) ? hash : undefined
  }
}

function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  return Number.parseFloat(raw) || 66
}

export function useActiveHeading(headingIds: readonly string[]) {
  const idsKey = headingIds.join('\u0000')
  const ids = useMemo(() => (idsKey ? idsKey.split('\u0000') : []), [idsKey])
  const [activeHeading, setActiveHeading] = useState<string | undefined>(() => hashHeading(ids) ?? ids[0])
  const pendingHeading = useRef<string | undefined>(undefined)
  const pendingTimer = useRef<number | undefined>(undefined)

  const activateHeading = useCallback((id: string) => {
    pendingHeading.current = id
    window.clearTimeout(pendingTimer.current)
    pendingTimer.current = window.setTimeout(() => {
      pendingHeading.current = undefined
    }, 1400)
    setActiveHeading(id)
  }, [])

  useEffect(() => {
    if (ids.length === 0) {
      setActiveHeading(undefined)
      return
    }

    let frame = 0
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))

    const update = () => {
      frame = 0
      if (elements.length === 0) return

      if (pendingHeading.current) {
        const target = document.getElementById(pendingHeading.current)
        if (target) {
          const top = target.getBoundingClientRect().top
          if (Math.abs(top - headerOffset()) > 20 && window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4) {
            setActiveHeading(pendingHeading.current)
            return
          }
        }
        pendingHeading.current = undefined
      }

      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        setActiveHeading(elements.at(-1)?.id)
        return
      }

      const readingLine = headerOffset() + Math.min(180, window.innerHeight * 0.28)
      let current = elements[0].id
      for (const heading of elements) {
        if (heading.getBoundingClientRect().top <= readingLine) current = heading.id
        else break
      }
      setActiveHeading(current)
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    const syncHash = () => {
      const id = hashHeading(ids)
      if (!id) {
        pendingHeading.current = undefined
        scheduleUpdate()
        return
      }
      activateHeading(id)
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      })
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('popstate', syncHash)

    if (window.location.hash) syncHash()
    else scheduleUpdate()

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(pendingTimer.current)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('popstate', syncHash)
    }
  }, [activateHeading, ids])

  return { activeHeading, activateHeading }
}

export function useMobileContentsVisibility(
  tocRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toc = tocRef.current
    if (!enabled || !toc) {
      setVisible(false)
      return
    }

    const media = window.matchMedia(mobileQuery)
    const evaluate = (isIntersecting: boolean, bottom: number) => {
      setVisible(media.matches && !isIntersecting && bottom < headerOffset())
    }
    const measure = () => {
      const rect = toc.getBoundingClientRect()
      evaluate(rect.bottom > headerOffset() && rect.top < window.innerHeight, rect.bottom)
    }

    let observer: IntersectionObserver | undefined
    const supportsObserver = typeof (window as Window & {
      IntersectionObserver?: typeof IntersectionObserver
    }).IntersectionObserver === 'function'
    if (supportsObserver) {
      observer = new IntersectionObserver(
        ([entry]) => evaluate(entry.isIntersecting, entry.boundingClientRect.bottom),
        { threshold: 0, rootMargin: `-${headerOffset()}px 0px 0px 0px` },
      )
      observer.observe(toc)
    } else {
      globalThis.addEventListener('scroll', measure, { passive: true })
    }

    const handleViewport = () => measure()
    media.addEventListener('change', handleViewport)
    window.addEventListener('resize', handleViewport)
    measure()

    return () => {
      observer?.disconnect()
      media.removeEventListener('change', handleViewport)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', measure)
    }
  }, [enabled, tocRef])

  return visible
}
