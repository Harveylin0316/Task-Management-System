import type { AppData, TaskItem } from './types'
import { appendDoneTasksToAccomplished } from './weeklyAccomplished'

const PRI: Record<string, number> = { high: 0, mid: 1, low: 2 }

function sortOpenByPriority(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort(
    (a, b) => (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1),
  )
}

/**
 * 依目前儀表板資料產生週報四欄草稿（純文字，可再手改）。
 */
export function buildWeeklyDraftFromData(data: AppData): {
  accomplished: string
  next: string
  blockers: string
  reflection: string
} {
  const accomplished = data.done
    .map((t) => {
      const who = t.assignee?.trim()
      return who ? `- ✅ ${t.title}（${who}）` : `- ✅ ${t.title}`
    })
    .join('\n')

  const open: { t: TaskItem; tag: string }[] = [
    ...data.today.map((t) => ({ t, tag: '今日' })),
    ...sortOpenByPriority(data.active).map((t) => ({ t, tag: '進行中' })),
  ]
  const nextLines = open.slice(0, 14).map((x, i) => {
    const who = x.t.assignee?.trim()
    const extra = who ? ` · ${who}` : ''
    return `${i + 1}. ${x.t.title}【${x.tag}】${extra}`
  })
  const next =
    nextLines.length > 0
      ? nextLines.join('\n')
      : '（今日與進行中尚無任務，請手動寫下週重點。）'

  const blockers =
    data.waiting.length > 0
      ? data.waiting
          .map((w) => {
            const who = w.who?.trim() || '（未填對象）'
            const exp = w.expectedBy?.trim() ? ` · 預期 ${w.expectedBy}` : ''
            return `- ${who}：${w.title}（自 ${w.since}）${exp}`
          })
          .join('\n')
      : '（「等待回覆」清單目前為空。）'

  const doneN = data.done.length
  const activeN = data.active.length
  const waitingN = data.waiting.length
  const total = doneN + activeN
  const rate = total > 0 ? Math.round((doneN / total) * 100) : 0

  const reflection =
    `【本週數據】完成 ${doneN} 項 · 進行中 ${activeN} 項 · 等待回覆 ${waitingN} 件 · 完成率約 ${rate}%。\n\n` +
    `做得好／待改進／學到什麼：（在此補寫幾句即可）`

  return { accomplished, next, blockers, reflection }
}

/**
 * 合併帶入：本週完成永遠把「已完成任務」併入（去重）；其餘三欄僅在目前為空白時填入草稿。
 */
export function mergeWeeklyReviewDraft(
  current: AppData['weeklyReview'] | undefined,
  data: AppData,
): AppData['weeklyReview'] {
  const wr = current ?? {}
  const draft = buildWeeklyDraftFromData(data)
  const accomplished = appendDoneTasksToAccomplished(
    wr.accomplished ?? '',
    data.done,
  )
  const next = (wr.next ?? '').trim() ? wr.next : draft.next
  const blockers = (wr.blockers ?? '').trim() ? wr.blockers : draft.blockers
  const reflection = (wr.reflection ?? '').trim()
    ? wr.reflection
    : draft.reflection
  return { accomplished, next, blockers, reflection }
}
