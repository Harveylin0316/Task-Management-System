/**
 * 之後接上 Supabase 時：
 * 1. npm i @supabase/supabase-js
 * 2. .env：VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY
 * 3. 在此建立 createClient，並新增 SupabaseDataSource 實作 src/lib/dataSource.ts 的介面
 * 4. 在 DashboardProvider 依登入狀態切換 DataSource
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}
