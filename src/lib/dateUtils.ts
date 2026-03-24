/** 本地日曆日的開始（00:00） */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function toISODateLocal(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 解析截止／等待起算日：ISO YYYY-MM-DD、zh-TW 2025/3/24、2025年3月24日、或可被 Date 解析的字串。
 */
export function parseFlexibleDate(input: string): Date | null {
  const t = input.trim()
  if (!t) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(t + 'T12:00:00')
    return Number.isNaN(d.getTime()) ? null : d
  }

  const slash = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (slash) {
    const d = new Date(
      Number(slash[1]),
      Number(slash[2]) - 1,
      Number(slash[3]),
      12,
      0,
      0,
    )
    return Number.isNaN(d.getTime()) ? null : d
  }

  const zh = t.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (zh) {
    const d = new Date(
      Number(zh[1]),
      Number(zh[2]) - 1,
      Number(zh[3]),
      12,
      0,
      0,
    )
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toDateInputValue(s?: string): string {
  if (!s?.trim()) return ''
  const d = parseFlexibleDate(s)
  if (!d) return ''
  return toISODateLocal(d)
}

/** 自 since 日曆日起算至今日經過的天數（同日為 0） */
export function waitingDaysElapsed(sinceStr: string): number {
  const since = parseFlexibleDate(sinceStr)
  if (!since) return 0
  const today = startOfLocalDay(new Date())
  const start = startOfLocalDay(since)
  const diff = Math.round((today.getTime() - start.getTime()) / 86400000)
  return Math.max(0, diff)
}

export type DueKind = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export function dueKindAndOffset(due?: string): {
  kind: DueKind
  daysUntil: number
} {
  if (!due?.trim()) return { kind: 'none', daysUntil: 0 }
  const d = parseFlexibleDate(due)
  if (!d) return { kind: 'none', daysUntil: 0 }
  const today = startOfLocalDay(new Date())
  const dueDay = startOfLocalDay(d)
  const daysUntil = Math.round(
    (dueDay.getTime() - today.getTime()) / 86400000,
  )
  if (daysUntil < 0) return { kind: 'overdue', daysUntil }
  if (daysUntil === 0) return { kind: 'today', daysUntil }
  if (daysUntil <= 3) return { kind: 'soon', daysUntil }
  return { kind: 'later', daysUntil }
}

export function dueBadgeLabel(kind: DueKind, daysUntil: number): string {
  switch (kind) {
    case 'overdue':
      return '已逾期'
    case 'today':
      return '今日截止'
    case 'soon':
      return `${daysUntil} 天內`
    case 'later':
      return '將到期'
    default:
      return ''
  }
}

export function expectedReplyOverdue(expectedBy?: string): boolean {
  if (!expectedBy?.trim()) return false
  const d = parseFlexibleDate(expectedBy)
  if (!d) return false
  return startOfLocalDay(d) < startOfLocalDay(new Date())
}
