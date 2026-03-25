import type { Department, TeamRosterMember } from './types'
import { isAssigneeInDepartmentRoster } from './taskAssignment'

export type TextImportBoardSection = 'today' | 'active' | 'someday'

/** 解析成功、可匯入看板的一列 */
export type TextImportParsedRow = {
  section: TextImportBoardSection
  title: string
  departmentId: string
  assignee?: string
  due?: string
  lineNumber: number
  warnings: string[]
}

export type TextImportSkippedLine = {
  lineNumber: number
  raw: string
  reason: string
}

export type TextImportParseContext = {
  /** 無法從文字辨識部門時使用（智慧解析單欄時必填） */
  defaultDepartmentId: string | null
  defaultSection: TextImportBoardSection
  departments: Department[]
  roster: TeamRosterMember[]
}

const SECTION_PREFIX = /^\[(today|active|someday)\]\s*/i
const SECTION_ZH: Record<string, TextImportBoardSection> = {
  今日: 'today',
  今天: 'today',
  進行中: 'active',
  日後: 'someday',
  日後再說: 'someday',
  以后: 'someday',
  稍後: 'someday',
}

function stripLeadingSection(
  line: string,
  fallback: TextImportBoardSection,
): { rest: string; section: TextImportBoardSection } {
  const m = line.match(SECTION_PREFIX)
  if (m) {
    const key = m[1].toLowerCase() as 'today' | 'active' | 'someday'
    return { rest: line.slice(m[0].length).trim(), section: key }
  }
  const zh = line.match(/^【?\s*(今日|今天|進行中|日後再說|日後|稍後|以后)\s*】?\s*[：:]\s*/)
  if (zh) {
    const word = zh[1].replace(/\s/g, '')
    const sec = SECTION_ZH[word] ?? fallback
    return { rest: line.slice(zh[0].length).trim(), section: sec }
  }
  return { rest: line, section: fallback }
}

function stripBullet(rest: string): string {
  return rest
    .replace(/^[\s\u3000]*(?:[-*+•]|\d+[.)、]|[\u2460-\u2473])\s*/, '')
    .trim()
}

function splitColumns(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((s) => s.trim())
  }
  if (line.includes('|')) {
    return line.split('|').map((s) => s.trim())
  }
  return [line.trim()]
}

function isDateLike(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return true
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(t)) return true
  if (/^\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?/.test(t)) return true
  return false
}

function resolveDepartmentName(
  name: string,
  defaultId: string | null,
  departments: Department[],
): { id: string | null; warning?: string } {
  const t = name.trim()
  if (!t) {
    return defaultId ? { id: defaultId } : { id: null }
  }
  const exact = departments.find((d) => d.name.trim() === t)
  if (exact) return { id: exact.id }
  const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const nt = norm(t)
  const loose = departments.find((d) => norm(d.name) === nt)
  if (loose) return { id: loose.id }
  const partial = departments.find(
    (d) =>
      t.includes(d.name.trim()) ||
      d.name.includes(t) ||
      nt.includes(norm(d.name)),
  )
  if (partial) return { id: partial.id }
  if (defaultId) {
    return {
      id: defaultId,
      warning: `部門「${t}」未對應現有部門，已改用預設部門`,
    }
  }
  return { id: null }
}

function pickAssigneeForDept(
  name: string | undefined,
  departmentId: string,
  roster: TeamRosterMember[],
): { assignee?: string; warning?: string } {
  const raw = name?.trim()
  if (!raw) return {}
  if (isAssigneeInDepartmentRoster(roster, departmentId, raw)) {
    return { assignee: raw }
  }
  return { warning: `負責人「${raw}」非該部門名冊，已略過` }
}

