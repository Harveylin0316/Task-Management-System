import type { CSSProperties } from 'react'
import type { Department } from '../lib/types'

type Props = {
  departments: Department[]
  value: string | null
  onChange: (departmentId: string | null) => void
  id?: string
  className?: string
  style?: CSSProperties
}

/** 選「我的任務」或某部門 */
export function DepartmentSelect({
  departments,
  value,
  onChange,
  id,
  className = 'input',
  style,
}: Props) {
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
