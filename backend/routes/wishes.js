import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase.js";
import { wishQueue } from "../lib/queue.js";
import { uploadEncryptedVideo, deleteVideo } from "../lib/storage.js";

const router = Router();

// Store upload in memory (max 100MB) — we immediately push to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    // Only accept binary encrypted blobs
    if (file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only encrypted binary files accepted"));
    }
  },
});

// ── POST /api/wishes ───────────────────────────────────────────────────────
// Accepts multipart/form-data with:
//   - video: encrypted binary blob (application/octet-stream)
//   - iv: base64 string
//   - salt: base64 string
router.post("/", upload.single("video"), async (req, res, next) => {
  const userId = req.user.id;
  let storagePath = null;

  try {
    const { iv, salt } = req.body;
    const encryptedBuffer = req.file?.buffer;

    if (!encryptedBuffer || !iv || !salt) {
      return res.status(400).json({ error: "video, iv, and salt are required" });
    }

    // Check for existing active wish
    const { data: existing } = await supabase
      .from("wishes")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("is_granted", false)
      .single();

    if (existing) {
      return res.status(409).json({
        error: "You already have an active wish",
        expires_at: existing.expires_at,
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the wish row first to get the wishId
    const { data: wish, error: dbError } = await supabase
      .from("wishes")
      .insert({
        user_id: userId,
        iv,
        salt,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, expires_at, created_at")
      .single();

    if (dbError) throw dbError;

    // Upload encrypted video to Supabase Storage
    storagePath = await uploadEncryptedVideo(userId, wish.id, encryptedBuffer);

    // Save storage path back to the wish row
    await supabase
      .from("wishes")
      .update({ video_path: storagePath })
      .eq("id", wish.id);

    // Schedule push notification for T+24h
    const delay = expiresAt.getTime() - Date.now();
    await wishQueue.add(
      "notify",
      { wishId: wish.id, userId },
      { delay, jobId: `wish-${wish.id}` }
    );

    res.status(201).json({
      id: wish.id,
      expires_at: wish.expires_at,
      created_at: wish.created_at,
    });
  } catch (err) {
    // Clean up storage if DB insert succeeded but something else failed
    if (storagePath) await deleteVideo(storagePath);
    next(err);
  }
});

// ── GET /api/wishes/active ─────────────────────────────────────────────────
router.get("/active", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("wishes")
      .select("id, expires_at, created_at, is_granted")
      .eq("user_id", req.user.id)
      .eq("is_granted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json({ wish: data || null });
  } catch (err) {
    next(err);
  }
});

export default router;