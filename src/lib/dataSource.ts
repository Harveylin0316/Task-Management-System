import { defaultData } from './defaultData'
import { migrateAppData } from './migrate'
import type { AppData } from './types'

/** 之後可改為 Supabase：實作非同步 load/save 並在 Provider await */
export interface DataSource {
  load(): AppData
  save(data: AppData): void
}

const LEGACY_KEY = 'wm_data_v3'
const STORE_KEY = 'wm_dashboard_react_v1'

export function createLocalStorageDataSource(): DataSource {
  return {
    load() {
      try {
        const raw =
          localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_KEY)
        if (!raw) return defaultData()
        return migrateAppData(JSON.parse(raw))
      } catch {
        return defaultData()
      }
    },
    save(data: AppData) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data))
      } catch {
        /* quota / private mode */
      }
    },
  }
}
