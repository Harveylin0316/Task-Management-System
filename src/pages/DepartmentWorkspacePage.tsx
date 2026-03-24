import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type FormEvent,
} from 'react'
import { useDashboard } from '../context/DashboardContext'
import { TaskRows } from '../components/TaskRows'
import { Modal } from '../components/Modal'
import { parseParticipantNames } from '../lib/parseParticipants'
import { rosterDatalistIdForDepartment } from '../lib/rosterDatalist'
import type { SmallProject, TaskSection } from '../lib/types'

const SECTION_LABEL: Record<'today' | 'active' | 'someday', string> = {
  today: '今日',
  active: '進行中',
  someday: '日後再說',
}

function DeptProjectCard({
  project,
  departmentId,
  projectOptions,
  rosterListId,
}: {
  project: SmallProject
  departmentId: string
  projectOptions: { id: string; name: string }[]
  rosterListId: string
}) {
  const editFormId = `wm-deptws-proj-edit-${project.id}`
  const {
    data,
    addTask,
    removeSmallProject,
    updateSmallProject,
    updateSmallProjectProgress,
    toast,
  } = useDashboard()
  const [sec, setSec] = useState<'today' | 'active' | 'someday'>('active')
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [epName, setEpName] = useState(project.name)
  const [epDue, setEpDue] = useState(project.due)
  const [epOwner, setEpOwner] = useState(project.owner)
  const [epParticipantsRaw, setEpParticipantsRaw] = useState(
    project.participants.join(', '),
  )

  useEffect(() => {
    if (!editOpen) {
      setEpName(project.name)
      setEpDue(project.due)
      setEpOwner(project.owner)
      setEpParticipantsRaw(project.participants.join(', '))
    }
  }, [project, editOpen])

  const byProject = useCallback(
    (s: TaskSection) =>
      data[s].filter((t) => t.smallProjectId === project.id),
    [data.today, data.active, data.someday, project.id],
  )

  const taskCount =
    byProject('today').length +
    byProject('active').length +
    byProject('someday').length

  const submitTask = () => {
    const t = title.trim()
    if (!t) {
      toast('請輸入任務內容')
      return
    }
    addTask(sec, t, {
      departmentId,
      assignee: assignee || undefined,
      smallProjectId: project.id,
    })
    setTitle('')
  }

  return (
    <div className="card dept-ws-project-card">
      <div className="card-header">
        <div className="card-title">📁 {project.name}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={() => setEditOpen(true)}
          >
            編輯專案
          </button>
          <button
            type="button"
            className="icon-btn"
            title="刪除專案（任務改為不屬專案）"
            onClick={() => {
              if (
                window.confirm(
                  `刪除專案「${project.name}」？任務將保留並改為「不屬專案」。`,
                )
              ) {
                removeSmallProject(project.id)
              }
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="project-meta" style={{ marginBottom: 12 }}>
          {project.due ? <span>📅 {project.due}</span> : null}
          {project.owner ? <span>👤 {project.owner}</span> : null}
          <span>
            進度 {project.progress ?? 0}%
            <input
              type="range"
              min={0}
              max={100}
              value={project.progress || 0}
              onChange={(e) =>
                updateSmallProjectProgress(project.id, Number(e.target.value))
              }
              style={{
                width: 100,
                marginLeft: 8,
                verticalAlign: 'middle',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
              aria-label="專案進度"
            />
          </span>
        </div>
        {project.participants.length ? (
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            參與：{project.participants.join('、')}
          </div>
        ) : null}
        {taskCount === 0 ? (
          <p className="dept-ws-hint">
            專案應至少有一項任務，請於下方新增第一筆。
          </p>
        ) : null}
        {(['today', 'active', 'someday'] as const).map((s) => {
          const items = byProject(s)
          return (
            <div key={s} className="dept-ws-task-block">
              <div className="dept-ws-subtitle">
                {SECTION_LABEL[s]}（{items.length}）
              </div>
              {items.length ? (
                <TaskRows
                  items={items}
                  section={s}
                  lockDepartment
                  projectLinkOptions={projectOptions}
                  showInlineTitleEdit
                />
              ) : (
                <p className="text-muted" style={{ fontSize: 12, margin: '4px 0' }}>
                  尚無
                </p>
              )}
            </div>
          )
        })}
        <div className="add-task-row" style={{ marginTop: 10 }}>
          <select
            className="input"
            style={{ maxWidth: 100 }}
            value={sec}
            onChange={(e) =>
              setSec(e.target.value as 'today' | 'active' | 'someday')
            }
            aria-label="任務區塊"
          >
            <option value="today">今日</option>
            <option value="active">進行中</option>
            <option value="someday">日後</option>
          </select>
          <input
            className="input task-assignee-input"
            placeholder="負責人"
            list={rosterListId}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
          <input
            className="input"
            placeholder="新增此專案任務…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTask()
            }}
          />
          <button type="button" className="btn btn-primary" onClick={submitTask}>
            新增
          </button>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="編輯專案"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setEditOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form={editFormId}
              className="btn btn-primary"
            >
              儲存
            </button>
          </div>
        }
      >
        <form
          id={editFormId}
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            updateSmallProject(project.id, {
              name: epName.trim(),
              due: epDue.trim(),
              owner: epOwner.trim(),
              participants: parseParticipantNames(epParticipantsRaw),
            })
            setEditOpen(false)
            toast('專案已更新')
          }}
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
          <div className="modal-field">
            <label>參與人員（逗號分隔）</label>
            <textarea
              className="review-input"
              style={{ minHeight: 72 }}
              value={epParticipantsRaw}
              onChange={(e) => setEpParticipantsRaw(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

export function DepartmentWorkspacePage() {
  const {
    data,
    addTask,
    addSmallProject,
    updateDepartmentKpi,
    toast,
    updateUiPrefs,
  } = useDashboard()

  const [deptId, setDeptId] = useState<string | null>(null)
  const [looseTodayIn, setLooseTodayIn] = useState('')
  const [looseActiveIn, setLooseActiveIn] = useState('')
  const [looseSomedayIn, setLooseSomedayIn] = useState('')
  const [looseAssigneeToday, setLooseAssigneeToday] = useState('')
  const [looseAssigneeActive, setLooseAssigneeActive] = useState('')
  const [looseAssigneeSomeday, setLooseAssigneeSomeday] = useState('')

  const [projOpen, setProjOpen] = useState(false)
  const [pName, setPName] = useState('')
  const [pFirstTask, setPFirstTask] = useState('')
  const [pFirstSection, setPFirstSection] = useState<'today' | 'active' | 'someday'>(
    'active',
  )
  const [pDue, setPDue] = useState('')
  const [pOwner, setPOwner] = useState('')
  const [pParticipantsRaw, setPParticipantsRaw] = useState('')

  useEffect(() => {
    if (!data.departments.length) {
      setDeptId(null)
      return
    }
    setDeptId((cur) => {
      if (cur && data.departments.some((d) => d.id === cur)) return cur
      const saved = data.ui.deptWorkspaceFocusDeptId
      if (
        typeof saved === 'string' &&
        data.departments.some((d) => d.id === saved)
      ) {
        return saved
      }
      return data.departments[0].id
    })
  }, [data.departments, data.ui.deptWorkspaceFocusDeptId])

  const persistDept = (id: string | null) => {
    setDeptId(id)
    updateUiPrefs({
      deptWorkspaceFocusDeptId: id === null ? null : id,
    })
  }

  const dept = deptId
    ? data.departments.find((d) => d.id === deptId) ?? null
    : null

  const rosterListId = rosterDatalistIdForDepartment(deptId, data.teamRoster)

  const projectsHere = useMemo(
    () => data.projects.filter((p) => p.departmentId === deptId),
    [data.projects, deptId],
  )

  const projectOptions = useMemo(
    () => projectsHere.map((p) => ({ id: p.id, name: p.name })),
    [projectsHere],
  )

  const inDeptLoose = (t: { departmentId: string | null; smallProjectId?: string }) =>
    t.departmentId === deptId && !t.smallProjectId

  const looseToday = useMemo(
    () => data.today.filter(inDeptLoose),
    [data.today, deptId],
  )
  const looseActive = useMemo(
    () => data.active.filter(inDeptLoose),
    [data.active, deptId],
  )
  const looseSomeday = useMemo(
    () => data.someday.filter(inDeptLoose),
    [data.someday, deptId],
  )
  const doneDept = useMemo(
    () => data.done.filter((t) => t.departmentId === deptId),
    [data.done, deptId],
  )

  const submitNewProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = pName.trim()
    const ft = pFirstTask.trim()
    if (!n) {
      toast('請填專案名稱')
      return
    }
    if (!ft) {
      toast('請填「第一個任務」：專案應至少有一項任務')
      return
    }
    addSmallProject({
      name: n,
      due: pDue,
      owner: pOwner,
      departmentId: deptId,
      participants: parseParticipantNames(pParticipantsRaw),
      initialTaskTitle: ft,
      initialTaskSection: pFirstSection,
    })
    setPName('')
    setPFirstTask('')
    setPDue('')
    setPOwner('')
    setPParticipantsRaw('')
    setProjOpen(false)
    toast('專案與第一筆任務已建立')
  }

  const setDefaultTabDeptWs = () => {
    updateUiPrefs({ defaultTab: 'deptws' })
    toast(
      '已同步至雲端：可將網址 …/#/deptws 存為書籤；從首頁 #/ 進入時也會開啟「部門工作台」。',
    )
  }

  const clearDefaultTab = () => {
    updateUiPrefs({ defaultTab: undefined })
    toast('已還原並同步至雲端；從首頁 #/ 進入時會開啟「今日」。')
  }

  if (!data.departments.length) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty">
            <div className="empty-icon">🏢</div>
            尚未建立部門。請至「部門與 KPI 管理」新增部門。
          </div>
        </div>
      </div>
    )
  }

  if (!deptId || !dept) {
    return null
  }

  return (
    <>
      <div className="dept-ws-toolbar">
        <div className="dept-ws-toolbar-main">
          <h1 className="dept-ws-heading">部門工作台</h1>
          <select
            className="input dept-ws-dept-select"
            value={deptId}
            onChange={(e) => persistDept(e.target.value)}
            aria-label="選擇部門"
          >
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <span className="text-muted" style={{ fontSize: 12 }}>
            會記住您選的部門（僅此瀏覽器）。
          </span>
        </div>
        <div className="dept-ws-toolbar-actions">
          <button type="button" className="btn" onClick={setDefaultTabDeptWs}>
            設為進入預設畫面
          </button>
          <button type="button" className="btn" onClick={clearDefaultTab}>
            還原預設為今日
          </button>
        </div>
      </div>

      <p className="dept-ws-lede">
        檢視與編輯 <strong>{dept.name}</strong> 的任務與小型專案。任務可不掛專案；專案內請至少保留一項任務（新建專案時必填第一筆）。
      </p>

      <div className="dept-ws-kpi-strip card">
        <div className="card-header">
          <div className="card-title">📊 {dept.name} KPI</div>
        </div>
        <div className="card-body">
          {!dept.kpis.length ? (
            <p className="text-muted" style={{ fontSize: 12 }}>
              尚無 KPI。至「部門與 KPI 管理」新增。
            </p>
          ) : (
            <ul className="kpi-inline-list">
              {dept.kpis.map((k) => (
                <li key={k.id} className="kpi-inline-item">
                  <div className="kpi-inline-title">{k.name}</div>
                  <div className="kpi-inline-meta">目標：{k.target || '—'}</div>
                  <label className="kpi-inline-label">現況</label>
                  <input
                    className="input"
                    style={{ width: '100%', marginBottom: 4 }}
                    defaultValue={k.current}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v !== k.current) {
                        updateDepartmentKpi(dept.id, k.id, { current: v })
                        toast('KPI 現況已更新')
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dept-ws-two-col">
        <div className="dept-ws-col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">📋 部門任務（不屬於專案）</div>
            </div>
            <div className="card-body">
              {(
                [
                  ['today', looseToday, looseTodayIn, setLooseTodayIn, looseAssigneeToday, setLooseAssigneeToday] as const,
                  ['active', looseActive, looseActiveIn, setLooseActiveIn, looseAssigneeActive, setLooseAssigneeActive] as const,
                  ['someday', looseSomeday, looseSomedayIn, setLooseSomedayIn, looseAssigneeSomeday, setLooseAssigneeSomeday] as const,
                ] as const
              ).map(
                ([
                  sec,
                  items,
                  inputVal,
                  setInputVal,
                  assigneeVal,
                  setAssigneeVal,
                ]) => (
                  <div key={sec} className="dept-ws-task-block">
                    <div className="dept-ws-subtitle">{SECTION_LABEL[sec]}</div>
                    {items.length ? (
                      <TaskRows
                        items={items}
                        section={sec}
                        lockDepartment
                        projectLinkOptions={projectOptions}
                        showInlineTitleEdit
                      />
                    ) : (
                      <p className="text-muted" style={{ fontSize: 12 }}>
                        尚無任務
                      </p>
                    )}
                    <div className="add-task-row">
                      <input
                        className="input task-assignee-input"
                        placeholder="負責人"
                        list={rosterListId}
                        value={assigneeVal}
                        onChange={(e) => setAssigneeVal(e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder={`加入${SECTION_LABEL[sec]}…`}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const t = inputVal.trim()
                            if (t) {
                              addTask(sec, t, {
                                departmentId: deptId,
                                assignee: assigneeVal || undefined,
                              })
                              setInputVal('')
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          const t = inputVal.trim()
                          if (!t) return
                          addTask(sec, t, {
                            departmentId: deptId,
                            assignee: assigneeVal || undefined,
                          })
                          setInputVal('')
                        }}
                      >
                        新增
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">✅ 本部門已完成</div>
              <span className="card-badge">{doneDept.length}</span>
            </div>
            <div className="card-body">
              {doneDept.length ? (
                <TaskRows
                  items={doneDept}
                  section="done"
                  showDepartmentPicker={false}
                />
              ) : (
                <p className="text-muted" style={{ fontSize: 12 }}>尚無</p>
              )}
            </div>
          </div>
        </div>

        <div className="dept-ws-col">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <h2 className="dept-ws-section-title">專案管理</h2>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setProjOpen(true)}
            >
              ＋ 新增專案
            </button>
          </div>
          {!projectsHere.length ? (
            <div className="card">
              <div className="card-body">
                <div className="empty">
                  <div className="empty-icon">📁</div>
                  此部門尚無專案。點「新增專案」建立（需一併建立第一筆任務）。
                </div>
              </div>
            </div>
          ) : (
            projectsHere.map((p) => (
              <DeptProjectCard
                key={p.id}
                project={p}
                departmentId={deptId}
                projectOptions={projectOptions}
                rosterListId={rosterListId}
              />
            ))
          )}
        </div>
      </div>

      <Modal
        open={projOpen}
        title="新增部門專案"
        onClose={() => setProjOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setProjOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-deptws-new-project"
              className="btn btn-primary"
            >
              建立
            </button>
          </div>
        }
      >
        <form id="wm-form-deptws-new-project" onSubmit={submitNewProject}>
        <p className="modal-note" style={{ marginBottom: 12 }}>
          專案會自動歸於目前選擇的部門（{dept.name}），並<strong>必須</strong>建立第一筆任務。
        </p>
        <div className="modal-field">
          <label>專案名稱</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={pName}
            onChange={(e) => setPName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>第一個任務（必填）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={pFirstTask}
            onChange={(e) => setPFirstTask(e.target.value)}
            placeholder="專案至少要有一項任務"
          />
        </div>
        <div className="modal-field">
          <label>第一筆任務放在</label>
          <select
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
          <label>專案截止日（可留空）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={pDue}
            onChange={(e) => setPDue(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>專案負責人（可留空）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={pOwner}
            onChange={(e) => setPOwner(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>參與人員（逗號分隔，可留空）</label>
          <textarea
            className="review-input"
            style={{ minHeight: 72 }}
            value={pParticipantsRaw}
            onChange={(e) => setPParticipantsRaw(e.target.value)}
          />
        </div>
        </form>
      </Modal>
    </>
  )
}
