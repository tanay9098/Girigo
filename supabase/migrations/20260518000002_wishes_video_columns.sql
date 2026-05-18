-- Move wishes from inline ciphertext to stored video files.

-- Add video columns to wishes table
ALTER TABLE wishes
  ADD COLUMN IF NOT EXISTS iv         TEXT,
  ADD COLUMN IF NOT EXISTS salt       TEXT,
  ADD COLUMN IF NOT EXISTS video_path TEXT;

-- Remove old encrypted_wish column (no longer needed)
ALTER TABLE wishes DROP COLUMN IF EXISTS encrypted_wish;

-- ── Supabase Storage bucket setup ─────────────────────────────────────────
-- The bucket itself must be created manually (not captured by SQL migrations):
--   Supabase Dashboard → Storage → New Bucket
--     Name:   wish-videos
--     Public: NO (private)

-- RLS policy on the storage bucket: users access only their own videos.
CREATE POLICY "users_own_videos" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'wish-videos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  )
  WITH CHECK (
    bucket_id = 'wish-videos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );
