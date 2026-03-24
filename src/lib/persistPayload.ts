import type { AppData } from './types'

/** 寫入雲端／本機 JSON 前：同步名冊備援欄位（與 teamRoster 一致，空名冊則清空備援） */
export function prepareAppDataForPersist(data: AppData): AppData {
  return {
    ...data,
    teamRosterCloudBackup:
      data.teamRoster.length > 0 ? data.teamRoster : [],
  }
}
