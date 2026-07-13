import { useEffect } from 'react';
import { clearReminders } from '../utils/badgeUtils';

/**
 * Відкриття/повернення в застосунок = «нагадування прочитані»:
 * закриває активні reminder-сповіщення і скидає бейдж на іконці.
 * Монтується один раз в App.
 */
export function useAppBadge() {
  useEffect(() => {
    const clear = async () => {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await clearReminders(reg);
    };

    void clear();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void clear();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
}
