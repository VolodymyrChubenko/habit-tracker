/// <reference lib="WebWorker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from 'workbox-precaching';
import { syncBadge } from './utils/badgeUtils';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title?: string;
  body?: string;
  challengeId?: string;
}

self.addEventListener('push', event => {
  let data: PushPayload = {};
  try {
    data = (event.data?.json() as PushPayload) ?? {};
  } catch {
    // не-JSON payload — покажемо дефолтний текст
  }

  event.waitUntil(
    self.registration
      .showNotification(data.title ?? 'Challenge Tracker', {
        body: data.body ?? 'Час відмічати челенджі! 🌿',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.challengeId ? `reminder-${data.challengeId}` : 'reminder',
        // challengeId у data — щоб застосунок при відкритті показав, за чим саме нагадали
        data: { url: '/', challengeId: data.challengeId },
      })
      // бейдж на іконці = кількість активних нагадувань
      .then(() => syncBadge(self.registration)),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  // close() асинхронний у списку сповіщень — виключаємо клікнутий tag явно
  const clickedTag = event.notification.tag;
  const { challengeId } = (event.notification.data ?? {}) as PushPayload;
  event.waitUntil(
    Promise.all([
      syncBadge(self.registration, clickedTag),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        const existing = clients.find(c => 'focus' in c);
        if (existing) {
          // клікнуте сповіщення вже закрите й не потрапить у getNotifications —
          // доносимо id окремо, інакше банер його не покаже
          if (challengeId) existing.postMessage({ type: 'reminder-click', challengeId });
          return existing.focus();
        }
        return self.clients.openWindow(challengeId ? `/?reminder=${challengeId}` : '/');
      }),
    ]),
  );
});
