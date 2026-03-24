import { useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { Modal } from '../components/Modal'
import { TaskRows } from '../components/TaskRows'
import { ScopeFilterBar } from '../components/ScopeFilterBar'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { parseParticipantNames } from '../lib/parseParticipants'
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

  const activeF = useMemo(
    () => data.active.filter((t) => taskMatchesScope(t, scopeFilter)),
    [data.active, scopeFilter],
  )
  const somedayF = useMemo(
    () => data.someday.filter((t) => taskMatchesScope(t, scopeFilter)),
    [data.someday, scopeFilter],
  )
  const doneF = useMemo(
    () => data.done.filter((t) => taskMatchesScope(t, scopeFilter)),
    [data.done, scopeFilter],
  )

  const submitProject = () => {
    addSmallProject({
      name: pName,
      due: pDue,
      owner: pOwner,
      departmentId: pDeptId,
      participants: parseParticipantNames(pParticipantsRaw),
    })
    setPName('')
    setPDue('')
    setPOwner('')
    setPDeptId(null)
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

  const saveEditProject = () => {
    if (!editProjectId) return
    updateSmallProject(editProjectId, {
      name: epName.trim(),
      due: epDue.trim(),
      owner: epOwner.trim(),
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
      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 進行中</div>
            <span className="card-badge">{activeF.length}</span>
          </div>
          <div className="card-body">
            <TaskRows items={activeF} section="active" />
            <div className="add-task-row">
              <DepartmentSelect
                departments={data.departments}
                value={deptActive}
                onChange={setDeptActive}
                className="input"
              />
              <input
                className="input task-assignee-input"
                placeholder="負責人"
                value={assigneeActive}
                onChange={(e) => setAssigneeActive(e.target.value)}
              />
              <input
                className="input"
                placeholder="新增任務…"
                value={activeIn}
                onChange={(e) => setActiveIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask('active', activeIn, {
                      departmentId: deptActive,
                      assignee: assigneeActive,
                    })
                    setActiveIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addTask('active', activeIn, {
                    departmentId: deptActive,
                    assignee: assigneeActive,
                  })
                  setActiveIn('')
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
            <TaskRows items={somedayF} section="someday" />
            <div className="add-task-row">
              <DepartmentSelect
                departments={data.departments}
                value={deptSomeday}
                onChange={setDeptSomeday}
                className="input"
              />
              <input
                className="input task-assignee-input"
                placeholder="負責人"
                value={assigneeSomeday}
                onChange={(e) => setAssigneeSomeday(e.target.value)}
              />
              <input
                className="input"
                placeholder="日後再議的事…"
                value={somedayIn}
                onChange={(e) => setSomedayIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask('someday', somedayIn, {
                      departmentId: deptSomeday,
                      assignee: assigneeSomeday,
                    })
                    setSomedayIn('')
                  }
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  addTask('someday', somedayIn, {
                    departmentId: deptSomeday,
                    assignee: assigneeSomeday,
                  })
                  setSomedayIn('')
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
              type="button"
              className="btn btn-primary"
              onClick={submitProject}
            >
              新增
            </button>
          </div>
        }
      >
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
          <label htmlFor="sp-dept">歸屬部門（與 KPI、追蹤總覽連動）</label>
          <DepartmentSelect
            id="sp-dept"
            departments={data.departments}
            value={pDeptId}
            onChange={setPDeptId}
            className="input"
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
          <input
            id="sp-due"
            className="input"
            style={{ width: '100%' }}
            value={pDue}
            onChange={(e) => setPDue(e.target.value)}
            placeholder="例：2026/04/30"
          />
        </div>
        <div className="modal-field">
          <label htmlFor="sp-owner">負責人（可留空）</label>
          <input
            id="sp-owner"
            className="input"
            style={{ width: '100%' }}
            value={pOwner}
            onChange={(e) => setPOwner(e.target.value)}
          />
        </div>
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
              type="button"
              className="btn btn-primary"
              onClick={saveEditProject}
            >
              儲存
            </button>
          </div>
        }
      >
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
            onChange={setEpDeptId}
            className="input"
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
          <input
            className="input"
            style={{ width: '100%' }}
            value={epDue}
            onChange={(e) => setEpDue(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>負責人</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={epOwner}
            onChange={(e) => setEpOwner(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}
