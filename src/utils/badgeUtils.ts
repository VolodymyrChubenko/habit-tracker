/** Мінімальний зріз Notification — достатній і для тестів, і для DOM-типу. */
export interface ReminderNotification {
  tag: string;
  close(): void;
}

/** Структурно сумісний із ServiceWorkerRegistration (вікно і SW). */
export interface NotificationSource {
  getNotifications(): Promise<ReminderNotification[]>;
}

/** Badging API відсутній у lib.dom для WorkerNavigator — типізуємо вручну. */
interface BadgeCapableNavigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

const badgeNav = (): BadgeCapableNavigator =>
  (globalThis.navigator ?? {}) as BadgeCapableNavigator;

/**
 * Бейдж = кількість активних сповіщень. excludeTag виключає щойно
 * клікнуте сповіщення: після close() воно ще може бути в списку (race).
 * Fire-and-forget: будь-яка помилка мовчазно ігнорується.
 */
export const syncBadge = async (
  reg: NotificationSource,
  excludeTag?: string,
): Promise<void> => {
  const nav = badgeNav();
  if (!nav.setAppBadge || !nav.clearAppBadge) return;
  try {
    const notifications = await reg.getNotifications();
    const count = notifications.filter(n => n.tag !== excludeTag).length;
    if (count > 0) await nav.setAppBadge(count);
    else await nav.clearAppBadge();
  } catch {
    // Badging API не критичний — сповіщення важливіші за лічильник
  }
};

/** Відкриття застосунку = «прочитано»: закрити reminder-сповіщення, скинути бейдж. */
export const clearReminders = async (reg: NotificationSource): Promise<void> => {
  try {
    const notifications = await reg.getNotifications();
    for (const n of notifications) {
      if (n.tag.startsWith('reminder')) n.close();
    }
  } catch {
    // без сповіщень все одно чистимо бейдж нижче
  }
  try {
    await badgeNav().clearAppBadge?.();
  } catch {
    // мовчазний no-op
  }
};
