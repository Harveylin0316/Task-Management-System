import type { AppData, DashboardDataPayload, TeamRosterMember } from './types'

function cloneRosterMembers(members: TeamRosterMember[]): TeamRosterMember[] {
  return members.map((m) => ({ ...m }))
}

/**
 * 寫入雲端／本機 JSON 前：深拷貝名冊並附加 teamRosterCloudBackup（與 teamRoster 不同陣列實例，供舊資料還原）。
 */
export function prepareAppDataForPersist(data: AppData): DashboardDataPayload {
  const roster = cloneRosterMembers(data.teamRoster)
  const backup = roster.length > 0 ? cloneRosterMembers(roster) : []
  return {
    ...data,
    teamRoster: roster,
    teamRosterCloudBackup: backup,
  }
}

export function payloadToAppData(p: DashboardDataPayload): AppData {
  const { teamRosterCloudBackup: _, ...rest } = p
  return rest
}
