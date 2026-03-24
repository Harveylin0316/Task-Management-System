import type { TaskItem } from './types'

function lineForDoneTask(t: TaskItem): string {
  const who = t.assignee?.trim()
  return who
    ? `- ✅ ${t.title}（${who}）`
    : `- ✅ ${t.title}`
}

/** 將已完成任務列為清單行併入週報「本週完成」，略過已存在之相同行 */
export function appendDoneTasksToAccomplished(
  accomplished: string,
  done: TaskItem[],
): string {
  const existing = new Set(
    accomplished
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  )
  const additions: string[] = []
  for (const t of done) {
    const line = lineForDoneTask(t)
    if (!existing.has(line)) {
      additions.push(line)
      existing.add(line)
    }
  }
  if (!additions.length) return accomplished
  const base = accomplished.trimEnd()
  return base ? `${base}\n${additions.join('\n')}` : additions.join('\n')
}
