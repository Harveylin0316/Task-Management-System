import { useDashboard } from '../context/DashboardContext'
import { TaskRows } from '../components/TaskRows'
import { Modal } from '../components/Modal'
import { useState } from 'react'

/**
 * 依「我的任務／各部門」分欄檢視今日、進行中、日後再說（未完成）任務。
 */
export function MyAndDepartmentsPage() {
  const {
    data,
    addDepartment,
    addDepartmentKpi,
    updateDepartmentKpi,
    removeDepartmentKpi,
    renameDepartment,
    removeDepartment,
    addTeamRosterMember,
    updateTeamRosterMember,
    removeTeamRosterMember,
    toast,
  } = useDashboard()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rosterModalOpen, setRosterModalOpen] = useState(false)
  const [rosterName, setRosterName] = useState('')
  const [rosterRole, setRosterRole] = useState('')
  const [rosterEditingId, setRosterEditingId] = useState<string | null>(null)
  const [rosterEditName, setRosterEditName] = useState('')
  const [rosterEditRole, setRosterEditRole] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [kpiDeptId, setKpiDeptId] = useState<string | null>(null)
  const [kpiName, setKpiName] = useState('')
  const [kpiTarget, setKpiTarget] = useState('')
  const [kpiCurrent, setKpiCurrent] = useState('')
  const [kpiNote, setKpiNote] = useState('')

  const columns: { id: string | null; title: string; emoji: string }[] = [
    { id: null, title: '我的任務', emoji: '👤' },
    ...data.departments.map((d) => ({
      id: d.id,
      title: d.name,
      emoji: '🏢',
    })),
  ]

  const filterByCol = (colId: string | null) => (list: typeof data.today) =>
    list.filter((t) =>
      colId == null ? t.departmentId == null : t.departmentId === colId,
    )

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 520 }}>
          預設部門為<strong>行銷</strong>與<strong>BD業務</strong>。各部門可維護
          <strong>KPI</strong>（目標／現況），並在「追蹤總覽」由上而下對齊專案與任務負責人。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙️ 管理部門
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setRosterModalOpen(true)
              setRosterName('')
              setRosterRole('')
            }}
          >
            ＋ 團隊成員名冊
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">👥 團隊成員名冊</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
            在此維護成員清單；任務「負責人」欄可輸入相同姓名，瀏覽器會顯示建議選項。
          </p>
          {!data.teamRoster.length ? (
            <div className="empty" style={{ padding: '16px 8px' }}>
              <div className="empty-icon">👤</div>
              尚無成員。點「＋ 團隊成員名冊」新增。
            </div>
          ) : (
            <ul className="team-roster-list">
              {data.teamRoster.map((m) => (
                <li key={m.id} className="team-roster-item">
                  {rosterEditingId === m.id ? (
                    <>
                      <input
                        className="input"
                        style={{ flex: 1, minWidth: 100 }}
                        value={rosterEditName}
                        onChange={(e) => setRosterEditName(e.target.value)}
                        placeholder="姓名"
                      />
                      <input
                        className="input"
                        style={{ flex: 1, minWidth: 80 }}
                        value={rosterEditRole}
                        onChange={(e) => setRosterEditRole(e.target.value)}
                        placeholder="職稱／備註"
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          updateTeamRosterMember(m.id, {
                            name: rosterEditName,
                            role: rosterEditRole,
                          })
                          setRosterEditingId(null)
                          toast('已更新')
                        }}
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 12 }}
                        onClick={() => setRosterEditingId(null)}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="team-roster-name">{m.name}</span>
                      {m.role ? (
                        <span className="team-roster-role">{m.role}</span>
                      ) : null}
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          setRosterEditingId(m.id)
                          setRosterEditName(m.name)
                          setRosterEditRole(m.role ?? '')
                        }}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          if (window.confirm(`從名冊移除「${m.name}」？`)) {
                            removeTeamRosterMember(m.id)
                          }
                        }}
                      >
                        移除
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!data.departments.length ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="empty" style={{ padding: '20px 12px' }}>
              <div className="empty-icon">🏢</div>
              尚未建立部門。點「管理部門」新增；新資料預設含行銷、BD業務。
            </div>
          </div>
        </div>
      ) : null}

      <div className="dept-overview-grid">
        {columns.map((col) => {
          const dept =
            col.id != null
              ? data.departments.find((d) => d.id === col.id)
              : null
          return (
          <div key={col.id ?? 'personal'} className="card">
            <div className="card-header">
              <div className="card-title">
                {col.emoji} {col.title}
              </div>
            </div>
            <div className="card-body">
              {dept ? (
                <>
                  <div className="dept-col-sub">部門 KPI</div>
                  {!dept.kpis.length ? (
                    <p className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                      尚無 KPI
                    </p>
                  ) : (
                    <ul className="kpi-inline-list">
                      {dept.kpis.map((k) => (
                        <li key={k.id} className="kpi-inline-item">
                          <div className="kpi-inline-title">{k.name}</div>
                          <div className="kpi-inline-meta">
                            目標：{k.target || '—'}
                          </div>
                          <label className="kpi-inline-label">現況</label>
                          <input
                            className="input"
                            style={{ width: '100%', marginBottom: 4 }}
                            defaultValue={k.current}
                            onBlur={(e) => {
                              const v = e.target.value.trim()
                              if (v !== k.current) {
                                updateDepartmentKpi(dept.id, k.id, {
                                  current: v,
                                })
                                toast('KPI 現況已更新')
                              }
                            }}
                          />
                          {k.note ? (
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {k.note}
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className="card-action"
                            style={{ marginTop: 4 }}
                            onClick={() => {
                              if (window.confirm(`刪除 KPI「${k.name}」？`)) {
                                removeDepartmentKpi(dept.id, k.id)
                              }
                            }}
                          >
                            刪除此 KPI
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: '100%',
                      fontSize: 12,
                      marginBottom: 14,
                    }}
                    onClick={() => {
                      setKpiDeptId(dept.id)
                      setKpiName('')
                      setKpiTarget('')
                      setKpiCurrent('')
                      setKpiNote('')
                    }}
                  >
                    ＋ 新增 KPI
                  </button>
                </>
              ) : null}
              <div className="dept-col-sub">今日</div>
              <TaskRows
                items={filterByCol(col.id)(data.today)}
                section="today"
              />
              <div className="dept-col-sub">進行中</div>
              <TaskRows
                items={filterByCol(col.id)(data.active)}
                section="active"
              />
              <div className="dept-col-sub">日後再說</div>
              <TaskRows
                items={filterByCol(col.id)(data.someday)}
                section="someday"
              />
            </div>
          </div>
          );
        })}
      </div>

      <Modal
        open={rosterModalOpen}
        title="新增團隊成員"
        onClose={() => setRosterModalOpen(false)}
        footer={
          <div className="modal-btns">
            <button
              type="button"
              className="btn"
              onClick={() => setRosterModalOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                addTeamRosterMember(rosterName, rosterRole || undefined)
                setRosterModalOpen(false)
              }}
            >
              新增
            </button>
          </div>
        }
      >
        <div className="modal-field">
          <label>姓名</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={rosterName}
            onChange={(e) => setRosterName(e.target.value)}
            placeholder="例：王小明"
          />
        </div>
        <div className="modal-field">
          <label>職稱或備註（可留空）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={rosterRole}
            onChange={(e) => setRosterRole(e.target.value)}
            placeholder="例：行銷專員"
          />
        </div>
      </Modal>

      <Modal
        open={kpiDeptId !== null}
        title="新增部門 KPI"
        onClose={() => setKpiDeptId(null)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setKpiDeptId(null)}>
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (kpiDeptId) {
                  addDepartmentKpi(kpiDeptId, {
                    name: kpiName,
                    target: kpiTarget,
                    current: kpiCurrent,
                    note: kpiNote || undefined,
                  })
                  toast('KPI 已新增')
                  setKpiDeptId(null)
                }
              }}
            >
              新增
            </button>
          </div>
        }
      >
        <div className="modal-field">
          <label>KPI 名稱</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={kpiName}
            onChange={(e) => setKpiName(e.target.value)}
            placeholder="例：本季線索數"
          />
        </div>
        <div className="modal-field">
          <label>目標</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={kpiTarget}
            onChange={(e) => setKpiTarget(e.target.value)}
            placeholder="例：500 條"
          />
        </div>
        <div className="modal-field">
          <label>目前進度／數值</label>
          <input
            className="input"
            style={{ width: '100%' }}
            value={kpiCurrent}
            onChange={(e) => setKpiCurrent(e.target.value)}
            placeholder="例：320"
          />
        </div>
        <div className="modal-field">
          <label>備註（可留空）</label>
          <textarea
            className="review-input"
            style={{ minHeight: 60 }}
            value={kpiNote}
            onChange={(e) => setKpiNote(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={settingsOpen}
        title="管理部門"
        onClose={() => {
          setSettingsOpen(false)
          setEditingId(null)
        }}
        footer={
          <button
            type="button"
            className="btn"
            style={{ width: '100%' }}
            onClick={() => setSettingsOpen(false)}
          >
            關閉
          </button>
        }
      >
        <p className="modal-sub">
          新增部門後，新增任務時可選「🏢 部門名」；選「👤 我的任務」則只屬於你自己。
        </p>
        <div className="modal-field" style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="新部門名稱…"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addDepartment(newDeptName)
                setNewDeptName('')
                toast('部門已新增')
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addDepartment(newDeptName)
              setNewDeptName('')
              toast('部門已新增')
            }}
          >
            新增
          </button>
        </div>
        <ul style={{ listStyle: 'none', marginTop: 16 }}>
          {data.departments.map((d) => (
            <li
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              {editingId === d.id ? (
                <>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      renameDepartment(d.id, editingName)
                      setEditingId(null)
                      toast('已重新命名')
                    }}
                  >
                    儲存
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditingId(null)}
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 600 }}>{d.name}</span>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      setEditingId(d.id)
                      setEditingName(d.name)
                    }}
                  >
                    改名
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      if (
                        window.confirm(
                          `刪除「${d.name}」？該部門下的任務會改為「我的任務」。`,
                        )
                      ) {
                        removeDepartment(d.id)
                        toast('部門已刪除')
                      }
                    }}
                  >
                    刪除
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {!data.departments.length ? (
          <p className="modal-note">尚無部門，請在上方輸入名稱並新增。</p>
        ) : null}
      </Modal>
    </>
  )
}
