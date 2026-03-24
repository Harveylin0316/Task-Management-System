import { defaultData } from './defaultData'
import { migrateAppData } from './migrate'
import { prepareAppDataForPersist } from './persistPayload'
import type { AppData } from './types'

/** 同步本機儲存（測試或純離線用） */
export interface DataSource {
  load(): AppData
  save(data: AppData): void
}

/** Supabase 或非同步後端：由 Provider 於載入時 await */
export interface AsyncDataSource {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
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
        const payload = prepareAppDataForPersist(data)
        localStorage.setItem(STORE_KEY, JSON.stringify(payload))
      } catch {
        /* quota / private mode */
      }
    },
  }
}

/**
 * 讀取本機既有資料（供 Supabase 首次同步遷移，或離線備援）。
 */
export function readPersistedLocalAppData(): AppData | null {
  try {
    const raw =
      localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    return migrateAppData(JSON.parse(raw))
  } catch {
    return null
  }
}

/** 首次上雲後可清除主 key，避免與雲端雙寫（偏好與名冊備援已存於 payload） */
export function clearPersistedLocalAppData(): void {
  try {
    localStorage.removeItem(STORE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* */
  }
}

export function createAsyncLocalStorageDataSource(): AsyncDataSource {
  const inner = createLocalStorageDataSource()
  return {
    load: async () => inner.load(),
    save: async (data) => {
      inner.save(data)
    },
  }
}
