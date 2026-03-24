import type { AppData, TeamRosterMember } from './types'

function cloneRosterMembers(members: TeamRosterMember[]): TeamRosterMember[] {
  return members.map((m) => ({ ...m }))
}

/**
 * 寫入雲端／本機 JSON 前：同步名冊備援欄位。
 * 必須與 teamRoster 為「不同陣列實例」，避免與 teamRosterCloudBackup 共用參考導致一處突變兩欄同滅。
 */
export function prepareAppDataForPersist(data: AppData): AppData {
  const roster = cloneRosterMembers(data.teamRoster)
  const backup = roster.length > 0 ? cloneRosterMembers(roster) : []
  return {
    ...data,
    teamRoster: roster,
    teamRosterCloudBackup: backup,
  }
}
