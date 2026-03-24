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
      await ensureSession(client)
      const {
        data: { user },
        error: userErr,
      } = await client.auth.getUser()
      if (userErr || !user) throw userErr ?? new Error('未取得使用者')

      const payload = await fetchPayload(client, user.id)
      if (payload != null) return migrateAppData(payload)

      const local = readPersistedLocalAppData()
      if (local) {
        await upsertPayload(client, user.id, local)
        clearPersistedLocalAppData()
        return local
      }

      return defaultData()
    },

    async save(data: AppData) {
      await ensureSession(client)
      const {
        data: { user },
        error: userErr,
      } = await client.auth.getUser()
      if (userErr || !user) return
      await upsertPayload(client, user.id, data)
    },
  }
}
