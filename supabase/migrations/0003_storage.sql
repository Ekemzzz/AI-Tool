-- 0003_storage.sql — Supabase Storage for tool logos (Phase 8).
-- Creates a public `tool-logos` bucket so listings can be served first-party

-- 1. Bucket. A public bucket serves objects through the
--    /storage/v1/object/public/tool-logos/<path> URL without needing an auth
--    token, which is what <img src> loads. Re-running is a no-op.
insert into storage.buckets (id, name, public)
values ('tool-logos', 'tool-logos', true)
on conflict (id) do nothing;

-- 2. Public read through the normal (RLS-governed) endpoint too, so the
--    client can list/select objects if ever needed. Idempotent.
drop policy if exists "tool-logos public read" on storage.objects;
create policy "tool-logos public read"
  on storage.objects for select
  using (bucket_id = 'tool-logos');

-- 3. Writes are restricted to the service_role key only (used by the upload
--    script). Anonymous / authenticated users cannot add, change, or delete
--    logos from the browser.
drop policy if exists "tool-logos service write" on storage.objects;
create policy "tool-logos service write"
  on storage.objects for all
  to service_role
  using (bucket_id = 'tool-logos')
  with check (bucket_id = 'tool-logos');
