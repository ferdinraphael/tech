import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { FoundationPage } from './components/FoundationPage'
import { NotFoundPage } from './components/NotFoundPage'
import { OverviewPage } from './components/OverviewPage'
import { SoftwareDevelopmentPage } from './components/services/SoftwareDevelopmentPage'
import { TechnicalConsultingPage } from './components/services/TechnicalConsultingPage'
import { MentoringTeachingPage } from './components/services/MentoringTeachingPage'
import { pageMetadata } from './seo'
import { usePageSeo } from './usePageSeo'

const WritingsIndexPage = lazy(() => import('./components/writings/WritingsIndexPage'))
const WritingPage = lazy(() => import('./components/writings/WritingPage'))

function PageSeo({ page, children }: { page: keyof typeof pageMetadata; children: ReactNode }) {
  usePageSeo(pageMetadata[page])
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
        <Route index element={<PageSeo page="overview"><OverviewPage /></PageSeo>} />
        <Route path="profile" element={<PageSeo page="profile"><FoundationPage page="profile" /></PageSeo>} />
        <Route path="projects" element={<PageSeo page="projects"><FoundationPage page="projects" /></PageSeo>} />
        <Route path="built-and-published" element={<PageSeo page="built-and-published"><FoundationPage page="built-and-published" /></PageSeo>} />
        <Route path="services" element={<PageSeo page="services"><FoundationPage page="services" /></PageSeo>} />
        <Route path="services/software-development" element={<PageSeo page="software-development"><SoftwareDevelopmentPage /></PageSeo>} />
        <Route path="services/technical-consulting" element={<PageSeo page="technical-consulting"><TechnicalConsultingPage /></PageSeo>} />
        <Route path="services/mentoring-teaching" element={<PageSeo page="mentoring-teaching"><MentoringTeachingPage /></PageSeo>} />
        <Route path="writings" element={<PageSeo page="writings"><WritingsRoute><WritingsIndexPage /></WritingsRoute></PageSeo>} />
        <Route path="writings/:slug" element={<WritingsRoute><WritingPage /></WritingsRoute>} />
        <Route path="notes" element={<LegacyNotesRedirect />} />
        <Route path="notes/:slug" element={<LegacyNotesRedirect />} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PageSeo page="notFound"><NotFoundPage /></PageSeo>} />
      </Route>
    </Routes>
  )
}

export default App
