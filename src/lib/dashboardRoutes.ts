import type { DashboardTabId } from './types'

export const DASHBOARD_TABS: { id: DashboardTabId; label: string }[] = [
  { id: 'today', label: '📅 今日' },
  { id: 'deptws', label: '🏢 部門工作台' },
  { id: 'mydept', label: '🏬 部門與KPI管理' },
  { id: 'track', label: '📉 追蹤總覽' },
  { id: 'tasks', label: '📋 任務看板' },
  { id: 'calendar', label: '🗓 行程 & 截止日' },
  { id: 'weekly', label: '📊 週報回顧' },
  { id: 'projects', label: '🗂 專案管理' },
]

const TAB_SET = new Set<string>(DASHBOARD_TABS.map((t) => t.id))

export function isDashboardTabId(s: string | undefined): s is DashboardTabId {
  return s != null && TAB_SET.has(s)
}

export function defaultTabFromUi(
  defaultTab: DashboardTabId | undefined,
): DashboardTabId {
  if (defaultTab && isDashboardTabId(defaultTab)) return defaultTab
  return 'today'
}
