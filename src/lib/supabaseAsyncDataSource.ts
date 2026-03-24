import type { SupabaseClient } from '@supabase/supabase-js'
import {
  clearPersistedLocalAppData,
  createLocalStorageDataSource,
  readPersistedLocalAppData,
  type AsyncDataSource,
} from './dataSource'
import { defaultData } from './defaultData'
import {
  augmentAppDataWithRosterFromAssigneesIfEmpty,
  migrateAppData,
} from './migrate'
import { prepareAppDataForPersist } from './persistPayload'
import type { AppData } from './types'

export type SupabaseAsyncDataSource = AsyncDataSource & {
  /** 匿名被 API 擋下且尚無任何登入 session 時為 true，需改 Email 登入才會寫雲端 */
  needsEmailToReachCloud(): boolean
  /**
   * 上次 load 是否允許觸發自動存檔：已自雲端讀過 dashboard_data，或離線改走本機。
   * 若皆否（例如異常提早回傳空白），應禁止 auto-save，以免空白狀態覆寫雲端名冊。
   */
  allowAutoSaveAfterLoad(): boolean
}

/**
 * 無 auth session 時無法讀寫雲端 payload；用 sessionStorage 避免同分頁重複打匿名 API。
 * 已登入時偏好以 payload.ui.skipAnonymousSignIn 為準並與此同步。
 */
const SKIP_ANONYMOUS_KEY = 'wm_supabase_skip_anonymous_v1'

function shouldSkipAnonymousSignIn(): boolean {
  try {
    return sessionStorage.getItem(SKIP_ANONYMOUS_KEY) === '1'
  } catch {
    return false
  }
}

function syncSkipAnonymousSessionFlag(fromUi: AppData['ui']): void {
  try {
    if (fromUi.skipAnonymousSignIn) sessionStorage.setItem(SKIP_ANONYMOUS_KEY, '1')
    else sessionStorage.removeItem(SKIP_ANONYMOUS_KEY)
  } catch {
    /* */
  }
}

function rememberAnonymousDisabledByApi(): void {
  try {
    sessionStorage.setItem(SKIP_ANONYMOUS_KEY, '1')
  } catch {
    /* */
  }
}

function authErrorCode(error: { message: string; code?: string }): string {
  return typeof error.code === 'string' ? error.code : ''
}

function isAnonymousBlocked(error: {
  message: string
  code?: string
}): boolean {
  return (
    authErrorCode(error) === 'anonymous_provider_disabled' ||
    /anonymous sign-ins are disabled/i.test(error.message)
  )
}

function explainAnonymousAuthFailure(error: {
  message: string
  code?: string
}): Error {
  const code = authErrorCode(error)
  const base = code ? `${error.message} [${code}]` : error.message
  if (!isAnonymousBlocked(error)) return new Error(base)
  return new Error(
    `${base} — 後台已開仍出現時請檢查：① .env 網址與專案一致；② Providers 按 Save；③ 開啟 Allow new users to sign up；④ CAPTCHA 需關閉或整合 token。亦可改用畫面上方「Email 登入雲端」。`,
  )
}

function withSkipAnonymousUi(data: AppData): AppData {
  return {
    ...data,
    ui: { ...data.ui, skipAnonymousSignIn: true },
  }
}

