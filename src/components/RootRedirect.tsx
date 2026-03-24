import { Navigate } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { defaultTabFromUi } from '../lib/dashboardRoutes'

/** `#/` 依雲端偏好導向 `/#/today` 等（僅在 Provider 已 hydrated 後掛載） */
export function RootRedirect() {
  const { data } = useDashboard()
  const tab = defaultTabFromUi(data.ui?.defaultTab)
  return <Navigate to={`/${tab}`} replace />
}
