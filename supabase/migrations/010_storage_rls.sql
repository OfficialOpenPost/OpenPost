-- 010 — Storage RLS notes (for Supabase Storage if you use it instead of R2)
-- R2 is S3-compatible and uses presigned URLs (see src/lib/storage.ts) — no SQL needed.
-- If you use Supabase Storage bucket "media" instead, run this in Supabase Storage SQL:

-- Create bucket via Dashboard → Storage → New bucket → "media" (public)
-- Then:

-- Enable RLS on storage.objects (already enabled by Supabase)
-- Allow public read for published media, authenticated write

-- Example (run in Supabase SQL editor, not via supabase/migrations unless you have storage schema access):
-- create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');
-- create policy "media_auth_upload" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
-- create policy "media_auth_update" on storage.objects for update using (bucket_id = 'media' and auth.role() = 'authenticated');
-- create policy "media_auth_delete" on storage.objects for delete using (bucket_id = 'media' and auth.role() = 'authenticated');

-- For R2, ensure:
-- 1. Bucket is public (R2 → Bucket → Settings → Public access → Allow)
-- 2. R2_PUBLIC_URL is set to https://pub-xxxx.r2.dev or https://media.yourdomain.com (Custom Domain)
-- 3. R2 API Token has Admin Read & Write on that bucket (R2 → Manage R2 API Tokens)

select 'Storage RLS — see comments. No action needed if using R2.' as note;