function heuristicLine(
  line: string,
  ctx: TextImportParseContext,
  lineNumber: number,
  section: TextImportBoardSection,
): { row: TextImportParsedRow } | { skip: string } {
  if (!ctx.defaultDepartmentId) {
    return {
      skip: '單欄文字須設定「預設部門」，才能自動對應名冊與部門',
    }
  }
  let rest = stripBullet(line)
  let due: string | undefined
  const dateRe =
    /(\d{4}-\d{2}-\d{2}|\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?|\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?)/g
  let m: RegExpExecArray | null
  const dates: string[] = []
  while ((m = dateRe.exec(rest)) !== null) {
    dates.push(m[1].trim())
  }
  if (dates.length) {
    due = dates[0]
    for (const d of dates) {
      rest = rest.split(d).join(' ')
    }
    rest = rest.replace(/\s+/g, ' ').trim()
  }

  const deptId = ctx.defaultDepartmentId
  const candidates = ctx.roster
    .filter((m) => m.departmentId === deptId)
    .map((x) => x.name.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  let assignee: string | undefined
  const warnings: string[] = []
  for (const n of candidates) {
    if (rest.includes(n)) {
      assignee = n
      rest = rest.split(n).join(' ').replace(/\s+/g, ' ').trim()
      break
    }
  }

  const title = stripBullet(rest).replace(/\s+/g, ' ').trim()
  if (!title) {
    return { skip: '辨識後標題為空' }
  }

  return {
    row: {
      section,
      title,
      departmentId: deptId,
      assignee,
      due,
      lineNumber,
      warnings,
    },
  }
}

function parseDelimited(
  parts: string[],
  ctx: TextImportParseContext,
  lineNumber: number,
  section: TextImportBoardSection,
): { row: TextImportParsedRow } | { skip: string } {
  const warnings: string[] = []
  const title = (parts[0] ?? '').trim()
  if (!title) return { skip: '標題為空' }

  let assignee: string | undefined
  let due: string | undefined
  let deptName = ''

  if (parts.length === 2) {
    const p1 = parts[1].trim()
    if (isDateLike(p1)) {
      due = p1
    } else if (p1) {
      assignee = p1
    }
  } else if (parts.length >= 3) {
    assignee = parts[1]?.trim() || undefined
    due = parts[2]?.trim() || undefined
    deptName = parts[3]?.trim() ?? ''
  }

  const deptRes = resolveDepartmentName(deptName, ctx.defaultDepartmentId, ctx.departments)
  if (!deptRes.id) {
    return { skip: '無法辨識部門（請在文字中寫部門名稱或設定預設部門）' }
  }
  if (deptRes.warning) warnings.push(deptRes.warning)

  const asn = pickAssigneeForDept(assignee, deptRes.id, ctx.roster)
  if (asn.warning) warnings.push(asn.warning)

  return {
    row: {
      section,
      title,
      departmentId: deptRes.id,
      assignee: asn.assignee,
      due: due || undefined,
      lineNumber,
      warnings,
    },
  }
}

/**
 * 從純文字解析可匯入的任務列。
 * - 多欄：以 Tab 或 | 分隔，格式為「標題 | 負責人 | 到期 | 部門」，後三欄可留空（部門空則用預設部門）。
 * - 兩欄：若第二欄像日期 → 標題 + 到期；否則 → 標題 + 負責人。
 * - 單欄：智慧模式（須設定預設部門）— 從文中擷取日期、比對該部門名冊姓名為負責人，其餘為標題。
 * - 行首可選 [today] / [active] / [someday] 或「今日：」「進行中：」等指定區塊。
 */
export function parseTasksFromPlainText(
  raw: string,
  ctx: TextImportParseContext,
): { rows: TextImportParsedRow[]; skipped: TextImportSkippedLine[] } {
  const rows: TextImportParsedRow[] = []
  const skipped: TextImportSkippedLine[] = []
  const lines = raw.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    let line = lines[i].trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue

    const { rest, section } = stripLeadingSection(line, ctx.defaultSection)
    line = stripBullet(rest)
    if (!line) continue

    const parts = splitColumns(line)
    let result: { row: TextImportParsedRow } | { skip: string }

    if (parts.length >= 2) {
      result = parseDelimited(parts, ctx, lineNumber, section)
    } else {
      result = heuristicLine(parts[0] ?? '', ctx, lineNumber, section)
    }

    if ('skip' in result) {
      skipped.push({ lineNumber, raw: lines[i].trim(), reason: result.skip })
    } else {
      rows.push(result.row)
    }
  }

  return { rows, skipped }
}
