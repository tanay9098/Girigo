import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "기리고", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || "기리고 — Wish Granted", {
      body: payload.body || "Your wish is granted. 🕯️",
      icon: payload.icon || "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200, 100, 400],
      data: payload.data || {},
      requireInteraction: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});