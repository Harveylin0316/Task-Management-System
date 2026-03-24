import type { TeamRosterMember } from './types'

/** 負責人姓名是否為該部門名冊成員（姓名需與名冊完全一致） */
export function isAssigneeInDepartmentRoster(
  roster: TeamRosterMember[],
  departmentId: string,
  assigneeName: string,
): boolean {
  const t = assigneeName.trim()
  if (!t) return false
  return roster.some(
    (m) => m.name.trim() === t && m.departmentId === departmentId,
  )
}
