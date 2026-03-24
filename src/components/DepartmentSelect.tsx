import type { CSSProperties } from 'react'
import type { Department } from '../lib/types'

type Props = {
  departments: Department[]
  value: string | null
  onChange: (departmentId: string | null) => void
  id?: string
  className?: string
  style?: CSSProperties
  /** 為 false 時僅部門列表，未選時顯示 emptyLabel（用於須指定部門＋名冊負責人之流程） */
  includePersonal?: boolean
  emptyLabel?: string
}

/** 選「我的任務」或某部門；includePersonal=false 時須明確選部門 */
export function DepartmentSelect({
  departments,
  value,
  onChange,
  id,
  className = 'input',
  style,
  includePersonal = true,
  emptyLabel = '請選擇部門',
}: Props) {
  if (!includePersonal) {
    const v = value == null || value === '' ? '' : value
    return (
      <select
        id={id}
        className={className}
        style={style}
        value={v}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : e.target.value)
        }
        aria-label="歸屬部門"
      >
        <option value="">{emptyLabel}</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            🏢 {d.name}
          </option>
        ))}
      </select>
    )
  }

  const v = value == null || value === '' ? 'personal' : value
  return (
    <select
      id={id}
      className={className}
      style={style}
      value={v}
      onChange={(e) =>
        onChange(e.target.value === 'personal' ? null : e.target.value)
      }
      aria-label="任務歸屬：我的或部門"
    >
      <option value="personal">👤 我的任務</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          🏢 {d.name}
        </option>
      ))}
    </select>
  )
}
