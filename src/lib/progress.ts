import type { BigProject } from './types'

export function calcBigProjectProgress(p: BigProject): number {
  if (p.progress !== undefined && p.progress !== null) return p.progress
  const sub = p.subtasks ?? []
  if (!sub.length) return 0
  return Math.round(
    (sub.filter((s) => s.done).length / sub.length) * 100,
  )
}
