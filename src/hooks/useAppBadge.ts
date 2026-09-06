import { useEffect } from 'react';
import { clearReminders } from '../utils/badgeUtils';
import { useRemindersStore } from '../store/remindersStore';

const REMINDER_PARAM = 'reminder';

/**
 * Відкриття/повернення в застосунок = «нагадування прочитані»:
 * закриває активні reminder-сповіщення і скидає бейдж на іконці.
 * Id челенджів із цих сповіщень збирає в remindersStore — їх показує
 * ReminderBanner. Джерел три: активні сповіщення в системі, клік по
 * сповіщенню при вже відкритому застосунку (postMessage із SW) і
 * deep-link ?reminder= після openWindow. Монтується один раз в App.
 */
export function useAppBadge() {
  useEffect(() => {
    const { addPending } = useRemindersStore.getState();
    const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : null;

    // 1) deep-link: SW відкрив нове вікно на /?reminder=<id>
    const url = new URL(window.location.href);
    const deepLinked = url.searchParams.get(REMINDER_PARAM);
    if (deepLinked) {
      addPending([deepLinked]);
      url.searchParams.delete(REMINDER_PARAM);
      // прибираємо параметр, щоб він не «залипав» при перезавантаженні
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }

    // 2) сповіщення, що висять у системі
    const clear = async () => {
      if (!sw) return;
      const reg = await sw.getRegistration();
      if (reg) addPending(await clearReminders(reg));
    };

    void clear();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void clear();
    };
    document.addEventListener('visibilitychange', onVisible);

    // 3) клік по сповіщенню, коли застосунок уже відкритий
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; challengeId?: string } | undefined;
      if (msg?.type === 'reminder-click' && msg.challengeId) addPending([msg.challengeId]);
    };
    sw?.addEventListener('message', onMessage);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      sw?.removeEventListener('message', onMessage);
    };
  }, []);
}
