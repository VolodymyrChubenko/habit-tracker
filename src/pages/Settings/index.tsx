import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/Toast/useToast';
import { Toast } from '../../components/Toast/Toast';
import {
  isPushSupported,
  subscribePush,
  getPushSubscription,
  deleteSubscription,
  getOrCreateDeviceId,
} from '../../utils/pushUtils';
import type { Theme } from '../../types';
import styles from './Settings.module.scss';
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon, BellIcon, InfoIcon } from './icons';

const themeOptions: { value: Theme; label: string; sub?: string; iconBg: string; Icon: () => React.JSX.Element }[] = [
  { value: 'light', label: 'Світла', iconBg: '#FAF7F0', Icon: SunIcon },
  { value: 'dark', label: 'Темна', iconBg: '#5c5c5f', Icon: MoonIcon },
  { value: 'system', label: 'Як у системі', sub: 'Автоматично', iconBg: 'linear-gradient(135deg, #FAF7F0 50%, #5c5c5f 50%)', Icon: MonitorIcon },
];

const pushStatus = (pushEnabled: boolean): string => {
  if (!isPushSupported()) return 'Не підтримується у цьому браузері';
  if (Notification.permission === 'denied') return 'Заблоковано в браузері';
  if (pushEnabled && Notification.permission === 'granted') return 'Дозвіл надано';
  return 'Вимкнено';
};

export default function SettingsPage() {
  const { theme, setTheme, pushEnabled, setPushEnabled } = useSettingsStore();
  const { toast, show } = useToast();

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      if (!isPushSupported()) {
        show({ message: 'Сповіщення не підтримуються у цьому браузері' });
        return;
      }
      if (Notification.permission === 'denied') {
        show({ message: 'Дозвольте сповіщення у налаштуваннях браузера' });
        return;
      }
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          show({ message: 'Дозвіл на сповіщення не надано' });
          return;
        }
      }
      try {
        await subscribePush();
      } catch {
        show({ message: 'Не вдалося підписатися на сповіщення' });
        return;
      }
      setPushEnabled(true); // usePushSync одразу відправить розклад на сервер
    } else {
      const subscription = await getPushSubscription();
      if (subscription) await subscription.unsubscribe().catch(() => false);
      await deleteSubscription(getOrCreateDeviceId());
      setPushEnabled(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Налаштування</h1>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Нагадування</div>

        <div
          className={styles.row}
          role="switch"
          aria-checked={pushEnabled}
          aria-label="Push-сповіщення"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              void handlePushToggle();
            }
          }}
          onClick={() => void handlePushToggle()}
        >
          <div className={styles.icon} style={{ background: '#F0EBF8', border: '1.5px solid #E8E4DC' }}>
            <BellIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.rowTitle}>Push-сповіщення</div>
            <div className={styles.rowSub}>{pushStatus(pushEnabled)}</div>
          </div>
          <div className={`${styles.toggle} ${pushEnabled ? styles.toggleOn : ''}`}>
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </div>
        </div>

        <div className={styles.hintRow}>
          <InfoIcon />
          <span>Час і дні тижня налаштовуються окремо в кожному челенджі — при створенні або редагуванні.</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Зовнішній вигляд</div>
        {themeOptions.map(({ value, label, sub, iconBg, Icon }) => (
          <div key={value} className={styles.row} onClick={() => setTheme(value)}>
            <div className={styles.icon} style={{ background: iconBg, border: '1.5px solid #E8E4DC' }}>
              <Icon />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>{label}</div>
              {sub && <div className={styles.rowSub}>{sub}</div>}
            </div>
            <div
              className={styles.check}
              style={{ background: theme === value ? '#7CB9A8' : 'transparent', border: theme === value ? 'none' : '2px solid #E0DDD8' }}
            >
              {theme === value && <CheckIcon />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.row} style={{ cursor: 'default' }}>
          <span style={{ flex: 1, fontSize: 15, color: '#aaa' }}>Версія</span>
          <span className={styles.version}>2.4.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} />}
    </>
  );
}
