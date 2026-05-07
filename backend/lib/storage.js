import { supabase } from "./supabase.js";

const BUCKET = "wish-videos"; // create this bucket in Supabase dashboard

/**
 * Upload encrypted video buffer to Supabase Storage.
 * Stored under wishes/{userId}/{wishId}.bin
 * RLS on bucket ensures only that user can access their file.
 *
 * @param {string} userId
 * @param {string} wishId
 * @param {Buffer} encryptedBuffer  — raw encrypted bytes
 * @returns {string} storage path
 */
export async function uploadEncryptedVideo(userId, wishId, encryptedBuffer) {
  const path = `wishes/${userId}/${wishId}.bin`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, encryptedBuffer, {
      contentType: "application/octet-stream", // encrypted binary, not video
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

/**
 * Delete a video from storage (called if wish creation fails mid-way).
 */
export async function deleteVideo(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Storage delete failed:", error.message);
}

/**
 * Generate a short-lived signed URL so the user can play back their own video.
 * Expires in 60 seconds — just enough to stream it.
 *
 * @param {string} path  storage path returned from uploadEncryptedVideo
 * @returns {string} signed URL
 */
export async function getSignedVideoUrl(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60); // 60 seconds expiry

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}