import { createDefaultDepartments } from './presetDepartments'
import type { AppData, BossWeeklyReport } from './types'

export function emptyBossWeeklyReport(): BossWeeklyReport {
  return {
    titleLine: '',
    opening: '',
    sectionFinancial: '',
    sectionMarketingBu: '',
    sectionSalesBu: '',
    sectionPartnerships: '',
    sectionCampaigns: '',
    sectionKeyIssues: '',
  }
}

export function defaultData(): AppData {
  return {
    departments: createDefaultDepartments(),
    teamRoster: [],
    teamRosterCloudBackup: [],
    ui: {},
    today: [],
    active: [],
    someday: [],
    done: [],
    waiting: [],
    projects: [],
    deadlines: [],
    meetingNotes: '',
    weeklyReview: {},
    bossWeeklyReport: emptyBossWeeklyReport(),
    bigProjects: [],
  }
}
