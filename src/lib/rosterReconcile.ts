import type { AppData } from './types'

/**
 * 套用遠端載入結果時，若雲端回傳空名冊且未標記「使用者刻意清空」，
 * 而記憶體中仍有名冊，則保留記憶體名冊（避免競態／舊快取把 UI 洗成空）。
 * 若 loaded.ui.teamRosterClearedByUser === true，一律以雲端為準。
 */
export function reconcileAppDataRoster(prev: AppData, loaded: AppData): AppData {
  if (loaded.ui.teamRosterClearedByUser === true) return loaded
  if (loaded.teamRoster.length > 0) return loaded
  if (prev.teamRoster.length === 0) return loaded
  const r = prev.teamRoster.map((m) => ({ ...m }))
  return {
    ...loaded,
    teamRoster: r,
  }
}
