import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { FoundationPage } from './components/FoundationPage'
import { NotFoundPage } from './components/NotFoundPage'
import { OverviewPage } from './components/OverviewPage'

const NotesIndexPage = lazy(() => import('./components/notes/NotesIndexPage'))
const ArticlePage = lazy(() => import('./components/notes/ArticlePage'))

function NotesRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div role="status">Loading technical notes…</div>}>{children}</Suspense>
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="profile" element={<FoundationPage page="profile" />} />
        <Route path="projects" element={<FoundationPage page="projects" />} />
        <Route path="services" element={<FoundationPage page="services" />} />
        <Route path="notes" element={<NotesRoute><NotesIndexPage /></NotesRoute>} />
        <Route path="notes/:slug" element={<NotesRoute><ArticlePage /></NotesRoute>} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
