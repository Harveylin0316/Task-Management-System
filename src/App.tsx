import { DashboardProvider } from './context/DashboardContext'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </ErrorBoundary>
  )
}
