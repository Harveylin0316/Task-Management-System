import type { CSSProperties } from 'react'
import type { TeamRosterMember } from '../lib/types'

type Props = {
  roster: TeamRosterMember[]
  /** 僅列出此部門名冊成員；null 時無選項（請先選部門） */
  departmentId: string | null
  value: string
  onChange: (name: string) => void
  id?: string
  className?: string
  style?: CSSProperties
  /** 為 true 時允許選「（可留空）」 */
  allowEmpty?: boolean
  disabled?: boolean
}

/** 負責人／PM：依部門篩選團隊名冊 */
export function RosterMemberSelect({
  roster,
  departmentId,
  value,
  onChange,
  id,
  className = 'input',
  style,
  allowEmpty = false,
  disabled = false,
}: Props) {
  const members =
    departmentId != null && departmentId !== ''
      ? roster.filter((m) => m.departmentId === departmentId)
      : []
  const uniqueNames = [
    ...new Set(members.map((m) => m.name.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'zh-Hant'))

  const vTrim = value.trim()
  const orphanInList =
    vTrim && !uniqueNames.includes(vTrim) ? vTrim : null

  const noDept = departmentId == null || departmentId === ''
  const noMembers = !noDept && uniqueNames.length === 0
  const selectDisabled =
    disabled || (!allowEmpty && (noDept || noMembers))

  let placeholder = '請先選部門'
  if (!noDept && noMembers) placeholder = '名冊尚無此部門成員'
  if (!noDept && uniqueNames.length) placeholder = '請選負責人'

  return (
    <select
      id={id}
      className={className}
      style={style}
      disabled={selectDisabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="負責人（團隊名冊）"
    >
      {allowEmpty ? (
        <option value="">（可留空）</option>
      ) : (
        <option value="">{placeholder}</option>
      )}
      {orphanInList ? (
        <option value={orphanInList}>{orphanInList}（不在名冊）</option>
      ) : null}
      {uniqueNames.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  )
}
