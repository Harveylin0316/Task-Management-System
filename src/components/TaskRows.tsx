import { useDashboard } from '../context/DashboardContext'
import { DepartmentSelect } from './DepartmentSelect'
import type { TaskItem, TaskSection } from '../lib/types'

export function TaskRows({
  items,
  section,
  showDepartmentPicker = true,
}: {
  items: TaskItem[]
  section: TaskSection
  /** 是否顯示「我的／部門」切換（已完成區可關閉以節省空間） */
  showDepartmentPicker?: boolean
}) {
  const { data, toggleTask, removeTask, updateTaskDepartment, updateTaskAssignee } =
    useDashboard()

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
      {items.map((item) => (
        <div key={item.id} className="task-item">
          <div className={`priority-dot p-${item.priority || 'mid'}`} />
          <button
            type="button"
            className={`task-check ${item.done ? 'checked' : ''}`}
            onClick={() => toggleTask(section, item.id)}
            aria-label={item.done ? '標記未完成' : '標記完成'}
          />
          <div className="task-content">
            <div className={`task-title ${item.done ? 'done' : ''}`}>
              {item.title}
            </div>
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
                {section === 'done' && item.assignee ? (
                  <span>✋ {item.assignee}</span>
                ) : null}
                {item.due ? <span>📅 {item.due}</span> : null}
                {item.note ? <span>{item.note}</span> : null}
              </div>
              {showDepartmentPicker && section !== 'done' ? (
                <>
                  <input
                    type="text"
                    className="input task-assignee-input"
                    placeholder="負責人"
                    value={item.assignee ?? ''}
                    onChange={(e) =>
                      updateTaskAssignee(section, item.id, e.target.value)
                    }
                    aria-label="任務負責人"
                  />
                  <DepartmentSelect
                    departments={data.departments}
                    value={item.departmentId}
                    onChange={(deptId) =>
                      updateTaskDepartment(section, item.id, deptId)
                    }
                    className="input task-dept-select"
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
      ))}
    </>
  )
}
