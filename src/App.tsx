import { HashRouter, Route, Routes } from 'react-router-dom'
import { DashboardProvider } from './context/DashboardContext'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RootRedirect } from './components/RootRedirect'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <DashboardProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/:tabId" element={<Dashboard />} />
          </Routes>
        </DashboardProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}
