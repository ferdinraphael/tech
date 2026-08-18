import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { FoundationPage } from './components/FoundationPage'
import { NotFoundPage } from './components/NotFoundPage'
import { OverviewPage } from './components/OverviewPage'

const WritingsIndexPage = lazy(() => import('./components/writings/WritingsIndexPage'))
const WritingPage = lazy(() => import('./components/writings/WritingPage'))

function WritingsRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div role="status">Loading Writings…</div>}>{children}</Suspense>
}

function LegacyNotesRedirect() {
  const { slug } = useParams()
  const location = useLocation()
  const pathname = slug ? `/writings/${slug}` : '/writings'
  return <Navigate replace to={`${pathname}${location.search}${location.hash}`} />
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="profile" element={<FoundationPage page="profile" />} />
        <Route path="projects" element={<FoundationPage page="projects" />} />
        <Route path="services" element={<FoundationPage page="services" />} />
        <Route path="writings" element={<WritingsRoute><WritingsIndexPage /></WritingsRoute>} />
        <Route path="writings/:slug" element={<WritingsRoute><WritingPage /></WritingsRoute>} />
        <Route path="notes" element={<LegacyNotesRedirect />} />
        <Route path="notes/:slug" element={<LegacyNotesRedirect />} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
