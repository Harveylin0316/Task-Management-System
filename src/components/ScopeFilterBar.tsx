import type { Department } from '../lib/types'
import type { TaskScopeFilter } from '../lib/taskScope'

type Props = {
  departments: Department[]
  value: TaskScopeFilter
  onChange: (v: TaskScopeFilter) => void
}

export function ScopeFilterBar({ departments, value, onChange }: Props) {
  return (
    <div className="scope-filter-bar" role="group" aria-label="任務範圍篩選">
      <button
        type="button"
        className={`scope-chip ${value === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        全部
      </button>
      <button
        type="button"
        className={`scope-chip ${value === 'personal' ? 'active' : ''}`}
        onClick={() => onChange('personal')}
      >
        👤 我的任務
      </button>
      {departments.map((d) => (
        <button
          key={d.id}
          type="button"
          className={`scope-chip ${value === d.id ? 'active' : ''}`}
          onClick={() => onChange(d.id)}
        >
          🏢 {d.name}
        </button>
      ))}
    </div>
  )
}
