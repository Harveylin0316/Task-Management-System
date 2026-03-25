import type { TeamRosterMember, TaskSubtask } from './types'

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

/**
 * 父任務部門變更或清空時，移除子任務上已不符合該部門名冊的負責人。
 */
export function reconcileSubtaskAssigneesToDepartment(
  subtasks: TaskSubtask[] | undefined,
  departmentId: string | null,
  roster: TeamRosterMember[],
): TaskSubtask[] | undefined {
  if (!subtasks?.length) return subtasks
  const out = subtasks.map((s) => {
    const a = s.assignee?.trim()
    if (!a) return s
    if (
      departmentId == null ||
      !isAssigneeInDepartmentRoster(roster, departmentId, a)
    ) {
      const { assignee: _, ...rest } = s
      return rest as TaskSubtask
    }
    return s
  })
  const unchanged =
    out.length === subtasks.length &&
    out.every((x, i) => x === subtasks[i])
  return unchanged ? subtasks : out
}
