import type { SupabaseClient } from '@supabase/supabase-js'
import {
  clearPersistedLocalAppData,
  createLocalStorageDataSource,
  readPersistedLocalAppData,
  type AsyncDataSource,
} from './dataSource'
import { defaultData } from './defaultData'
import { migrateAppData } from './migrate'
import type { AppData } from './types'

export type SupabaseAsyncDataSource = AsyncDataSource & {
  /** 匿名被 API 擋下且尚無任何登入 session 時為 true，需改 Email 登入才會寫雲端 */
  needsEmailToReachCloud(): boolean
}

/** 曾偵測到匿名被 API 停用時寫入，之後不再呼叫 signInAnonymously，避免每次開頁都 422 洗版 */
const SKIP_ANONYMOUS_KEY = 'wm_supabase_skip_anonymous_v1'

function shouldSkipAnonymousSignIn(): boolean {
  try {
    return localStorage.getItem(SKIP_ANONYMOUS_KEY) === '1'
  } catch {
    return false
  }
}

function rememberAnonymousDisabledByApi(): void {
  try {
    localStorage.setItem(SKIP_ANONYMOUS_KEY, '1')
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

/**
 * 雲端若為 {}、缺 teamRoster、或 teamRoster 為 null，migrate 後名冊會變空。
 * 僅在雲端「未明確寫入 teamRoster: []」時，用 localStorage 備份補回名冊，避免登入／重新載入後被洗白。
 */
function mergeTeamRosterFromLocalIfNeeded(
  rawPayload: Record<string, unknown>,
  app: AppData,
): AppData {
  const explicitEmptyRoster =
    'teamRoster' in rawPayload &&
    Array.isArray(rawPayload.teamRoster) &&
    rawPayload.teamRoster.length === 0
  if (explicitEmptyRoster) return app
  if (app.teamRoster.length > 0) return app
  const local = readPersistedLocalAppData()
  if (!local?.teamRoster?.length) return app
  return {
    ...app,
    teamRoster: migrateAppData(local).teamRoster,
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
    const merged = mergeTeamRosterFromLocalIfNeeded(raw, app)
    if (merged.teamRoster.length > app.teamRoster.length) {
      const { error: upErr } = await client.from('dashboard_data').upsert(
        {
          user_id: userId,
          payload: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (upErr) throw upErr
    }
    return merged
  }
  if (payload != null) {
    return migrateAppData(payload)
  }

  const local = readPersistedLocalAppData()
  if (local) {
    const { error: upErr } = await client.from('dashboard_data').upsert(
      {
        user_id: userId,
        payload: local,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (upErr) throw upErr
    clearPersistedLocalAppData()
    return local
  }

  return defaultData()
}

async function upsertPayload(
  client: SupabaseClient,
  userId: string,
  data: AppData,
): Promise<void> {
  const { error } = await client.from('dashboard_data').upsert(
    {
      user_id: userId,
      payload: data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export function isSupabaseAsyncDataSource(
  s: AsyncDataSource,
): s is SupabaseAsyncDataSource {
  return (
    'needsEmailToReachCloud' in s &&
    typeof (s as SupabaseAsyncDataSource).needsEmailToReachCloud === 'function'
  )
}

export function createSupabaseAsyncDataSource(
  client: SupabaseClient,
): SupabaseAsyncDataSource {
  const localOnly = createLocalStorageDataSource()
  let needsEmail = false

  return {
    needsEmailToReachCloud: () => needsEmail,

    async load() {
      needsEmail = false
      const {
        data: { session },
      } = await client.auth.getSession()
      if (session?.user?.id) {
        return loadFromCloud(client, session.user.id)
      }

      if (shouldSkipAnonymousSignIn()) {
        needsEmail = true
        return readPersistedLocalAppData() ?? defaultData()
      }

      const { error } = await client.auth.signInAnonymously()
      if (!error) {
        const {
          data: { session: s2 },
        } = await client.auth.getSession()
        if (s2?.user?.id) return loadFromCloud(client, s2.user.id)
      }

      if (error && isAnonymousBlocked(error)) {
        rememberAnonymousDisabledByApi()
        needsEmail = true
        return readPersistedLocalAppData() ?? defaultData()
      }

      if (error) throw explainAnonymousAuthFailure(error)
      return defaultData()
    },

    async save(data: AppData) {
      const {
        data: { session },
      } = await client.auth.getSession()
      if (session?.user?.id) {
        await upsertPayload(client, session.user.id, data)
        return
      }

      if (shouldSkipAnonymousSignIn()) {
        localOnly.save(data)
        return
      }

      const { error } = await client.auth.signInAnonymously()
      if (!error) {
        const {
          data: { session: s2 },
        } = await client.auth.getSession()
        if (s2?.user?.id) {
          await upsertPayload(client, s2.user.id, data)
          return
        }
      }

      if (error && isAnonymousBlocked(error)) {
        rememberAnonymousDisabledByApi()
        localOnly.save(data)
        return
      }

      if (error) throw explainAnonymousAuthFailure(error)
    },
  }
}
