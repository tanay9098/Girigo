import { useState, useEffect } from "react";
import { getVapidPublicKey, savePushSubscription } from "../lib/api.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const isSupported = "serviceWorker" in navigator && "PushManager" in window;

  const [permission, setPermission] = useState(
    isSupported ? Notification.permission : "denied"
  );
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then(setSubscription)
    );
  }, [isSupported]);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = await getVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await savePushSubscription(sub.toJSON());
      setSubscription(sub);
    } catch (err) {
      setError(err.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  }

  return { isSupported, permission, subscription, loading, error, subscribe };
}