async function loadFromCloud(
  client: SupabaseClient,
  userId: string,
): Promise<AppData> {
  const { data, error } = await client
    .from('dashboard_data')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  const payload = data?.payload ?? null
  if (
    payload != null &&
    typeof payload === 'object' &&
    !Array.isArray(payload)
  ) {
    const raw = payload as Record<string, unknown>
    const app = migrateAppData(payload)
    syncSkipAnonymousSessionFlag(app.ui)

    const rawUi = (raw.ui ?? {}) as Record<string, unknown>
    const rosterClearedByUser = rawUi.teamRosterClearedByUser === true
    const rawRosterEmpty =
      !Array.isArray(raw.teamRoster) || raw.teamRoster.length === 0
    /** migrate 可能從 teamRosterCloudBackup 或任務 assignee 補回名冊，需寫回 DB */
    const shouldPersistRosterRepair =
      !rosterClearedByUser && rawRosterEmpty && app.teamRoster.length > 0

    if (shouldPersistRosterRepair) {
      const toSave = prepareAppDataForPersist(app)
      const { error: upErr } = await client.from('dashboard_data').upsert(
        {
          user_id: userId,
          payload: toSave,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (upErr) throw upErr
    }
    return app
  }
  if (payload != null) {
    return migrateAppData(payload)
  }

  const local = readPersistedLocalAppData()
  if (local) {
    const { error: upErr } = await client.from('dashboard_data').upsert(
      {
        user_id: userId,
        payload: prepareAppDataForPersist(local),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (upErr) throw upErr
    clearPersistedLocalAppData()
    syncSkipAnonymousSessionFlag(local.ui)
    return local
  }

  return defaultData()
}

/**
 * 寫入雲端；若客戶端名冊為空且非使用者刻意清空，而資料庫內仍有名冊，則合併保留名冊（避免誤載入空白後覆寫）。
 * 有合併時回傳合併後的 AppData，供 UI 同步。
 */
async function upsertPayload(
  client: SupabaseClient,
  userId: string,
  data: AppData,
): Promise<AppData | undefined> {
  let outgoing = prepareAppDataForPersist(
    augmentAppDataWithRosterFromAssigneesIfEmpty(data),
  )
  let didMergeRosterFromServer = false

  const { data: row, error: selErr } = await client
    .from('dashboard_data')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle()
  if (selErr) throw selErr

  const existingPayload = row?.payload
  if (
    outgoing.teamRoster.length === 0 &&
    outgoing.teamRosterCloudBackup.length === 0 &&
    outgoing.ui.teamRosterClearedByUser !== true &&
    existingPayload != null &&
    typeof existingPayload === 'object' &&
    !Array.isArray(existingPayload)
  ) {
    const existingApp = migrateAppData(existingPayload)
    if (existingApp.teamRoster.length > 0) {
      outgoing = {
        ...outgoing,
        teamRoster: existingApp.teamRoster,
        teamRosterCloudBackup: existingApp.teamRoster,
      }
      didMergeRosterFromServer = true
    }
  }

  const { error } = await client.from('dashboard_data').upsert(
    {
      user_id: userId,
      payload: outgoing,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  return didMergeRosterFromServer ? outgoing : undefined
}

export function isSupabaseAsyncDataSource(
  s: AsyncDataSource,
): s is SupabaseAsyncDataSource {
  return (
    'needsEmailToReachCloud' in s &&
    typeof (s as SupabaseAsyncDataSource).needsEmailToReachCloud === 'function' &&
    'allowAutoSaveAfterLoad' in s &&
    typeof (s as SupabaseAsyncDataSource).allowAutoSaveAfterLoad === 'function'
  )
}

export function createSupabaseAsyncDataSource(
  client: SupabaseClient,
): SupabaseAsyncDataSource {
  const localOnly = createLocalStorageDataSource()
  let needsEmail = false
  /** 上次 load 是否已執行過 loadFromCloud（成功讀寫雲端列） */
  let cloudHydratedAtLastLoad = false
  /** 串行 save，避免 debounce 與 pagehide 兩次 upsert 交錯造成最後寫入蓋掉名冊 */
  let saveChain: Promise<AppData | undefined> = Promise.resolve(undefined)

  return {
    needsEmailToReachCloud: () => needsEmail,

    allowAutoSaveAfterLoad: () => cloudHydratedAtLastLoad || needsEmail,

    async load() {
      needsEmail = false
      cloudHydratedAtLastLoad = false
      const {
        data: { session },
      } = await client.auth.getSession()
      if (session?.user?.id) {
        const app = await loadFromCloud(client, session.user.id)
        cloudHydratedAtLastLoad = true
        return app
      }

      if (shouldSkipAnonymousSignIn()) {
        needsEmail = true
        const local = readPersistedLocalAppData()
        return migrateAppData(withSkipAnonymousUi(local ?? defaultData()))
      }

      const { error } = await client.auth.signInAnonymously()
      if (!error) {
        const {
          data: { session: s2 },
        } = await client.auth.getSession()
        if (s2?.user?.id) {
          const app = await loadFromCloud(client, s2.user.id)
          cloudHydratedAtLastLoad = true
          return app
        }
      }

      if (error && isAnonymousBlocked(error)) {
        rememberAnonymousDisabledByApi()
        needsEmail = true
        const local = readPersistedLocalAppData()
        return migrateAppData(withSkipAnonymousUi(local ?? defaultData()))
      }

      if (error) throw explainAnonymousAuthFailure(error)
      return defaultData()
    },

    async save(data: AppData) {
      const run = async (): Promise<AppData | undefined> => {
        let {
          data: { session },
        } = await client.auth.getSession()
        if (!session?.user?.id) {
          await client.auth.refreshSession().catch(() => {})
          ;({
            data: { session },
          } = await client.auth.getSession())
        }
        if (session?.user?.id) {
          const repaired = await upsertPayload(client, session.user.id, data)
          syncSkipAnonymousSessionFlag(data.ui)
          return repaired
        }

        if (shouldSkipAnonymousSignIn()) {
          localOnly.save(data)
          return undefined
        }

        const { error } = await client.auth.signInAnonymously()
        if (!error) {
          const {
            data: { session: s2 },
          } = await client.auth.getSession()
          if (s2?.user?.id) {
            const repaired = await upsertPayload(client, s2.user.id, data)
            syncSkipAnonymousSessionFlag(data.ui)
            return repaired
          }
        }

        if (error && isAnonymousBlocked(error)) {
          rememberAnonymousDisabledByApi()
          localOnly.save(data)
          return undefined
        }

        if (error) throw explainAnonymousAuthFailure(error)
        return undefined
      }

      const next = saveChain.then(() => run())
      saveChain = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    },
  }
}
