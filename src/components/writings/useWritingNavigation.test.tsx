import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMobileContentsVisibility } from './useWritingNavigation'

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

let observerCallback: ObserverCallback | undefined

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = (entries) => callback(entries, this as unknown as IntersectionObserver)
  }

  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() { return [] }
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]
}

function VisibilityProbe({ enabled = true }: { enabled?: boolean }) {
  const tocRef = useRef<HTMLElement>(null)
  const visible = useMobileContentsVisibility(tocRef, enabled)
  return (
    <>
      <nav ref={tocRef}>Contents</nav>
      <output>{visible ? 'visible' : 'hidden'}</output>
    </>
  )
}

function setMobile(matches: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: query === '(max-width: 767px)' ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  observerCallback = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('mobile Contents visibility', () => {
  it('appears only on mobile after the TOC has left above the viewport', () => {
    setMobile(true)
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 260,
    } as DOMRect)
    render(<VisibilityProbe />)

    expect(screen.getByText('hidden')).toBeInTheDocument()
    act(() => observerCallback?.([{
      isIntersecting: false,
      boundingClientRect: { bottom: 0 },
    } as IntersectionObserverEntry]))
    expect(screen.getByText('visible')).toBeInTheDocument()

    act(() => observerCallback?.([{
      isIntersecting: true,
      boundingClientRect: { bottom: 220 },
    } as IntersectionObserverEntry]))
    expect(screen.getByText('hidden')).toBeInTheDocument()
  })

  it('stays absent on desktop and when no TOC exists', () => {
    setMobile(false)
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const { rerender } = render(<VisibilityProbe />)
    act(() => observerCallback?.([{
      isIntersecting: false,
      boundingClientRect: { bottom: -20 },
    } as IntersectionObserverEntry]))
    expect(screen.getByText('hidden')).toBeInTheDocument()

    rerender(<VisibilityProbe enabled={false} />)
    expect(screen.getByText('hidden')).toBeInTheDocument()
  })
})
