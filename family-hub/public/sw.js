const CACHE_NAME = "family-hub-v1";
const ASSETS = ["/", "/manifest.json"];

// Install — cache core assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for assets
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") || e.request.url.includes("/ws")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  let data = { title: "Family Hub", body: "New notification", tag: "default" };
  try {
    data = e.data.json();
  } catch {
    data.body = e.data ? e.data.text() : "New notification";
  }

  const options = {
    body: data.body,
    icon: data.icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%237c6bff' width='100' height='100' rx='20'/><text x='50' y='68' text-anchor='middle' font-size='55'>🏠</text></svg>",
    badge: data.badge || undefined,
    tag: data.tag || "family-hub",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: data.type === "call",
    actions: data.type === "call"
      ? [{ action: "accept", title: "Accept" }, { action: "decline", title: "Decline" }]
      : [],
    data: data,
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage({ type: "notification_click", action: e.action, data: e.notification.data });
      } else {
        self.clients.openWindow("/");
      }
    })
  );
});
