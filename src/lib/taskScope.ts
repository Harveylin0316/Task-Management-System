import type { TaskItem } from './types'

/** 篩選：全部 | 僅個人 | 某部門 id */
export type TaskScopeFilter = 'all' | 'personal' | string

export function taskMatchesScope(
  item: TaskItem,
  filter: TaskScopeFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'personal') return item.departmentId == null
  return item.departmentId === filter
}
