import { useEffect } from 'react';
import { useChallengesStore } from '../store/challengesStore';
import { useSettingsStore } from '../store/settingsStore';
import { today } from '../utils/dateUtils';
import {
  buildReminders,
  getOrCreateDeviceId,
  getPushSubscription,
  isPushSupported,
  postSubscription,
} from '../utils/pushUtils';

const SYNC_DEBOUNCE_MS = 2000;

/**
 * Тримає серверний розклад нагадувань у синхроні з локальним стором.
 * Монтується один раз в App. POSTить повний розклад (ідемпотентний upsert)
 * після кожної зміни челенджів і логів, з дебаунсом; порожній список теж
 * надсилається — він чистить розклад на сервері. Логи потрібні, щоб сервер
 * не нагадував про челендж, який сьогодні вже виконано.
 */
export function usePushSync() {
  const challenges = useChallengesStore(s => s.challenges);
  const logs = useChallengesStore(s => s.logs);
  const pushEnabled = useSettingsStore(s => s.pushEnabled);

  useEffect(() => {
    if (!pushEnabled || !isPushSupported() || Notification.permission !== 'granted') return;

    const timer = setTimeout(async () => {
      const subscription = await getPushSubscription();
      if (!subscription) return;
      await postSubscription({
        deviceId: getOrCreateDeviceId(),
        subscription: subscription.toJSON(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reminders: buildReminders(challenges, logs, today()),
      });
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [challenges, logs, pushEnabled]);
}
