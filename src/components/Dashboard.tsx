import { useState } from 'react'
import { Header } from './Header'
import { TodayPage } from '../pages/TodayPage'
import { TasksPage } from '../pages/TasksPage'
import { CalendarPage } from '../pages/CalendarPage'
import { WeeklyPage } from '../pages/WeeklyPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { MyAndDepartmentsPage } from '../pages/MyAndDepartmentsPage'
import { TrackOverviewPage } from '../pages/TrackOverviewPage'

export type TabId =
  | 'today'
  | 'mydept'
  | 'track'
  | 'tasks'
  | 'calendar'
  | 'weekly'
  | 'projects'

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: '📅 今日' },
  { id: 'mydept', label: '👤🏬 我的與部門' },
  { id: 'track', label: '📉 追蹤總覽' },
  { id: 'tasks', label: '📋 任務看板' },
  { id: 'calendar', label: '🗓 行程 & 截止日' },
  { id: 'weekly', label: '📊 週報回顧' },
  { id: 'projects', label: '🗂 專案管理' },
]

export function Dashboard() {
  const [tab, setTab] = useState<TabId>('today')

  return (
    <>
      <Header />
      <div className="banner-note">
        已可接 Supabase：有設定環境變數時會嘗試雲端同步；若匿名登入被 API
        拒絕，請用畫面上方 Email 登入。未設定變數時資料僅在本機。
      </div>
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
