import { useState, type FormEvent } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { calcBigProjectProgress } from '../lib/progress'
import type { BigProjectStatus } from '../lib/types'
import { Modal } from '../components/Modal'
import { DateTextAndPicker } from '../components/DateTextAndPicker'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { RosterMemberSelect } from '../components/RosterMemberSelect'
import { isAssigneeInDepartmentRoster } from '../lib/taskAssignment'

const AVATAR_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

function avatarColor(name: string): string {
  let n = 0
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

const STATUS_LABEL: Record<BigProjectStatus, string> = {
  active: '進行中',
  'on-track': '順利進行',
  'at-risk': '有風險',
  blocked: '受阻',
  done: '已完成',
}

export function ProjectsPage() {
  const {
    data,
    selectedBigProjectIdx,
    setSelectedBigProjectIdx,
    addBigProject,
    removeBigProject,
    updateBigProjectStatus,
    updateBigProjectProgress,
    updateBigProjectDepartment,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    addTeamMember,
    removeTeamMember,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    addRisk,
    removeRisk,
    toast,
  } = useDashboard()

  const bp = data.bigProjects || []
  const proj = bp[selectedBigProjectIdx]
  const projectId = proj?.id

  const [bigOpen, setBigOpen] = useState(false)
  const [bfName, setBfName] = useState('')
  const [bfGoal, setBfGoal] = useState('')
  const [bfDue, setBfDue] = useState('')
  const [bfPm, setBfPm] = useState('')
  const [bfDesc, setBfDesc] = useState('')
  const [bfDeptId, setBfDeptId] = useState<string | null>(null)

  const [msOpen, setMsOpen] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msDate, setMsDate] = useState('')
  const [msOwner, setMsOwner] = useState('')

  const [tmOpen, setTmOpen] = useState(false)
  const [tmName, setTmName] = useState('')
  const [tmRole, setTmRole] = useState('')
  const [tmTasks, setTmTasks] = useState('')

  const [stOpen, setStOpen] = useState(false)
  const [stTitle, setStTitle] = useState('')
  const [stOwner, setStOwner] = useState('')
  const [stDue, setStDue] = useState('')

  const [rkOpen, setRkOpen] = useState(false)
  const [rkTitle, setRkTitle] = useState('')
  const [rkLevel, setRkLevel] = useState<'high' | 'mid' | 'low'>('mid')
  const [rkDesc, setRkDesc] = useState('')
  const [rkOwner, setRkOwner] = useState('')

  const now = new Date()
  let msDone = 0
  let msDueSoon = 0
  let highRisks = 0
  bp.forEach((p) => {
    ;(p.milestones || []).forEach((m) => {
      if (m.done) msDone++
      else {
        const d = new Date(m.date)
        if (!Number.isNaN(d.getTime()) && (d.getTime() - now.getTime()) / 86400000 <= 7) {
          msDueSoon++
        }
      }
    })
    ;(p.risks || []).forEach((r) => {
      if (r.level === 'high') highRisks++
    })
  })

  const submitBig = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (bfDeptId == null) {
      toast('請選擇歸屬部門')
      return
    }
    const pm = bfPm.trim()
    if (!pm) {
      toast('請選擇 PM（該部門名冊）')
      return
    }
    if (!isAssigneeInDepartmentRoster(data.teamRoster, bfDeptId, pm)) {
      toast('PM 須為該部門名冊成員')
      return
    }
    addBigProject({
      name: bfName,
      goal: bfGoal,
      due: bfDue,
      pm,
      desc: bfDesc,
      departmentId: bfDeptId,
    })
    setBfName('')
    setBfGoal('')
    setBfDue('')
    setBfPm('')
    setBfDesc('')
    setBfDeptId(null)
    setBigOpen(false)
  }

  const submitMilestoneModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!projectId) return
    const mo = msOwner.trim()
    const pd = proj?.departmentId ?? null
    if (
      pd &&
      mo &&
      !isAssigneeInDepartmentRoster(data.teamRoster, pd, mo)
    ) {
      toast('負責人須為專案部門名冊成員')
      return
    }
    addMilestone(projectId, {
      title: msTitle,
      date: msDate,
      owner: mo,
    })
    setMsTitle('')
    setMsDate('')
    setMsOwner('')
    setMsOpen(false)
  }

  const submitTeamMemberModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!projectId) return
    addTeamMember(projectId, {
      name: tmName,
      role: tmRole,
      tasks: tmTasks,
    })
    setTmName('')
    setTmRole('')
    setTmTasks('')
    setTmOpen(false)
  }

  const submitSubtaskModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!projectId) return
    const so = stOwner.trim()
    const pd = proj?.departmentId ?? null
    if (
      pd &&
      so &&
      !isAssigneeInDepartmentRoster(data.teamRoster, pd, so)
    ) {
      toast('負責人須為專案部門名冊成員')
      return
    }
    addSubtask(projectId, {
      title: stTitle,
      owner: so,
      due: stDue,
    })
    setStTitle('')
    setStOwner('')
    setStDue('')
    setStOpen(false)
  }

  const submitRiskModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!projectId) return
    const ro = rkOwner.trim()
    const pd = proj?.departmentId ?? null
    if (
      pd &&
      ro &&
      !isAssigneeInDepartmentRoster(data.teamRoster, pd, ro)
    ) {
      toast('負責人須為專案部門名冊成員')
      return
    }
    addRisk(projectId, {
      title: rkTitle,
      level: rkLevel,
      desc: rkDesc,
      owner: ro,
    })
    setRkTitle('')
    setRkLevel('mid')
    setRkDesc('')
    setRkOwner('')
    setRkOpen(false)
  }

  const openIfProject = (fn: () => void) => {
    if (!projectId) return
    fn()
  }

  return (
    <>
      <div className="stats-bar" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">大型專案</div>
          <div className="stat-value">{bp.length}</div>
          <div className="stat-sub">進行中</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">里程碑完成</div>
          <div className="stat-value">{msDone}</div>
          <div className="stat-sub">本月</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">里程碑即將到期</div>
          <div className="stat-value">{msDueSoon}</div>
          <div className="stat-sub">7天內</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">高風險項目</div>
          <div className="stat-value">{highRisks}</div>
          <div className="stat-sub">需關注</div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          點選左側專案查看詳情
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setBigOpen(true)}
        >
          ＋ 新增大型專案
        </button>
      </div>

      {!bp.length ? (
        <div className="proj-empty-state">
          <div className="empty-icon">🗂</div>
          <p>
            還沒有大型專案
            <br />
            點擊右上角「＋ 新增大型專案」開始
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setBigOpen(true)}
          >
            ＋ 新增第一個專案
          </button>
        </div>
      ) : (
        <div className="proj-layout">
          <div className="proj-sidebar">
            <div className="proj-sidebar-card">
              <div className="card-header" style={{ padding: '12px 14px' }}>
                <div className="card-title" style={{ fontSize: 13 }}>
                  📁 所有專案
                </div>
              </div>
              {bp.map((p, i) => {
                const pct = calcBigProjectProgress(p)
                const active = i === selectedBigProjectIdx ? ' active' : ''
                const statusDot =
                  p.status === 'blocked'
                    ? '🔴'
                    : p.status === 'at-risk'
                      ? '🟠'
                      : p.status === 'done'
                        ? '✅'
                        : '🟢'
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`proj-list-item${active}`}
                    onClick={() => setSelectedBigProjectIdx(i)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'none',
                      fontFamily: 'inherit',
                      border: 'none',
                    }}
                  >
                    <div className="proj-list-name">
                      {statusDot} {p.name}
                    </div>
                    <div className="proj-list-meta">
                      {p.due ? `📅 ${p.due}` : ''}
                    </div>
                    <div className="proj-list-bar">
                      <div
                        className="proj-list-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="proj-detail">
            {proj ? (
              <>
                <div className="proj-detail-header">
                  <div className="proj-name-row">
                    <div className="proj-title">{proj.name}</div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span className={`proj-status-badge status-${proj.status}`}>
                        {STATUS_LABEL[proj.status]}
                      </span>
                      <select
                        value={proj.status}
                        onChange={(e) =>
                          updateBigProjectStatus(
                            projectId,
                            e.target.value as BigProjectStatus,
                          )
                        }
                        style={{
                          fontSize: 12,
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          padding: '3px 6px',
                          background: 'var(--bg)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {(Object.keys(STATUS_LABEL) as BigProjectStatus[]).map(
                          (s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ fontSize: 18 }}
                        title="刪除專案"
                        onClick={() => {
                          if (
                            window.confirm(
                              '確定刪除此專案及所有相關資料？',
                            )
                          ) {
                            removeBigProject(projectId)
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="proj-meta-row">
                    {proj.goal ? (
                      <div className="proj-meta-item">
                        🎯 <span className="proj-meta-label">目標：</span>
                        {proj.goal}
                      </div>
                    ) : null}
                    {proj.due ? (
                      <div className="proj-meta-item">
                        📅 <span className="proj-meta-label">截止：</span>
                        {proj.due}
                      </div>
                    ) : null}
                    {proj.pm ? (
                      <div className="proj-meta-item">
                        👤 <span className="proj-meta-label">PM：</span>
                        {proj.pm}
                      </div>
                    ) : null}
                    <div
                      className="proj-meta-item"
                      style={{ flexWrap: 'wrap', gap: 8 }}
                    >
                      <span className="proj-meta-label">部門（報表連動）：</span>
                      <DepartmentSelect
                        departments={data.departments}
                        value={proj.departmentId}
                        onChange={(id) =>
                          updateBigProjectDepartment(projectId, id)
                        }
                        className="input"
                        style={{ maxWidth: 200, fontSize: 12 }}
                      />
                    </div>
                  </div>
                  <div className="proj-progress-row">
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        minWidth: 40,
                      }}
                    >
                      進度
                    </div>
                    <div className="proj-progress-wrap">
                      <div
                        className={`proj-progress-fill ${
                          calcBigProjectProgress(proj) >= 100
                            ? 'green'
                            : calcBigProjectProgress(proj) >= 60
                              ? 'blue'
                              : ''
                        }`}
                        style={{ width: `${calcBigProjectProgress(proj)}%` }}
                      />
                    </div>
                    <div className="proj-progress-label">
                      {calcBigProjectProgress(proj)}%
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={proj.progress}
                      onChange={(e) =>
                        updateBigProjectProgress(
                          projectId,
                          Number(e.target.value),
                        )
                      }
                      style={{
                        width: 90,
                        accentColor: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  {proj.desc ? (
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-light)',
                        paddingTop: 12,
                      }}
                    >
                      {proj.desc}
                    </div>
                  ) : null}
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">🏁 里程碑</div>
                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openIfProject(() => setMsOpen(true))}
                      >
                        ＋ 新增
                      </button>
                    </div>
                    <div className="card-body">
                      {proj.milestones.length ? (
                        proj.milestones.map((m, mi) => {
                          const mDate = m.date ? new Date(m.date) : null
                          const diff = mDate
                            ? Math.ceil(
                                (mDate.getTime() - now.getTime()) / 86400000,
                              )
                            : null
                          const mTag = m.done ? (
                            <span className="milestone-tag ms-done">已完成</span>
                          ) : diff === null ? null : diff < 0 ? (
                            <span className="milestone-tag ms-overdue">
                              已逾期 {Math.abs(diff)} 天
                            </span>
                          ) : diff === 0 ? (
                            <span className="milestone-tag ms-today">今天</span>
                          ) : diff <= 7 ? (
                            <span className="milestone-tag ms-upcoming">
                              {diff} 天後
                            </span>
                          ) : (
                            <span className="milestone-tag ms-upcoming">
                              {diff} 天後
                            </span>
                          )
                          return (
                            <div key={m.id} className="milestone-item">
                              <div className="milestone-dot-wrap">
                                <button
                                  type="button"
                                  className={`milestone-dot ${m.done ? 'done' : ''}`}
                                  title="標記完成"
                                  onClick={() =>
                                    toggleMilestone(projectId, m.id)
                                  }
                                />
                                {mi < proj.milestones.length - 1 ? (
                                  <div className="milestone-line" />
                                ) : null}
                              </div>
                              <div className="milestone-content">
                                <div
                                  className={`milestone-title ${m.done ? 'done' : ''}`}
                                >
                                  {m.title}
                                </div>
                                <div className="milestone-meta">
                                  {m.date ? <span>📅 {m.date}</span> : null}
                                  {m.owner ? <span>👤 {m.owner}</span> : null}
                                </div>
                              </div>
                              {mTag}
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() =>
                                  removeMilestone(projectId, m.id)
                                }
                              >
                                ×
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="empty">
                          <div className="empty-icon">🏁</div>
                          尚未新增里程碑
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">👥 團隊分工</div>
                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openIfProject(() => setTmOpen(true))}
                      >
                        ＋ 新增成員
                      </button>
                    </div>
                    <div className="card-body">
                      {proj.team.length ? (
                        proj.team.map((mb) => (
                          <div key={mb.id} className="member-item">
                            <div
                              className="member-avatar"
                              style={{
                                background: avatarColor(mb.name || '?'),
                              }}
                            >
                              {(mb.name || '?').slice(0, 2)}
                            </div>
                            <div className="member-info">
                              <div className="member-name">{mb.name}</div>
                              <div className="member-role">{mb.role}</div>
                            </div>
                            <div className="member-tasks">{mb.tasks}</div>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() =>
                                removeTeamMember(projectId, mb.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty">
                          <div className="empty-icon">👥</div>
                          尚未新增團隊成員
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">✅ 子任務</div>
                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openIfProject(() => setStOpen(true))}
                      >
                        ＋ 新增
                      </button>
                    </div>
                    <div className="card-body">
                      {proj.subtasks.length ? (
                        proj.subtasks.map((s) => (
                          <div key={s.id} className="subtask-item">
                            <button
                              type="button"
                              className={`task-check ${s.done ? 'checked' : ''}`}
                              onClick={() =>
                                toggleSubtask(projectId, s.id)
                              }
                            />
                            <div className="task-content">
                              <div
                                className={`task-title ${s.done ? 'done' : ''}`}
                              >
                                {s.title}
                              </div>
                              <div className="task-meta">
                                {s.owner ? <span>👤 {s.owner}</span> : null}
                                {s.due ? <span>📅 {s.due}</span> : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() =>
                                removeSubtask(projectId, s.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty">
                          <div className="empty-icon">📋</div>
                          尚未新增子任務
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">⚠️ 風險 & 阻礙</div>
                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openIfProject(() => setRkOpen(true))}
                      >
                        ＋ 新增
                      </button>
                    </div>
                    <div className="card-body">
                      {proj.risks.length ? (
                        proj.risks.map((r) => (
                          <div
                            key={r.id}
                            className={`risk-item risk-${r.level || 'mid'}`}
                          >
                            <div className="risk-title">{r.title}</div>
                            <div className="risk-desc">{r.desc}</div>
                            <div className="risk-meta">
                              <span>
                                {r.level === 'high'
                                  ? '高風險'
                                  : r.level === 'low'
                                    ? '低風險'
                                    : '中風險'}
                              </span>
                              {r.owner ? (
                                <span>負責：{r.owner}</span>
                              ) : null}
                              <button
                                type="button"
                                className="card-action"
                                style={{ marginLeft: 'auto' }}
                                onClick={() => removeRisk(projectId, r.id)}
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty">
                          <div className="empty-icon">✨</div>
                          目前沒有記錄的風險
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        open={bigOpen}
        title="新增大型專案"
        onClose={() => setBigOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setBigOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-project-big"
              className="btn btn-primary"
            >
              建立
            </button>
          </div>
        }
      >
        <form id="wm-form-project-big" onSubmit={submitBig}>
        <div className="modal-field">
          <label htmlFor="bf-name">專案名稱</label>
          <input
            id="bf-name"
            className="input"
            style={{ width: '100%' }}
            value={bfName}
            onChange={(e) => setBfName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="bf-goal">專案目標（一句話）</label>
          <input
            id="bf-goal"
            className="input"
            style={{ width: '100%' }}
            value={bfGoal}
            onChange={(e) => setBfGoal(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="bf-due">預計完成日</label>
          <DateTextAndPicker
            id="bf-due"
            value={bfDue}
            onChange={setBfDue}
            className="input"
            style={{ width: '100%', maxWidth: 'none' }}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="bf-dept">歸屬部門（與 KPI、追蹤總覽連動）</label>
          <DepartmentSelect
            id="bf-dept"
            departments={data.departments}
            value={bfDeptId}
            onChange={(id) => {
              setBfDeptId(id)
              setBfPm('')
            }}
            className="input"
            includePersonal={false}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="bf-pm">PM（該部門名冊）</label>
          <RosterMemberSelect
            id="bf-pm"
            roster={data.teamRoster}
            departmentId={bfDeptId}
            value={bfPm}
            onChange={setBfPm}
            className="input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="bf-desc">簡要說明（可留空）</label>
          <textarea
            id="bf-desc"
            className="review-input"
            style={{ minHeight: 72 }}
            value={bfDesc}
            onChange={(e) => setBfDesc(e.target.value)}
          />
        </div>
        </form>
      </Modal>

      <Modal
        open={msOpen}
        title="新增里程碑"
        onClose={() => setMsOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setMsOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-project-ms"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-project-ms" onSubmit={submitMilestoneModal}>
        <div className="modal-field">
          <label>名稱</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={msTitle}
            onChange={(e) => setMsTitle(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>目標日期</label>
          <DateTextAndPicker
            value={msDate}
            onChange={setMsDate}
            className="input"
            style={{ width: '100%', maxWidth: 'none' }}
          />
        </div>
        <div className="modal-field">
          <label>負責人（名冊，可留空）</label>
          <RosterMemberSelect
            roster={data.teamRoster}
            departmentId={proj?.departmentId ?? null}
            value={msOwner}
            onChange={setMsOwner}
            className="input"
            style={{ width: '100%' }}
            allowEmpty
          />
        </div>
        </form>
      </Modal>

      <Modal
        open={tmOpen}
        title="新增團隊成員"
        onClose={() => setTmOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setTmOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-project-tm"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-project-tm" onSubmit={submitTeamMemberModal}>
        <div className="modal-field">
          <label>姓名</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={tmName}
            onChange={(e) => setTmName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>角色 / 職責</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={tmRole}
            onChange={(e) => setTmRole(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>負責事項（可留空）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={tmTasks}
            onChange={(e) => setTmTasks(e.target.value)}
          />
        </div>
        </form>
      </Modal>

      <Modal
        open={stOpen}
        title="新增子任務"
        onClose={() => setStOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setStOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-project-st"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-project-st" onSubmit={submitSubtaskModal}>
        <div className="modal-field">
          <label>子任務</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={stTitle}
            onChange={(e) => setStTitle(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>負責人（名冊，可留空）</label>
          <RosterMemberSelect
            roster={data.teamRoster}
            departmentId={proj?.departmentId ?? null}
            value={stOwner}
            onChange={setStOwner}
            className="input"
            style={{ width: '100%' }}
            allowEmpty
          />
        </div>
        <div className="modal-field">
          <label>截止日（可留空）</label>
          <DateTextAndPicker
            value={stDue}
            onChange={setStDue}
            className="input"
            style={{ width: '100%', maxWidth: 'none' }}
          />
        </div>
        </form>
      </Modal>

      <Modal
        open={rkOpen}
        title="新增風險 / 阻礙"
        onClose={() => setRkOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setRkOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-project-rk"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-project-rk" onSubmit={submitRiskModal}>
        <div className="modal-field">
          <label>描述</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={rkTitle}
            onChange={(e) => setRkTitle(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>等級</label>
          <select
            className="input"
            style={{ width: '100%' }}
            value={rkLevel}
            onChange={(e) =>
              setRkLevel(e.target.value as 'high' | 'mid' | 'low')
            }
          >
            <option value="high">高風險</option>
            <option value="mid">中風險</option>
            <option value="low">低風險</option>
          </select>
        </div>
        <div className="modal-field">
          <label>詳細說明（可留空）</label>
          <textarea
            className="review-input"
            style={{ minHeight: 72 }}
            value={rkDesc}
            onChange={(e) => setRkDesc(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>負責人（名冊，可留空）</label>
          <RosterMemberSelect
            roster={data.teamRoster}
            departmentId={proj?.departmentId ?? null}
            value={rkOwner}
            onChange={setRkOwner}
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
