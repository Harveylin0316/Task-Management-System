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
            {cloudReady ? '雲端同步' : '本機暫存'}
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
          若在 <code>.env</code> 設定 <code>VITE_SUPABASE_URL</code> 與{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>，並在 Supabase 執行專案內{' '}
          <code>supabase/migrations</code> 的 SQL，資料會同步到雲端。
        </p>
        <p className="modal-note">
          若出現 <code>anonymous_provider_disabled</code>
          ，Auth API 仍擋匿名：請用畫面上方 <strong>Email 登入／註冊</strong>（Providers
          須開啟 Email）。並確認 <code>.env</code> 網址與專案一致、
          <strong>Allow new users to sign up</strong> 已開。Netlify 須設{' '}
          <code>VITE_*</code> 並重新部署。
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
            list="wm-team-roster-datalist"
            value={addAssignee}
            onChange={(e) => setAddAssignee(e.target.value)}
            placeholder="與追蹤總覽連動"
          />
        </div>
      </Modal>
    </>
  )
}
