import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue.js";
import { sendPush } from "../lib/webpush.js";
import { supabase } from "../lib/supabase.js";

console.log("🔴 Girigo notification worker started");

const worker = new Worker("wish-notifications", async (job) => {
  const { wishId, userId } = job.data;

  await supabase.from("wishes").update({ is_granted: true }).eq("id", wishId).eq("user_id", userId);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, subscription, endpoint")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const payload = {
    title: "기리고 — Your wish has been granted",
    body: "The countdown has ended. Your wish is granted. 🕯️",
    icon: "/icon-192.png",
    data: { wishId, url: "/" },
  };

  const expired = [];
  await Promise.allSettled(subs.map(async (row) => {
    try {
      await sendPush(row.subscription, payload);
    } catch (err) {
      if (err.code === "SUBSCRIPTION_EXPIRED") expired.push(row.endpoint);
    }
  }));

  if (expired.length)
    await supabase.from("push_subscriptions").delete().in("endpoint", expired);

}, { connection: redisConnection, concurrency: 5 });

worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));