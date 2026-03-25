import { useMemo, useState, type FormEvent } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { Modal } from '../components/Modal'
import { TaskRows } from '../components/TaskRows'
import { ScopeFilterBar } from '../components/ScopeFilterBar'
import { DateTextAndPicker } from '../components/DateTextAndPicker'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { RosterMemberSelect } from '../components/RosterMemberSelect'
import { parseParticipantNames } from '../lib/parseParticipants'
import {
  parseTasksFromPlainText,
  type TextImportParsedRow,
} from '../lib/parseTasksFromText'
import { isAssigneeInDepartmentRoster } from '../lib/taskAssignment'
import { taskMatchesScope, type TaskScopeFilter } from '../lib/taskScope'

const SECTION_IMPORT_LABEL: Record<TextImportParsedRow['section'], string> = {
  today: '今日',
  active: '進行中',
  someday: '日後再說',
}

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
    importTasksFromParsedRows,
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
  const [textImportRaw, setTextImportRaw] = useState('')
  const [textImportDept, setTextImportDept] = useState<string | null>(null)
  const [textImportSection, setTextImportSection] = useState<
    'today' | 'active' | 'someday'
  >('active')
  const [textImportPreview, setTextImportPreview] = useState<{
    rows: TextImportParsedRow[]
    skipped: { lineNumber: number; raw: string; reason: string }[]
  } | null>(null)

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

  const runTextImportPreview = () => {
    const t = textImportRaw.trim()
    if (!t) {
      toast('請貼上文字或選擇 .txt 檔')
      return
    }
    const { rows, skipped } = parseTasksFromPlainText(t, {
      defaultDepartmentId: textImportDept,
      defaultSection: textImportSection,
      departments: data.departments,
      roster: data.teamRoster,
    })
    setTextImportPreview({ rows, skipped })
    if (!rows.length && skipped.length) {
      toast(`無法解析任何任務（${skipped.length} 行略過）`)
    } else if (rows.length) {
      toast(`已解析 ${rows.length} 筆，請確認後加入`)
    } else {
      toast('沒有可匯入的列')
    }
  }

  const confirmTextImport = () => {
    if (!textImportPreview?.rows.length) {
      toast('請先按「預覽解析」')
      return
    }
    importTasksFromParsedRows(textImportPreview.rows)
    setTextImportRaw('')
    setTextImportPreview(null)
  }

  const onPickTextFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTextImportRaw(String(reader.result ?? ''))
      setTextImportPreview(null)
      toast(`已讀取 ${file.name}`)
    }
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <>
      <ScopeFilterBar
        departments={data.departments}
        value={scopeFilter}
        onChange={setScopeFilter}
      />

      <div className="card section-gap text-import-card">
        <div className="card-header">
          <div className="card-title">📝 從文字批次建立任務</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            貼上會議記錄、備忘或清單文字，系統會依格式與名冊盡量辨識{' '}
            <strong>標題</strong>、<strong>負責人</strong>、<strong>到期日</strong>、
            <strong>部門</strong>。建議先設定預設部門與區塊，再按「預覽解析」確認後加入。
          </p>
          <div className="text-import-toolbar">
            <DepartmentSelect
              departments={data.departments}
              value={textImportDept}
              onChange={setTextImportDept}
              className="input"
              includePersonal={false}
              emptyLabel="預設部門（單欄智慧解析必填）"
            />
            <select
              className="input"
              value={textImportSection}
              onChange={(e) =>
                setTextImportSection(
                  e.target.value as 'today' | 'active' | 'someday',
                )
              }
              aria-label="預設任務區塊"
            >
              <option value="today">預設區塊：今日</option>
              <option value="active">預設區塊：進行中</option>
              <option value="someday">預設區塊：日後再說</option>
            </select>
            <label className="btn text-import-file-btn">
              選擇 .txt
              <input
                type="file"
                accept=".txt,text/plain"
                hidden
                onChange={(e) => {
                  onPickTextFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={runTextImportPreview}
            >
              預覽解析
            </button>
            <button
              type="button"
              className="btn"
              disabled={!textImportPreview?.rows.length}
              onClick={confirmTextImport}
            >
              確認加入任務
            </button>
          </div>
          <textarea
            className="review-input text-import-textarea"
            placeholder={`範例（Tab 或 | 分隔）：\n完成簡報 | 王小明 | 2026-04-01 | 行銷\n[someday] 研究競品 張三\n單欄智慧（需選預設部門）：\n李四 週五前交企劃書 2026-03-28`}
            value={textImportRaw}
            onChange={(e) => {
              setTextImportRaw(e.target.value)
              setTextImportPreview(null)
            }}
            rows={10}
            spellCheck={false}
          />
          <details className="text-import-hint">
            <summary>格式說明</summary>
            <ul>
              <li>
                <strong>多欄</strong>：每行{' '}
                <code>標題 | 負責人 | 到期 | 部門</code>（Tab 亦可），後三欄可空；部門空則用預設部門。
              </li>
              <li>
                <strong>兩欄</strong>：若第二欄像日期 → 當作到期日；否則當負責人。
              </li>
              <li>
                <strong>單欄</strong>：須選「預設部門」— 會從文中找日期、並在該部門名冊中比對姓名為負責人。
              </li>
              <li>
                行首可加 <code>[today]</code> / <code>[active]</code> /{' '}
                <code>[someday]</code> 或 <code>今日：</code> 等指定區塊。
              </li>
              <li>以 <code>#</code> 或 <code>//</code> 開頭的行會略過。</li>
            </ul>
          </details>
          {textImportPreview ? (
            <div className="text-import-preview">
              {textImportPreview.rows.length ? (
                <>
                  <div className="text-import-preview-title">
                    將加入 {textImportPreview.rows.length} 筆
                  </div>
                  <div className="text-import-table-wrap">
                    <table className="text-import-table">
                      <thead>
                        <tr>
                          <th>區塊</th>
                          <th>標題</th>
                          <th>部門</th>
                          <th>負責人</th>
                          <th>到期</th>
                          <th>備註</th>
                        </tr>
                      </thead>
                      <tbody>
                        {textImportPreview.rows.map((r, i) => (
                          <tr key={`${r.lineNumber}-${i}`}>
                            <td>{SECTION_IMPORT_LABEL[r.section]}</td>
                            <td>{r.title}</td>
                            <td>{deptLabel(r.departmentId) ?? '—'}</td>
                            <td>{r.assignee ?? '—'}</td>
                            <td>{r.due ?? '—'}</td>
                            <td className="text-muted">
                              {r.warnings.length
                                ? r.warnings.join('；')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
              {textImportPreview.skipped.length ? (
                <div className="text-import-skipped">
                  <strong>略過 {textImportPreview.skipped.length} 行：</strong>
                  <ul>
                    {textImportPreview.skipped.map((s) => (
                      <li key={s.lineNumber}>
                        第 {s.lineNumber} 行：{s.reason}
                        <code className="text-import-skip-raw">{s.raw}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

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
