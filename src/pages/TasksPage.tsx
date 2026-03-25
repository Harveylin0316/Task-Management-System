import { useMemo, useState, type FormEvent } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { Modal } from '../components/Modal'
import { TaskRows } from '../components/TaskRows'
import { ScopeFilterBar } from '../components/ScopeFilterBar'
import { DateTextAndPicker } from '../components/DateTextAndPicker'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { RosterMemberSelect } from '../components/RosterMemberSelect'
import { parseParticipantNames } from '../lib/parseParticipants'
import { isAssigneeInDepartmentRoster } from '../lib/taskAssignment'
import { taskMatchesScope, type TaskScopeFilter } from '../lib/taskScope'

export function TasksPage() {
  const {
    data,
    addTask,
    clearDone,
    addSmallProject,
    updateSmallProject,
    removeSmallProject,
    updateSmallProjectProgress,
    toast,
  } = useDashboard()
  const [activeIn, setActiveIn] = useState('')
  const [somedayIn, setSomedayIn] = useState('')
  const [assigneeActive, setAssigneeActive] = useState('')
  const [assigneeSomeday, setAssigneeSomeday] = useState('')
  const [projOpen, setProjOpen] = useState(false)
  const [pName, setPName] = useState('')
  const [pDue, setPDue] = useState('')
  const [pOwner, setPOwner] = useState('')
  const [pDeptId, setPDeptId] = useState<string | null>(null)
  const [pFirstTask, setPFirstTask] = useState('')
  const [pFirstSection, setPFirstSection] = useState<'today' | 'active' | 'someday'>(
    'active',
  )
  const [pParticipantsRaw, setPParticipantsRaw] = useState('')
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [epName, setEpName] = useState('')
  const [epDue, setEpDue] = useState('')
  const [epOwner, setEpOwner] = useState('')
  const [epDeptId, setEpDeptId] = useState<string | null>(null)
  const [epParticipantsRaw, setEpParticipantsRaw] = useState('')
  const [scopeFilter, setScopeFilter] = useState<TaskScopeFilter>('all')
  const [deptActive, setDeptActive] = useState<string | null>(null)
  const [deptSomeday, setDeptSomeday] = useState<string | null>(null)
  const [onlyWeeklyCommit, setOnlyWeeklyCommit] = useState(false)

  const activeF = useMemo(
    () =>
      data.active.filter(
        (t) =>
          taskMatchesScope(t, scopeFilter) &&
          (!onlyWeeklyCommit || t.weeklyCommit),
      ),
    [data.active, scopeFilter, onlyWeeklyCommit],
  )
  const somedayF = useMemo(
    () =>
      data.someday.filter(
        (t) =>
          taskMatchesScope(t, scopeFilter) &&
          (!onlyWeeklyCommit || t.weeklyCommit),
      ),
    [data.someday, scopeFilter, onlyWeeklyCommit],
  )
  const doneF = useMemo(
    () => data.done.filter((t) => taskMatchesScope(t, scopeFilter)),
    [data.done, scopeFilter],
  )

  const allProjectOptions = useMemo(
    () => data.projects.map((p) => ({ id: p.id, name: p.name })),
    [data.projects],
  )

  const submitProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const ft = pFirstTask.trim()
    if (ft) {
      if (pDeptId == null) {
        toast('建立第一筆任務前請選擇專案歸屬部門')
        return
      }
      const owner = pOwner.trim()
      if (
        owner &&
        !isAssigneeInDepartmentRoster(data.teamRoster, pDeptId, owner)
      ) {
        toast('負責人須為該部門名冊成員')
        return
      }
    }
    addSmallProject({
      name: pName,
      due: pDue,
      owner: pOwner,
      departmentId: pDeptId,
      participants: parseParticipantNames(pParticipantsRaw),
      ...(ft
        ? { initialTaskTitle: ft, initialTaskSection: pFirstSection }
        : {}),
    })
    setPName('')
    setPDue('')
    setPOwner('')
    setPDeptId(null)
    setPFirstTask('')
    setPFirstSection('active')
    setPParticipantsRaw('')
    setProjOpen(false)
  }

  const openEditProject = (id: string) => {
    const p = data.projects.find((x) => x.id === id)
    if (!p) return
    setEditProjectId(id)
    setEpName(p.name)
    setEpDue(p.due)
    setEpOwner(p.owner)
    setEpDeptId(p.departmentId)
    setEpParticipantsRaw(p.participants.join(', '))
  }

  const saveEditProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editProjectId) return
    const ow = epOwner.trim()
    if (
      epDeptId != null &&
      ow &&
      !isAssigneeInDepartmentRoster(data.teamRoster, epDeptId, ow)
    ) {
      toast('負責人須為該部門名冊成員')
      return
    }
    updateSmallProject(editProjectId, {
      name: epName.trim(),
      due: epDue.trim(),
      owner: ow,
      departmentId: epDeptId,
      participants: parseParticipantNames(epParticipantsRaw),
    })
    setEditProjectId(null)
  }

  const deptLabel = (id: string | null) =>
    id == null
      ? null
      : data.departments.find((d) => d.id === id)?.name ?? null

  return (
    <>
      <ScopeFilterBar
        departments={data.departments}
        value={scopeFilter}
        onChange={setScopeFilter}
      />
      <div className="tasks-board-toolbar">
        <label className="weekly-commit-filter">
          <input
            type="checkbox"
            checked={onlyWeeklyCommit}
            onChange={(e) => setOnlyWeeklyCommit(e.target.checked)}
          />
          只看本週承諾
        </label>
      </div>
      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 進行中</div>
            <span className="card-badge">{activeF.length}</span>
          </div>
          <div className="card-body">
            <TaskRows
              items={activeF}
              section="active"
              projectLinkOptions={allProjectOptions}
            />
            <div className="add-task-row">
              <DepartmentSelect
                departments={data.departments}
                value={deptActive}
                onChange={(id) => {
                  setDeptActive(id)
                  setAssigneeActive('')
                }}
                className="input"
                includePersonal={false}
              />
              <RosterMemberSelect
                roster={data.teamRoster}
                departmentId={deptActive}
                value={assigneeActive}
                onChange={setAssigneeActive}
                className="input task-assignee-input"
                allowEmpty
              />
              <input
                className="input"
                placeholder="新增任務…"
                value={activeIn}
                onChange={(e) => setActiveIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const ok = addTask('active', activeIn, {
                      departmentId: deptActive,
                      assignee: assigneeActive,
                    })
                    if (ok) setActiveIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const ok = addTask('active', activeIn, {
                    departmentId: deptActive,
                    assignee: assigneeActive,
                  })
                  if (ok) setActiveIn('')
                }}
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">💡 日後再說</div>
            <span className="card-badge">{somedayF.length}</span>
          </div>
          <div className="card-body">
            <TaskRows
              items={somedayF}
              section="someday"
              projectLinkOptions={allProjectOptions}
            />
            <div className="add-task-row">
              <DepartmentSelect
                departments={data.departments}
                value={deptSomeday}
                onChange={(id) => {
                  setDeptSomeday(id)
                  setAssigneeSomeday('')
                }}
                className="input"
                includePersonal={false}
              />
              <RosterMemberSelect
                roster={data.teamRoster}
                departmentId={deptSomeday}
                value={assigneeSomeday}
                onChange={setAssigneeSomeday}
                className="input task-assignee-input"
                allowEmpty
              />
              <input
                className="input"
                placeholder="日後再議的事…"
                value={somedayIn}
                onChange={(e) => setSomedayIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const ok = addTask('someday', somedayIn, {
                      departmentId: deptSomeday,
                      assignee: assigneeSomeday,
                    })
                    if (ok) setSomedayIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const ok = addTask('someday', somedayIn, {
                    departmentId: deptSomeday,
                    assignee: assigneeSomeday,
                  })
                  if (ok) setSomedayIn('')
                }}
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">✅ 已完成</div>
            <span className="card-badge">{doneF.length}</span>
          </div>
          <div className="card-body">
            <TaskRows
              items={doneF}
              section="done"
              showDepartmentPicker={false}
            />
            <button
              type="button"
              className="btn"
              style={{ marginTop: 12, width: '100%', fontSize: 12 }}
              onClick={() => {
                if (window.confirm('確定清除所有已完成的任務？')) clearDone()
              }}
            >
              清除已完成
            </button>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">📈 專案進度</div>
          <button
            type="button"
            className="card-action"
            onClick={() => setProjOpen(true)}
          >
            ＋ 新增專案
          </button>
        </div>
        <div className="card-body">
          {data.projects.map((p) => {
            const pct = p.progress || 0
            const barCls = pct >= 100 ? 'green' : pct >= 60 ? 'blue' : ''
            const dname = deptLabel(p.departmentId)
            return (
              <div key={p.id} className="project-item">
                <div className="project-top">
                  <div className="project-name">{p.name}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    {dname ? (
                      <span className="tag tag-scope-dept">{dname}</span>
                    ) : null}
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => openEditProject(p.id)}
                    >
                      編輯
                    </button>
                    <div className="project-percent">{pct}%</div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) =>
                        updateSmallProjectProgress(p.id, Number(e.target.value))
                      }
                      style={{
                        width: 80,
                        accentColor: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeSmallProject(p.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-bar ${barCls}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="project-meta">
                  {p.due ? <span>📅 {p.due}</span> : null}
                  {p.owner ? <span>👤 {p.owner}</span> : null}
                </div>
                {p.participants.length ? (
                  <div className="proj-participants" style={{ marginTop: 6 }}>
                    參與：{p.participants.join('、')}
                  </div>
                ) : null}
              </div>
            )
          })}
          {!data.projects.length ? (
            <div className="empty">
              <div className="empty-icon">📁</div>
              尚未新增專案
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={projOpen}
        title="新增專案"
        onClose={() => setProjOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setProjOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-tasks-new-project"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-tasks-new-project" onSubmit={submitProject}>
        <div className="modal-field">
          <label htmlFor="sp-name">專案名稱</label>
          <input
            id="sp-name"
            className="input"
            style={{ width: '100%' }}
            value={pName}
            onChange={(e) => setPName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-first-task">第一個任務（建議填寫；專案應至少有一項任務）</label>
          <input
            id="sp-first-task"
            className="input"
            style={{ width: '100%' }}
            value={pFirstTask}
            onChange={(e) => setPFirstTask(e.target.value)}
            placeholder="可留空，之後在任務看板掛上專案"
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-first-sec">第一筆任務區塊</label>
          <select
            id="sp-first-sec"
            className="input"
            style={{ width: '100%' }}
            value={pFirstSection}
            onChange={(e) =>
              setPFirstSection(e.target.value as 'today' | 'active' | 'someday')
            }
          >
            <option value="today">今日</option>
            <option value="active">進行中</option>
            <option value="someday">日後再說</option>
          </select>
        </div>
        <div className="modal-field">
          <label htmlFor="sp-dept">歸屬部門（與 KPI、追蹤總覽連動）</label>
          <DepartmentSelect
            id="sp-dept"
            departments={data.departments}
            value={pDeptId}
            onChange={(id) => {
              setPDeptId(id)
              setPOwner('')
            }}
            className="input"
            includePersonal={false}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-part">參與人員（逗號或頓號分隔）</label>
          <textarea
            id="sp-part"
            className="review-input"
            style={{ minHeight: 72 }}
            value={pParticipantsRaw}
            onChange={(e) => setPParticipantsRaw(e.target.value)}
            placeholder="例：王小明、李大華、張經理"
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-due">截止日（可留空）</label>
          <DateTextAndPicker
            id="sp-due"
            value={pDue}
            onChange={setPDue}
            className="input"
            style={{ width: '100%', maxWidth: 'none' }}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-owner">專案負責人（選填，須為該部門名冊）</label>
          <RosterMemberSelect
            id="sp-owner"
            roster={data.teamRoster}
            departmentId={pDeptId}
            value={pOwner}
            onChange={setPOwner}
            className="input"
            style={{ width: '100%' }}
            allowEmpty
          />
        </div>
        </form>
      </Modal>

      <Modal
        open={editProjectId !== null}
        title="編輯專案"
        onClose={() => setEditProjectId(null)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setEditProjectId(null)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-tasks-edit-project"
              className="btn btn-primary"
            >
              儲存
            </button>
          </div>
        }
      >
        <form id="wm-form-tasks-edit-project" onSubmit={saveEditProject}>
        <div className="modal-field">
          <label>專案名稱</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={epName}
            onChange={(e) => setEpName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>歸屬部門</label>
          <DepartmentSelect
            departments={data.departments}
            value={epDeptId}
            onChange={(id) => {
              setEpDeptId(id)
              setEpOwner('')
            }}
            className="input"
            includePersonal={false}
          />
        </div>
        <div className="modal-field">
          <label>參與人員（逗號或頓號分隔）</label>
          <textarea
            className="review-input"
            style={{ minHeight: 72 }}
            value={epParticipantsRaw}
            onChange={(e) => setEpParticipantsRaw(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>截止日</label>
          <DateTextAndPicker
            value={epDue}
            onChange={setEpDue}
            className="input"
            style={{ width: '100%', maxWidth: 'none' }}
          />
        </div>
        <div className="modal-field">
          <label>負責人（名冊）</label>
          <RosterMemberSelect
            roster={data.teamRoster}
            departmentId={epDeptId}
            value={epOwner}
            onChange={setEpOwner}
            className="input"
            style={{ width: '100%' }}
            allowEmpty
          />
        </div>
        </form>
      </Modal>
    </>
  )
}
