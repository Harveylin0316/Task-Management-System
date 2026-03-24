import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let singleton: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  )
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY')
  }
  const url = import.meta.env.VITE_SUPABASE_URL!.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY!.trim()
  if (!singleton) {
    singleton = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return singleton
}
