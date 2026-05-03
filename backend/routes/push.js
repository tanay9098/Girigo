import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.post("/subscribe", async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint)
      return res.status(400).json({ error: "Invalid subscription object" });

    const { error } = await supabase.from("push_subscriptions").upsert(
      { user_id: req.user.id, subscription, endpoint: subscription.endpoint },
      { onConflict: "endpoint" }
    );

    if (error) throw error;
    res.status(201).json({ message: "Subscribed" });
  } catch (err) { next(err); }
});

router.delete("/subscribe", async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", req.user.id)
      .eq("endpoint", endpoint);

    if (error) throw error;
    res.json({ message: "Unsubscribed" });
  } catch (err) { next(err); }
});

router.get("/vapid-public-key", (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

export default router;