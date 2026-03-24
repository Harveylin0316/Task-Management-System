import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { DashboardTabId } from '../lib/types'
import { Header } from './Header'
import { TodayPage } from '../pages/TodayPage'
import { TasksPage } from '../pages/TasksPage'
import { CalendarPage } from '../pages/CalendarPage'
import { WeeklyPage } from '../pages/WeeklyPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { MyAndDepartmentsPage } from '../pages/MyAndDepartmentsPage'
import { TrackOverviewPage } from '../pages/TrackOverviewPage'
import { DepartmentWorkspacePage } from '../pages/DepartmentWorkspacePage'

/** @deprecated 請改用 {@link DashboardTabId} */
export type TabId = DashboardTabId

const TABS: { id: DashboardTabId; label: string }[] = [
  { id: 'today', label: '📅 今日' },
  { id: 'deptws', label: '🏢 部門工作台' },
  { id: 'mydept', label: '🏬 部門與KPI管理' },
  { id: 'track', label: '📉 追蹤總覽' },
  { id: 'tasks', label: '📋 任務看板' },
  { id: 'calendar', label: '🗓 行程 & 截止日' },
  { id: 'weekly', label: '📊 週報回顧' },
  { id: 'projects', label: '🗂 專案管理' },
]

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
  const { data, hydrated } = useDashboard()
  const [tab, setTab] = useState<DashboardTabId>('today')
  const landingAppliedRef = useRef(false)

  useEffect(() => {
    if (!hydrated || landingAppliedRef.current) return
    const t = data.ui?.defaultTab
    if (t && TABS.some((x) => x.id === t)) setTab(t)
    landingAppliedRef.current = true
  }, [hydrated, data.ui?.defaultTab])

  return (
    <>
      <TeamRosterDatalists />
      <Header />
      <nav className="tabs" aria-label="主要分頁">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
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
        <div className={`page ${tab === 'projects' ? 'active' : ''}`}>
          <ProjectsPage />
        </div>
      </main>
    </>
  )
}
