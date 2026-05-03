import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      const e = new Error("Subscription expired");
      e.code = "SUBSCRIPTION_EXPIRED";
      throw e;
    }
    throw err;
  }
}