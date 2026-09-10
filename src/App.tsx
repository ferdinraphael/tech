import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { FoundationPage } from './components/FoundationPage'
import { NotFoundPage } from './components/NotFoundPage'
import { OverviewPage } from './components/OverviewPage'
import { SoftwareDevelopmentPage } from './components/services/SoftwareDevelopmentPage'
import { TechnicalConsultingPage } from './components/services/TechnicalConsultingPage'
import { MentoringTeachingPage } from './components/services/MentoringTeachingPage'
import { usePageTitle } from './usePageTitle'

const WritingsIndexPage = lazy(() => import('./components/writings/WritingsIndexPage'))
const WritingPage = lazy(() => import('./components/writings/WritingPage'))

function PageTitle({ title, children }: { title?: string; children: ReactNode }) {
  usePageTitle(title)
  return children
}

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
        <Route index element={<PageTitle><OverviewPage /></PageTitle>} />
        <Route path="profile" element={<PageTitle title="Profile"><FoundationPage page="profile" /></PageTitle>} />
        <Route path="projects" element={<PageTitle title="Projects"><FoundationPage page="projects" /></PageTitle>} />
        <Route path="built-and-published" element={<PageTitle title="Built & Published"><FoundationPage page="built-and-published" /></PageTitle>} />
        <Route path="services" element={<PageTitle title="Services"><FoundationPage page="services" /></PageTitle>} />
        <Route path="services/software-development" element={<PageTitle title="Software Development"><SoftwareDevelopmentPage /></PageTitle>} />
        <Route path="services/technical-consulting" element={<PageTitle title="Technical Consulting"><TechnicalConsultingPage /></PageTitle>} />
        <Route path="services/mentoring-teaching" element={<PageTitle title="Mentoring & Teaching"><MentoringTeachingPage /></PageTitle>} />
        <Route path="writings" element={<PageTitle title="Writings"><WritingsRoute><WritingsIndexPage /></WritingsRoute></PageTitle>} />
        <Route path="writings/:slug" element={<WritingsRoute><WritingPage /></WritingsRoute>} />
        <Route path="notes" element={<LegacyNotesRedirect />} />
        <Route path="notes/:slug" element={<LegacyNotesRedirect />} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PageTitle title="Not Found"><NotFoundPage /></PageTitle>} />
      </Route>
    </Routes>
  )
}

export default App
