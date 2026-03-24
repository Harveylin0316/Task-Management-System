import { useDashboard } from '../context/DashboardContext'
import { DateTextAndPicker } from './DateTextAndPicker'
import { DepartmentSelect } from './DepartmentSelect'
import { RosterMemberSelect } from './RosterMemberSelect'
import { dueBadgeLabel, dueKindAndOffset } from '../lib/dateUtils'
import type { TaskItem, TaskSection } from '../lib/types'

export function TaskRows({
  items,
  section,
  showDepartmentPicker = true,
  lockDepartment = false,
  /** 與 lockDepartment 併用：篩選名冊負責人（例部門工作台目前部門） */
  lockedDepartmentId = null,
  projectLinkOptions,
  showInlineTitleEdit = false,
}: {
  items: TaskItem[]
  section: TaskSection
  /** 是否顯示「我的／部門」切換（已完成區可關閉以節省空間） */
  showDepartmentPicker?: boolean
  /** 為 true 時不顯示部門下拉（部門工作台已鎖定部門） */
  lockDepartment?: boolean
  lockedDepartmentId?: string | null
  /** 若提供，每列可將任務掛到部門內專案或改為「不屬專案」 */
  projectLinkOptions?: { id: string; name: string }[]
  /** 可直接編輯標題（blur 後寫入） */
  showInlineTitleEdit?: boolean
}) {
  const {
    data,
    toggleTask,
    removeTask,
    updateTaskDepartment,
    updateTaskAssignee,
    updateTaskDue,
    toggleTaskWeeklyCommit,
    updateTaskSmallProject,
    updateTaskMeta,
  } = useDashboard()

  const showDeptSelect = showDepartmentPicker && !lockDepartment && section !== 'done'

  const deptForRoster = (item: TaskItem) =>
    lockDepartment
      ? (lockedDepartmentId ?? item.departmentId)
      : item.departmentId

  if (!items.length) {
    return (
      <div className="empty">
        <div className="empty-icon">{section === 'done' ? '✅' : '📭'}</div>
        {section === 'done' ? '本週尚無完成任務' : '目前沒有任務'}
      </div>
    )
  }

  return (
    <>
      {items.map((item) => {
        const { kind: dueKind, daysUntil } = dueKindAndOffset(item.due)
        const rosterDeptId = deptForRoster(item)
        return (
        <div key={item.id} className="task-item">
          <div className={`priority-dot p-${item.priority || 'mid'}`} />
          <button
            type="button"
            className={`task-check ${item.done ? 'checked' : ''}`}
            onClick={() => toggleTask(section, item.id)}
            aria-label={item.done ? '標記未完成' : '標記完成'}
          />
          <div className="task-content">
            {showInlineTitleEdit && section !== 'done' ? (
              <input
                key={item.id}
                className="input task-title-edit"
                defaultValue={item.title}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== item.title) {
                    updateTaskMeta(section, item.id, { title: v })
                  }
                }}
                aria-label="任務標題"
              />
            ) : (
              <div className={`task-title ${item.done ? 'done' : ''}`}>
                {item.title}
              </div>
            )}
            <div className="task-row-bottom">
              <div className="task-meta">
                <span
                  className={`tag ${item.departmentId == null ? 'tag-scope-personal' : 'tag-scope-dept'}`}
                >
                  {item.departmentId == null
                    ? '我的'
                    : data.departments.find((d) => d.id === item.departmentId)
                        ?.name ?? '部門'}
                </span>
                {item.smallProjectId ? (
                  <span className="tag tag-waiting" title="專案任務">
                    📁{' '}
                    {data.projects.find((p) => p.id === item.smallProjectId)
                      ?.name ?? '專案'}
                  </span>
                ) : null}
                {section === 'done' && item.assignee ? (
                  <span>✋ {item.assignee}</span>
                ) : null}
                {section === 'done' && item.weeklyCommit ? (
                  <span className="tag tag-plan">本週承諾</span>
                ) : null}
                {item.due ? (
                  <>
                    {section !== 'done' && !item.done && dueKind !== 'none' ? (
                      <span
                        className={`due-badge due-${dueKind}`}
                        title={item.due}
                      >
                        {dueBadgeLabel(dueKind, daysUntil)}
                      </span>
                    ) : null}
                    <span>📅 {item.due}</span>
                  </>
                ) : null}
                {item.note ? <span>{item.note}</span> : null}
              </div>
              {showDepartmentPicker && section !== 'done' ? (
                <>
                  <button
                    type="button"
                    className={`task-weekly-pill ${item.weeklyCommit ? 'on' : ''}`}
                    title="標記為本週承諾（週會／週報）"
                    onClick={() => toggleTaskWeeklyCommit(section, item.id)}
                    aria-pressed={Boolean(item.weeklyCommit)}
                  >
                    本週承諾
                  </button>
                  {projectLinkOptions?.length ? (
                    <select
                      className="input task-project-select"
                      value={item.smallProjectId ?? ''}
                      onChange={(e) =>
                        updateTaskSmallProject(
                          section,
                          item.id,
                          e.target.value || null,
                        )
                      }
                      aria-label="隸屬專案"
                    >
                      <option value="">不屬專案</option>
                      {projectLinkOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {showDeptSelect ? (
                    <DepartmentSelect
                      departments={data.departments}
                      value={item.departmentId}
                      onChange={(deptId) =>
                        updateTaskDepartment(section, item.id, deptId)
                      }
                      className="input task-dept-select"
                      includePersonal={false}
                    />
                  ) : null}
                  <RosterMemberSelect
                    roster={data.teamRoster}
                    departmentId={rosterDeptId}
                    value={item.assignee ?? ''}
                    onChange={(name) =>
                      updateTaskAssignee(
                        section,
                        item.id,
                        name || undefined,
                      )
                    }
                    className="input task-assignee-input"
                  />
                  <DateTextAndPicker
                    className="input task-due-input"
                    value={item.due ?? ''}
                    onChange={(v) =>
                      updateTaskDue(section, item.id, v || undefined)
                    }
                  />
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            title="刪除"
            onClick={() => removeTask(section, item.id)}
          >
            ×
          </button>
        </div>
        )
      })}
    </>
  )
}
