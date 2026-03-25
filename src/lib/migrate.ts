import { defaultData } from './defaultData'
import { newId } from './id'
import { createDefaultDepartments } from './presetDepartments'
import type {
  AppData,
  AppUiPrefs,
  BigProject,
  DashboardTabId,
  DeadlineItem,
  Department,
  DepartmentKpi,
  Milestone,
  Risk,
  SmallProject,
  Subtask,
  TaskItem,
  TeamMember,
  TeamRosterMember,
  WaitingItem,
} from './types'

const VALID_DASHBOARD_TABS = new Set<DashboardTabId>([
  'today',
  'deptws',
  'mydept',
  'track',
  'tasks',
  'calendar',
  'weekly',
  'bossweekly',
  'projects',
])

function nid(): string {
  return newId()
}

/** 由 assignee 推斷名冊時使用穩定 id，避免每次 migrate 產生新 uuid 造成重複成員 */
function stableInferredMemberId(name: string): string {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `wm-r-${(h >>> 0).toString(36)}`
}

/** 名冊為空時，從任務負責人欄位還原（與「只打負責人、未走名冊頁」的情境相容） */
function inferTeamRosterFromTaskAssignees(
  d: Record<string, unknown>,
): TeamRosterMember[] {
  const names = new Set<string>()
  for (const key of ['today', 'active', 'someday', 'done'] as const) {
    const arr = d[key]
    if (!Array.isArray(arr)) continue
    for (const t of arr) {
      if (!t || typeof t !== 'object') continue
      const a = (t as Record<string, unknown>).assignee
      if (typeof a === 'string') {
        const s = a.trim()
        if (s.length > 0) names.add(s)
      }
    }
  }
  if (names.size === 0) return []
  return [...names].sort().map((name) => ({
    id: stableInferredMemberId(name),
    name,
    departmentId: null as string | null,
  }))
}

/**
 * 寫入雲端／本機前呼叫：名冊仍空且非使用者刻意清空時，用任務負責人補齊（與 migrate 一致）。
 */
export function augmentAppDataWithRosterFromAssigneesIfEmpty(data: AppData): AppData {
  if (data.teamRoster.length > 0 || data.ui.teamRosterClearedByUser === true) {
    return data
  }
  const inferred = inferTeamRosterFromTaskAssignees(
    data as unknown as Record<string, unknown>,
  )
  if (inferred.length === 0) return data
  const roster = inferred.map((m) => ({ ...m }))
  return {
    ...data,
    teamRoster: roster,
  }
}

