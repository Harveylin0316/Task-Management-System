import { useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { TaskRows } from '../components/TaskRows'
import { ScopeFilterBar } from '../components/ScopeFilterBar'
import { DateTextAndPicker } from '../components/DateTextAndPicker'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { RosterMemberSelect } from '../components/RosterMemberSelect'
import {
  expectedReplyOverdue,
  waitingDaysElapsed,
} from '../lib/dateUtils'
import { taskMatchesScope, type TaskScopeFilter } from '../lib/taskScope'

export function TodayPage() {
  const { data, addTask, addWaiting, removeWaiting, updateWaitingItem } =
    useDashboard()
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
                onChange={(id) => {
                  setNewTaskDept(id)
                  setTodayAssignee('')
                }}
                className="input"
                includePersonal={false}
              />
              <RosterMemberSelect
                roster={data.teamRoster}
                departmentId={newTaskDept}
                value={todayAssignee}
                onChange={setTodayAssignee}
                className="input task-assignee-input"
                allowEmpty
              />
              <input
                className="input"
                placeholder="加入今日任務…"
                value={todayIn}
                onChange={(e) => setTodayIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const ok = addTask('today', todayIn, {
                      departmentId: newTaskDept,
                      assignee: todayAssignee,
                    })
                    if (ok) setTodayIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const ok = addTask('today', todayIn, {
                    departmentId: newTaskDept,
                    assignee: todayAssignee,
                  })
                  if (ok) setTodayIn('')
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
                const days = waitingDaysElapsed(w.since)
                const cls =
                  days >= 5 ? 'days-over' : days >= 3 ? 'days-warn' : 'days-ok'
                const initials = (w.who || '?').slice(0, 2).toUpperCase()
                const expOver = expectedReplyOverdue(w.expectedBy)
                return (
                  <div key={w.id} className="waiting-item">
                    <div className="waiting-who">{initials}</div>
                    <div className="waiting-content">
                      <div className="waiting-title">{w.title}</div>
                      <div className="waiting-since">
                        對象：{w.who.trim() ? w.who : '（未填）'}
                        {w.since ? ` · 起算 ${w.since}` : ''}
                        {w.expectedBy ? (
                          <span
                            className={
                              expOver ? 'waiting-expected overdue' : 'waiting-expected'
                            }
                          >
                            {' '}
                            · 預期 {w.expectedBy}
                            {expOver ? '（已過）' : ''}
                          </span>
                        ) : null}
                      </div>
                      <div className="waiting-expected-row">
                        <label className="waiting-expected-label">
                          預期回覆
                          <DateTextAndPicker
                            className="input waiting-expected-input"
                            value={w.expectedBy ?? ''}
                            onChange={(v) =>
                              updateWaitingItem(w.id, {
                                expectedBy: v || undefined,
                              })
                            }
                            textPlaceholder="文字或選日"
                          />
                        </label>
                      </div>
                    </div>
                    <span className={`waiting-days ${cls}`} title="已等待天數">
                      {days} 天
                    </span>
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
