-- 若 upsert 出現 permission denied，在 SQL Editor 執行此檔
-- （部分專案新建表後需明確授權給 authenticated）

grant select, insert, update on public.dashboard_data to authenticated;
