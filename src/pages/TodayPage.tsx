import { useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { TaskRows } from '../components/TaskRows'
import { ScopeFilterBar } from '../components/ScopeFilterBar'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { taskMatchesScope, type TaskScopeFilter } from '../lib/taskScope'

function waitingDays(since: string): number {
  const t = new Date(since).getTime()
  if (Number.isNaN(t)) return 0
  return Math.floor((Date.now() - t) / 86400000)
}

export function TodayPage() {
  const { data, addTask, addWaiting, removeWaiting } = useDashboard()
  const [todayIn, setTodayIn] = useState('')
  const [waitIn, setWaitIn] = useState('')
  const [newTaskDept, setNewTaskDept] = useState<string | null>(null)
  const [todayAssignee, setTodayAssignee] = useState('')
  const [scopeFilter, setScopeFilter] = useState<TaskScopeFilter>('all')

  const todayFiltered = useMemo(
    () => data.today.filter((t) => taskMatchesScope(t, scopeFilter)),
    [data.today, scopeFilter],
  )

  const todayUndone = useMemo(() => {
    const list = data.today.filter((t) => taskMatchesScope(t, scopeFilter))
    return list.filter((t) => !t.done).length
  }, [data.today, scopeFilter])

  return (
    <>
      <ScopeFilterBar
        departments={data.departments}
        value={scopeFilter}
        onChange={setScopeFilter}
      />
      <div className="stats-bar">
        <div className="stat-card accent">
          <div className="stat-label">今日待辦</div>
          <div className="stat-value">{todayUndone}</div>
          <div className="stat-sub">尚未完成</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">進行中</div>
          <div className="stat-value">
            {data.active.filter((t) => taskMatchesScope(t, scopeFilter)).length}
          </div>
          <div className="stat-sub">本週任務</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">等待回覆</div>
          <div className="stat-value">{data.waiting.length}</div>
          <div className="stat-sub">追蹤中</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">本週完成</div>
          <div className="stat-value">{data.done.length}</div>
          <div className="stat-sub">已結案</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔥 今日優先</div>
            <span className="card-badge">{todayFiltered.length} 件</span>
          </div>
          <div className="card-body">
            <TaskRows items={todayFiltered} section="today" />
            <div className="add-task-row">
              <DepartmentSelect
                departments={data.departments}
                value={newTaskDept}
                onChange={setNewTaskDept}
                className="input"
              />
              <input
                className="input task-assignee-input"
                placeholder="負責人"
                list="wm-team-roster-datalist"
                value={todayAssignee}
                onChange={(e) => setTodayAssignee(e.target.value)}
              />
              <input
                className="input"
                placeholder="加入今日任務…"
                value={todayIn}
                onChange={(e) => setTodayIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask('today', todayIn, {
                      departmentId: newTaskDept,
                      assignee: todayAssignee,
                    })
                    setTodayIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addTask('today', todayIn, {
                    departmentId: newTaskDept,
                    assignee: todayAssignee,
                  })
                  setTodayIn('')
                }}
              >
                新增
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">⏳ 等待回覆</div>
            <span className="card-badge">{data.waiting.length} 件</span>
          </div>
          <div className="card-body">
            {!data.waiting.length ? (
              <div className="empty">
                <div className="empty-icon">👍</div>
                沒有等待中的事項
              </div>
            ) : (
              data.waiting.map((w) => {
                const days = waitingDays(w.since)
                const cls =
                  days >= 5 ? 'days-over' : days >= 3 ? 'days-warn' : 'days-ok'
                const initials = (w.who || '?').slice(0, 2).toUpperCase()
                return (
                  <div key={w.id} className="waiting-item">
                    <div className="waiting-who">{initials}</div>
                    <div className="waiting-content">
                      <div className="waiting-title">{w.title}</div>
                      <div className="waiting-since">
                        等待 {w.who || ''}
                        {w.since ? ` · 自 ${w.since}` : ''}
                      </div>
                    </div>
                    <span className={`waiting-days ${cls}`}>{days}天</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeWaiting(w.id)}
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
            <div className="add-task-row">
              <input
                className="input"
                placeholder="人名：事情（如：小明：確認規格）"
                value={waitIn}
                onChange={(e) => setWaitIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addWaiting(waitIn)
                    setWaitIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  addWaiting(waitIn)
                  setWaitIn('')
                }}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