/** 相容舊版無 id 的 JSON，並補齊欄位 */
export function migrateAppData(raw: unknown): AppData {
  const base = defaultData()
  if (!raw || typeof raw !== 'object') return base

  const d = raw as Record<string, unknown>

  const mapKpi = (k: Record<string, unknown>): DepartmentKpi => ({
    id: typeof k.id === 'string' ? k.id : nid(),
    name: String(k.name ?? ''),
    target: String(k.target ?? ''),
    current: String(k.current ?? ''),
    note: k.note != null ? String(k.note) : undefined,
  })

  const mapDepartment = (
    x: Partial<Department> & Record<string, unknown>,
  ): Department => ({
    id: typeof x.id === 'string' ? x.id : nid(),
    name: String(x.name ?? ''),
    kpis: Array.isArray(x.kpis)
      ? x.kpis.map((k) => mapKpi(k as unknown as Record<string, unknown>))
      : [],
  })

  const mapTeamRosterMember = (
    x: Partial<TeamRosterMember> & Record<string, unknown>,
  ): TeamRosterMember => ({
    id: typeof x.id === 'string' ? x.id : nid(),
    name: String(x.name ?? ''),
    departmentId:
      typeof x.departmentId === 'string' && x.departmentId.length > 0
        ? x.departmentId
        : null,
    role: x.role != null && String(x.role).trim() !== '' ? String(x.role) : undefined,
  })

  const mapTask = (t: Partial<TaskItem> & Record<string, unknown>): TaskItem => ({
    id: typeof t.id === 'string' ? t.id : nid(),
    title: String(t.title ?? ''),
    done: Boolean(t.done),
    priority:
      t.priority === 'high' || t.priority === 'low' || t.priority === 'mid'
        ? t.priority
        : 'mid',
    created: String(t.created ?? new Date().toLocaleDateString('zh-TW')),
    departmentId:
      typeof t.departmentId === 'string' && t.departmentId.length > 0
        ? t.departmentId
        : null,
    assignee:
      t.assignee != null && String(t.assignee).trim() !== ''
        ? String(t.assignee).trim()
        : undefined,
    due: t.due != null ? String(t.due) : undefined,
    note: t.note != null ? String(t.note) : undefined,
    completedAt:
      t.completedAt != null ? String(t.completedAt) : undefined,
    ...(t.weeklyCommit === true ? { weeklyCommit: true as const } : {}),
    ...(typeof t.smallProjectId === 'string' && t.smallProjectId.length > 0
      ? { smallProjectId: String(t.smallProjectId) }
      : {}),
  })

  const mapWaiting = (
    w: Partial<WaitingItem> & Record<string, unknown>,
  ): WaitingItem => ({
    id: typeof w.id === 'string' ? w.id : nid(),
    title: String(w.title ?? ''),
    who: String(w.who ?? ''),
    since: String(w.since ?? new Date().toLocaleDateString('zh-TW')),
    expectedBy:
      w.expectedBy != null && String(w.expectedBy).trim() !== ''
        ? String(w.expectedBy).trim()
        : undefined,
  })

  const mapSmallProject = (
    p: Partial<SmallProject> & Record<string, unknown>,
  ): SmallProject => ({
    id: typeof p.id === 'string' ? p.id : nid(),
    name: String(p.name ?? ''),
    due: String(p.due ?? ''),
    owner: String(p.owner ?? ''),
    progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
    departmentId:
      typeof p.departmentId === 'string' && p.departmentId.length > 0
        ? p.departmentId
        : null,
    participants: Array.isArray(p.participants)
      ? p.participants.map((x) => String(x))
      : [],
  })

  const mapDeadline = (
    x: Partial<DeadlineItem> & Record<string, unknown>,
  ): DeadlineItem => ({
    id: typeof x.id === 'string' ? x.id : nid(),
    title: String(x.title ?? ''),
    date: String(x.date ?? ''),
    owner: String(x.owner ?? ''),
  })

  const mapMilestone = (
    m: Partial<Milestone> & Record<string, unknown>,
  ): Milestone => ({
    id: typeof m.id === 'string' ? m.id : nid(),
    title: String(m.title ?? ''),
    date: String(m.date ?? ''),
    owner: String(m.owner ?? ''),
    done: Boolean(m.done),
  })

  const mapTeam = (
    t: Partial<TeamMember> & Record<string, unknown>,
  ): TeamMember => ({
    id: typeof t.id === 'string' ? t.id : nid(),
    name: String(t.name ?? ''),
    role: String(t.role ?? ''),
    tasks: String(t.tasks ?? ''),
  })

  const mapSubtask = (
    s: Partial<Subtask> & Record<string, unknown>,
  ): Subtask => ({
    id: typeof s.id === 'string' ? s.id : nid(),
    title: String(s.title ?? ''),
    owner: String(s.owner ?? ''),
    due: String(s.due ?? ''),
    done: Boolean(s.done),
  })

  const mapRisk = (r: Partial<Risk> & Record<string, unknown>): Risk => ({
    id: typeof r.id === 'string' ? r.id : nid(),
    title: String(r.title ?? ''),
    level:
      r.level === 'high' || r.level === 'low' || r.level === 'mid'
        ? r.level
        : 'mid',
    desc: String(r.desc ?? ''),
    owner: String(r.owner ?? ''),
  })

  const mapBig = (p: Partial<BigProject> & Record<string, unknown>): BigProject => {
    const st = p.status
    const status: BigProject['status'] =
      st === 'on-track' ||
      st === 'at-risk' ||
      st === 'blocked' ||
      st === 'done' ||
      st === 'active'
        ? st
        : 'active'
    return {
      id: typeof p.id === 'string' ? p.id : nid(),
      name: String(p.name ?? ''),
      goal: String(p.goal ?? ''),
      due: String(p.due ?? ''),
      pm: String(p.pm ?? ''),
      desc: String(p.desc ?? ''),
      departmentId:
        typeof p.departmentId === 'string' && p.departmentId.length > 0
          ? p.departmentId
          : null,
      status,
      progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
      milestones: Array.isArray(p.milestones)
        ? p.milestones.map((m) =>
            mapMilestone(m as unknown as Record<string, unknown>),
          )
        : [],
      team: Array.isArray(p.team)
        ? p.team.map((t) => mapTeam(t as unknown as Record<string, unknown>))
        : [],
      subtasks: Array.isArray(p.subtasks)
        ? p.subtasks.map((s) => mapSubtask(s as unknown as Record<string, unknown>))
        : [],
      risks: Array.isArray(p.risks)
        ? p.risks.map((r) => mapRisk(r as unknown as Record<string, unknown>))
        : [],
    }
  }

  const wr = (d.weeklyReview ?? {}) as Record<string, unknown>
  const bwrRaw = d.bossWeeklyReport
  const bwr =
    bwrRaw != null && typeof bwrRaw === 'object' && !Array.isArray(bwrRaw)
      ? (bwrRaw as Record<string, unknown>)
      : {}

  let departments: Department[] = Array.isArray(d.departments)
    ? d.departments.map((x) =>
        mapDepartment(x as unknown as Record<string, unknown>),
      )
    : base.departments
  if (!departments.length) departments = createDefaultDepartments()

  const uiRaw = (d.ui ?? {}) as Record<string, unknown>
  /** 僅在使用者刪光名冊或匯入空名冊時為 true；舊版 JSON 無此欄時，勿把 teamRoster:[] 當成「不可從備援還原」 */
  const rosterClearedByUser = uiRaw.teamRosterClearedByUser === true

  let teamRoster: TeamRosterMember[] = Array.isArray(d.teamRoster)
    ? d.teamRoster.map((x) =>
        mapTeamRosterMember(x as unknown as Record<string, unknown>),
      )
    : base.teamRoster

  if (
    !rosterClearedByUser &&
    teamRoster.length === 0 &&
    Array.isArray(d.teamRosterCloudBackup) &&
    d.teamRosterCloudBackup.length > 0
  ) {
    teamRoster = d.teamRosterCloudBackup.map((x) =>
      mapTeamRosterMember(x as unknown as Record<string, unknown>),
    )
  }

  if (!rosterClearedByUser && teamRoster.length === 0) {
    const fromAssignees = inferTeamRosterFromTaskAssignees(d)
    if (fromAssignees.length > 0) teamRoster = fromAssignees
  }

  const dt = uiRaw.defaultTab
  const ui: AppUiPrefs = {}
  if (typeof dt === 'string' && VALID_DASHBOARD_TABS.has(dt as DashboardTabId)) {
    ui.defaultTab = dt as DashboardTabId
  }
  if (Object.prototype.hasOwnProperty.call(uiRaw, 'deptWorkspaceFocusDeptId')) {
    const v = uiRaw.deptWorkspaceFocusDeptId
    if (typeof v === 'string') ui.deptWorkspaceFocusDeptId = v
    else if (v === null) ui.deptWorkspaceFocusDeptId = null
  }
  if (uiRaw.skipAnonymousSignIn === true) ui.skipAnonymousSignIn = true
  if (rosterClearedByUser) ui.teamRosterClearedByUser = true

  return {
    departments,
    teamRoster,
    ui,
    today: Array.isArray(d.today) ? d.today.map((t) => mapTask(t as Record<string, unknown>)) : base.today,
    active: Array.isArray(d.active)
      ? d.active.map((t) => mapTask(t as Record<string, unknown>))
      : base.active,
    someday: Array.isArray(d.someday)
      ? d.someday.map((t) => mapTask(t as Record<string, unknown>))
      : base.someday,
    done: Array.isArray(d.done)
      ? d.done.map((t) => mapTask(t as Record<string, unknown>))
      : base.done,
    waiting: Array.isArray(d.waiting)
      ? d.waiting.map((w) => mapWaiting(w as Record<string, unknown>))
      : base.waiting,
    projects: Array.isArray(d.projects)
      ? d.projects.map((p) => mapSmallProject(p as Record<string, unknown>))
      : base.projects,
    deadlines: Array.isArray(d.deadlines)
      ? d.deadlines.map((x) => mapDeadline(x as Record<string, unknown>))
      : base.deadlines,
    meetingNotes: String(d.meetingNotes ?? ''),
    weeklyReview: {
      accomplished: wr.accomplished != null ? String(wr.accomplished) : '',
      next: wr.next != null ? String(wr.next) : '',
      blockers: wr.blockers != null ? String(wr.blockers) : '',
      reflection: wr.reflection != null ? String(wr.reflection) : '',
    },
    bossWeeklyReport: {
      titleLine: String(bwr.titleLine ?? ''),
      opening: String(bwr.opening ?? ''),
      sectionFinancial: String(bwr.sectionFinancial ?? ''),
      sectionMarketingBu: String(bwr.sectionMarketingBu ?? ''),
      sectionSalesBu: String(bwr.sectionSalesBu ?? ''),
      sectionPartnerships: String(bwr.sectionPartnerships ?? ''),
      sectionCampaigns: String(bwr.sectionCampaigns ?? ''),
      sectionKeyIssues: String(bwr.sectionKeyIssues ?? ''),
    },
    bigProjects: Array.isArray(d.bigProjects)
      ? d.bigProjects.map((p) => mapBig(p as Record<string, unknown>))
      : base.bigProjects,
  }
}
