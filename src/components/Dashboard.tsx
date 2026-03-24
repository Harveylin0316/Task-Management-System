import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import type { DashboardTabId } from '../lib/types'
import { DASHBOARD_TABS, isDashboardTabId } from '../lib/dashboardRoutes'
import { Header } from './Header'
import { TodayPage } from '../pages/TodayPage'
import { TasksPage } from '../pages/TasksPage'
import { CalendarPage } from '../pages/CalendarPage'
import { WeeklyPage } from '../pages/WeeklyPage'
import { BossWeeklyReportPage } from '../pages/BossWeeklyReportPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { MyAndDepartmentsPage } from '../pages/MyAndDepartmentsPage'
import { TrackOverviewPage } from '../pages/TrackOverviewPage'
import { DepartmentWorkspacePage } from '../pages/DepartmentWorkspacePage'

/** @deprecated 請改用 {@link DashboardTabId} */
export type TabId = DashboardTabId

function TeamRosterDatalists() {
  const { data } = useDashboard()
  return (
    <>
      <datalist id="wm-roster-all">
        {data.teamRoster.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
      {data.departments.map((d) => {
        const names = data.teamRoster.filter((m) => m.departmentId === d.id)
        if (!names.length) return null
        return (
          <datalist key={d.id} id={`wm-roster-dept-${d.id}`}>
            {names.map((m) => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
        )
      })}
    </>
  )
}

export function Dashboard() {
  const { tabId } = useParams<{ tabId: string }>()
  const navigate = useNavigate()

  if (!tabId || !isDashboardTabId(tabId)) {
    return <Navigate to="/today" replace />
  }

  const tab = tabId

  return (
    <>
      <TeamRosterDatalists />
      <Header />
      <nav className="tabs" aria-label="主要分頁">
        {DASHBOARD_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => navigate(`/${t.id}`)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="main">
        <div className={`page ${tab === 'today' ? 'active' : ''}`}>
          <TodayPage />
        </div>
        <div className={`page ${tab === 'deptws' ? 'active' : ''}`}>
          <DepartmentWorkspacePage />
        </div>
        <div className={`page ${tab === 'mydept' ? 'active' : ''}`}>
          <MyAndDepartmentsPage />
        </div>
        <div className={`page ${tab === 'track' ? 'active' : ''}`}>
          <TrackOverviewPage />
        </div>
        <div className={`page ${tab === 'tasks' ? 'active' : ''}`}>
          <TasksPage />
        </div>
        <div className={`page ${tab === 'calendar' ? 'active' : ''}`}>
          <CalendarPage />
        </div>
        <div className={`page ${tab === 'weekly' ? 'active' : ''}`}>
          <WeeklyPage />
        </div>
        <div className={`page ${tab === 'bossweekly' ? 'active' : ''}`}>
          <BossWeeklyReportPage />
        </div>
        <div className={`page ${tab === 'projects' ? 'active' : ''}`}>
          <ProjectsPage />
        </div>
      </main>
    </>
  )
}
