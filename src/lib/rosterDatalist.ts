import type { TeamRosterMember } from './types'

export const ROSTER_DATALIST_ALL = 'wm-roster-all'

/** 有該部門名冊成員時用部門專用 datalist，否則用全名冊 */
export function rosterDatalistIdForDepartment(
  departmentId: string | null | undefined,
  roster: TeamRosterMember[],
): string {
  if (departmentId == null || departmentId === '') return ROSTER_DATALIST_ALL
  const has = roster.some((m) => m.departmentId === departmentId)
  return has ? `wm-roster-dept-${departmentId}` : ROSTER_DATALIST_ALL
}
