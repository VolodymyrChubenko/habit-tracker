import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useReminderScheduler() {
  const reminderEnabled = useSettingsStore(s => s.reminderEnabled);
  const reminderTime = useSettingsStore(s => s.reminderTime);

  useEffect(() => {
    const sendMessage = async () => {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: 'SCHEDULE_REMINDER',
          enabled: reminderEnabled,
          time: reminderTime,
        });
      } catch {}
    };

    sendMessage();
  }, [reminderEnabled, reminderTime]);
}
