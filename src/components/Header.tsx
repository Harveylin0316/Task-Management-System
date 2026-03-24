import { useMemo, useRef, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { Modal } from './Modal'
import { DepartmentSelect } from './DepartmentSelect'

export function Header() {
  const {
    data,
    exportMarkdown,
    exportJson,
    importJsonFromFile,
    addTask,
    toast,
  } = useDashboard()
  const [setupOpen, setSetupOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addSection, setAddSection] = useState<'today' | 'active' | 'someday'>(
    'active',
  )
  const [addTaskDept, setAddTaskDept] = useState<string | null>(null)
  const [addAssignee, setAddAssignee] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const headerDate = useMemo(() => {
    const now = new Date()
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`
  }, [])

  const cloudReady = isSupabaseConfigured()

  const submitAdd = () => {
    const t = addTitle.trim()
    if (!t) return
    addTask(addSection, t, {
      departmentId: addTaskDept,
      assignee: addAssignee,
    })
    setAddTitle('')
    setAddOpen(false)
    toast('任務已新增')
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo" aria-hidden>
            📋
          </div>
          <div>
            <h1>工作管理儀表板</h1>
            <div className="header-date">{headerDate}</div>
          </div>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="sync-status"
            onClick={() => setSetupOpen(true)}
            title="同步與備份說明"
          >
            <span
              className={`sync-dot ${cloudReady ? 'cloud' : 'local'}`}
              aria-hidden
            />
            {cloudReady ? '雲端已設定' : '本機暫存（將接 Supabase）'}
          </button>
          <button type="button" className="btn" onClick={exportMarkdown}>
            匯出週報
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            ＋ 新增任務
          </button>
        </div>
      </header>

      <Modal
        open={setupOpen}
        title="📂 跨裝置與備份"
        onClose={() => setSetupOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={exportJson}>
              ⬇️ 匯出 JSON
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              ⬆️ 匯入 JSON
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setSetupOpen(false)}
            >
              關閉
            </button>
          </div>
        }
      >
        <p className="modal-sub">
          目標是讓你在手機與電腦都能看到同一份資料，因此<strong>不會只存在單一裝置本機</strong>
          。下一階段會接上 <strong>Supabase</strong>
          （登入後寫入雲端）。目前開發階段仍使用瀏覽器暫存，請先用匯出／匯入 JSON
          做備份與搬移。
        </p>
        <p className="modal-note">
          之後請在專案根目錄建立 <code>.env</code>，填入{' '}
          <code>VITE_SUPABASE_URL</code>、<code>VITE_SUPABASE_ANON_KEY</code>
          ，並實作 <code>src/lib/supabaseClient.ts</code> 與對應的 DataSource。
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importJsonFromFile(f)
            e.target.value = ''
          }}
        />
      </Modal>

      <Modal
        open={addOpen}
        title="新增任務"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setAddOpen(false)}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={submitAdd}>
              新增
            </button>
          </div>
        }
      >
        <div className="modal-field">
          <label htmlFor="add-task-title">任務內容</label>
          <input
            id="add-task-title"
            className="input"
            style={{ width: '100%' }}
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            placeholder="要做的事…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitAdd()
            }}
          />
        </div>
        <div className="modal-field">
          <label htmlFor="add-task-section">區塊</label>
          <select
            id="add-task-section"
            className="input"
            style={{ width: '100%' }}
            value={addSection}
            onChange={(e) =>
              setAddSection(e.target.value as 'today' | 'active' | 'someday')
            }
          >
            <option value="today">今日</option>
            <option value="active">進行中</option>
            <option value="someday">日後再說</option>
          </select>
        </div>
        <div className="modal-field">
          <label htmlFor="add-task-dept">歸屬</label>
          <DepartmentSelect
            id="add-task-dept"
            departments={data.departments}
            value={addTaskDept}
            onChange={setAddTaskDept}
            className="input"
          />
        </div>
        <div className="modal-field">
          <label htmlFor="add-task-assignee">負責人（可留空）</label>
          <input
            id="add-task-assignee"
            className="input"
            style={{ width: '100%' }}
            value={addAssignee}
            onChange={(e) => setAddAssignee(e.target.value)}
            placeholder="與追蹤總覽連動"
          />
        </div>
      </Modal>
    </>
  )
}
