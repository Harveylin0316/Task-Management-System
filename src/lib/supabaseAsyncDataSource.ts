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
  if (payload != null) return migrateAppData(payload)

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

      const { error } = await client.auth.signInAnonymously()
      if (!error) {
        const {
          data: { session: s2 },
        } = await client.auth.getSession()
        if (s2?.user?.id) return loadFromCloud(client, s2.user.id)
      }

      if (error && isAnonymousBlocked(error)) {
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
        localOnly.save(data)
        return
      }

      if (error) throw explainAnonymousAuthFailure(error)
    },
  }
}
