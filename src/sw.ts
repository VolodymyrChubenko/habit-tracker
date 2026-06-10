/// <reference lib="WebWorker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from 'workbox-precaching';
import { calcMsUntilTime } from './utils/notificationUtils';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type: string; enabled: boolean; time: string };
  if (data?.type !== 'SCHEDULE_REMINDER') return;

  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (!data.enabled) return;

  const ms = calcMsUntilTime(data.time);
  scheduledTimer = setTimeout(() => {
    void self.registration.showNotification('Habit Tracker', {
      body: 'Час відмічати звички! 🌿',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    });
    scheduledTimer = null;
  }, ms);
});
