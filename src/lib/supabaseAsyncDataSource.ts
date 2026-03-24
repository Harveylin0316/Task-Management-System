import type { SupabaseClient } from '@supabase/supabase-js'
import {
  clearPersistedLocalAppData,
  readPersistedLocalAppData,
  type AsyncDataSource,
} from './dataSource'
import { defaultData } from './defaultData'
import { migrateAppData } from './migrate'
import type { AppData } from './types'

async function ensureSession(client: SupabaseClient): Promise<void> {
  const {
    data: { session },
  } = await client.auth.getSession()
  if (session) return
  const { error } = await client.auth.signInAnonymously()
  if (error) throw new Error(error.message)
}

/** getUser() 有時在剛 sign-in 後仍為空；以 session 為準較穩 */
async function getAuthedUserId(client: SupabaseClient): Promise<string> {
  await ensureSession(client)
  const {
    data: { session },
  } = await client.auth.getSession()
  const fromSession = session?.user?.id
  if (fromSession) return fromSession
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  if (error) throw error
  if (!user?.id) throw new Error('未取得使用者，請確認 Supabase 已啟用 Anonymous 登入')
  return user.id
}

async function fetchPayload(
  client: SupabaseClient,
  userId: string,
): Promise<unknown | null> {
  const { data, error } = await client
    .from('dashboard_data')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.payload ?? null
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

export function createSupabaseAsyncDataSource(
  client: SupabaseClient,
): AsyncDataSource {
  return {
    async load() {
      const userId = await getAuthedUserId(client)

      const payload = await fetchPayload(client, userId)
      if (payload != null) return migrateAppData(payload)

      const local = readPersistedLocalAppData()
      if (local) {
        await upsertPayload(client, userId, local)
        clearPersistedLocalAppData()
        return local
      }

      return defaultData()
    },

    async save(data: AppData) {
      const userId = await getAuthedUserId(client)
      await upsertPayload(client, userId, data)
    },
  }
}
