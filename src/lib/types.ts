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

export interface TaskItem {
  id: string
  title: string
  done: boolean
  priority: Priority
  created: string
  /** null 或 undefined 視為「我自己的任務」；有值則為該部門的工作任務 */
  departmentId: string | null
  /** 任務負責人（與專案參與者連動報表） */
  assignee?: string
  due?: string
  note?: string
  completedAt?: string
  /** 本週承諾（週會／週報對齊） */
  weeklyCommit?: boolean
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

export interface AppData {
  departments: Department[]
  /** 團隊成員名冊 */
  teamRoster: TeamRosterMember[]
  today: TaskItem[]
  active: TaskItem[]
  someday: TaskItem[]
  done: TaskItem[]
  waiting: WaitingItem[]
  projects: SmallProject[]
  deadlines: DeadlineItem[]
  meetingNotes: string
  weeklyReview: WeeklyReview
  bigProjects: BigProject[]
}

export type TaskSection = 'today' | 'active' | 'someday' | 'done'
