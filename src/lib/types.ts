export type Priority = 'high' | 'mid' | 'low'

/** 部門 KPI（目標／現況，由上而下對齊專案與任務追蹤） */
export interface DepartmentKpi {
  id: string
  name: string
  target: string
  current: string
  note?: string
}

/** 部門 — 任務可掛部門；預設為行銷、BD業務 */
export interface Department {
  id: string
  name: string
  kpis: DepartmentKpi[]
}

/** 全域團隊名冊（與任務負責人、專案參與者等對齊用） */
export interface TeamRosterMember {
  id: string
  name: string
  /** 所屬部門；null 表示未指定 */
  departmentId: string | null
  /** 職稱或備註，可留空 */
  role?: string
}

/** 看板任務（TaskItem）底下的子任務 */
export interface TaskSubtask {
  id: string
  title: string
  done: boolean
  /** 到期日，選填 */
  due?: string
  /** 負責人，選填（須為父任務所屬部門之名冊成員） */
  assignee?: string
}

export interface TaskItem {
  id: string
  title: string
  done: boolean
  priority: Priority
  created: string
  /** 歸屬部門（必填；建立任務時須指定） */
  departmentId: string | null
  /** 隸屬之小型專案（任務看板「專案進度」）；可為空代表僅部門任務 */
  smallProjectId?: string
  /** 任務負責人，選填（須為該部門名冊成員） */
  assignee?: string
  /** 到期日，選填 */
  due?: string
  note?: string
  completedAt?: string
  /** 本週承諾（週會／週報對齊） */
  weeklyCommit?: boolean
  /** 子任務清單 */
  subtasks?: TaskSubtask[]
}

export interface WaitingItem {
  id: string
  title: string
  who: string
  since: string
  /** 預期回覆日，建議 YYYY-MM-DD */
  expectedBy?: string
}

export interface SmallProject {
  id: string
  name: string
  due: string
  owner: string
  progress: number
  /** 專案歸屬部門（與 KPI、追蹤總覽連動） */
  departmentId: string | null
  /** 參與人員姓名，逗號分隔匯入後為陣列 */
  participants: string[]
}

export interface DeadlineItem {
  id: string
  title: string
  date: string
  owner: string
}

export interface WeeklyReview {
  accomplished?: string
  next?: string
  blockers?: string
  reflection?: string
}

/**
 * 給主管／總部的英文週報草稿（多為 tab 分隔表，可貼到 Email 或試算表）。
 */
export interface BossWeeklyReport {
  titleLine: string
  /** 開頭問候與報告區間、署名 */
  opening: string
  sectionFinancial: string
  sectionMarketingBu: string
  sectionSalesBu: string
  sectionPartnerships: string
  sectionCampaigns: string
  sectionKeyIssues: string
}

export type BigProjectStatus =
  | 'active'
  | 'on-track'
  | 'at-risk'
  | 'blocked'
  | 'done'

export interface Milestone {
  id: string
  title: string
  date: string
  owner: string
  done: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: string
  tasks: string
}

export interface Subtask {
  id: string
  title: string
  owner: string
  due: string
  done: boolean
}

export interface Risk {
  id: string
  title: string
  level: 'high' | 'mid' | 'low'
  desc: string
  owner: string
}

export interface BigProject {
  id: string
  name: string
  goal: string
  due: string
  pm: string
  desc: string
  /** 大型專案掛載部門（報表由上而下匯總） */
  departmentId: string | null
  status: BigProjectStatus
  progress: number
  milestones: Milestone[]
  team: TeamMember[]
  subtasks: Subtask[]
  risks: Risk[]
}

/** 主畫面分頁 id（與導覽列一致） */
export type DashboardTabId =
  | 'today'
  | 'deptws'
  | 'mydept'
  | 'track'
  | 'tasks'
  | 'calendar'
  | 'weekly'
  | 'bossweekly'
  | 'projects'

/** 與業務資料一併存於雲端 payload 的介面偏好 */
export interface AppUiPrefs {
  /** 進入 App 時預設開啟的分頁；未設定則為「今日」 */
  defaultTab?: DashboardTabId
  /** 部門工作台目前選中的部門 */
  deptWorkspaceFocusDeptId?: string | null
  /**
   * 後台停用匿名登入時為 true，與 payload 一併同步。
   * 尚無任何 session 時無法讀雲端，另以 sessionStorage 避免同分頁內重複打匿名 API。
   */
  skipAnonymousSignIn?: boolean
  /**
   * 使用者刻意清空名冊（刪除最後一員或匯入空名冊）時為 true。
   * upsert 時若為 false/缺省，且雲端仍有名冊，則不會用空白客戶端覆寫雲端名冊。
   */
  teamRosterClearedByUser?: boolean
}

export interface AppData {
  departments: Department[]
  /** 團隊成員名冊 */
  teamRoster: TeamRosterMember[]
  ui: AppUiPrefs
  today: TaskItem[]
  active: TaskItem[]
  someday: TaskItem[]
  done: TaskItem[]
  waiting: WaitingItem[]
  projects: SmallProject[]
  deadlines: DeadlineItem[]
  meetingNotes: string
  weeklyReview: WeeklyReview
  /** 給老闆／總部的週報草稿（與內部「週報回顧」分開） */
  bossWeeklyReport: BossWeeklyReport
  bigProjects: BigProject[]
}

/**
 * 寫入 Supabase／localStorage 的 JSON 形狀；內含舊版相容欄位 teamRosterCloudBackup（由 prepareAppDataForPersist 注入）。
 * React 狀態與 migrate 產出請一律使用 AppData。
 */
export type DashboardDataPayload = AppData & {
  teamRosterCloudBackup: TeamRosterMember[]
}

export type TaskSection = 'today' | 'active' | 'someday' | 'done'
