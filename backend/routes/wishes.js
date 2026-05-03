import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { wishQueue } from "../lib/queue.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { encrypted_wish, iv } = req.body;
    const userId = req.user.id;

    if (!encrypted_wish || !iv)
      return res.status(400).json({ error: "encrypted_wish and iv are required" });

    const { data: existing } = await supabase
      .from("wishes")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("is_granted", false)
      .single();

    if (existing)
      return res.status(409).json({ error: "You already have an active wish", expires_at: existing.expires_at });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: wish, error } = await supabase
      .from("wishes")
      .insert({ user_id: userId, encrypted_wish, iv, expires_at: expiresAt.toISOString() })
      .select("id, expires_at, created_at")
      .single();

    if (error) throw error;

    const delay = expiresAt.getTime() - Date.now();
    await wishQueue.add("notify", { wishId: wish.id, userId }, { delay, jobId: `wish-${wish.id}` });

    res.status(201).json({ id: wish.id, expires_at: wish.expires_at, created_at: wish.created_at });
  } catch (err) { next(err); }
});

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
  } catch (err) { next(err); }
});

export default router;