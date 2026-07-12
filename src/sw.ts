/// <reference lib="WebWorker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from 'workbox-precaching';

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
    self.registration.showNotification(data.title ?? 'Challenge Tracker', {
      body: data.body ?? 'Час відмічати челенджі! 🌿',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.challengeId ? `reminder-${data.challengeId}` : 'reminder',
      data: { url: '/' },
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    }),
  );
});
