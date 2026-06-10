import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/Toast/useToast';
import { Toast } from '../../components/Toast/Toast';
import type { Theme } from '../../types';
import styles from './Settings.module.scss';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A87C" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7CB9A8" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12">
    <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B89D4" strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7CB9A8" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const themeOptions: { value: Theme; label: string; sub?: string; iconBg: string; Icon: () => React.JSX.Element }[] = [
  { value: 'light', label: 'Світла', iconBg: '#FAF7F0', Icon: SunIcon },
  { value: 'dark', label: 'Темна', iconBg: '#5c5c5f', Icon: MoonIcon },
  { value: 'system', label: 'Як у системі', sub: 'Автоматично', iconBg: 'linear-gradient(135deg, #FAF7F0 50%, #5c5c5f 50%)', Icon: MonitorIcon },
];

export default function SettingsPage() {
  const { theme, setTheme, reminderEnabled, reminderTime, setReminderEnabled, setReminderTime } = useSettingsStore();
  const { toast, show } = useToast();

  const handleReminderToggle = async () => {
    if (!reminderEnabled) {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
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
    }
    setReminderEnabled(!reminderEnabled);
  };

  return (
    <>
      <h1 className={styles.title}>Налаштування</h1>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Нагадування</div>

        <div
          className={styles.row}
          role="switch"
          aria-checked={reminderEnabled}
          aria-label="Щоденне нагадування"
          tabIndex={0}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') void handleReminderToggle(); }}
          onClick={() => void handleReminderToggle()}
        >
          <div className={styles.icon} style={{ background: '#F0EBF8', border: '1.5px solid #E8E4DC' }}>
            <BellIcon />
          </div>
          <span className={styles.rowTitle}>Щоденне нагадування</span>
          <div className={`${styles.toggle} ${reminderEnabled ? styles.toggleOn : ''}`}>
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </div>
        </div>

        <div
          className={styles.row}
          style={{
            opacity: reminderEnabled ? 1 : 0.4,
            pointerEvents: reminderEnabled ? 'auto' : 'none',
            cursor: 'default',
          }}
        >
          <div className={styles.icon} style={{ background: '#EBF5F2', border: '1.5px solid #E8E4DC' }}>
            <ClockIcon />
          </div>
          <span className={styles.rowTitle}>Час нагадування</span>
          <input
            type="time"
            className={styles.timeInput}
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
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
          <span className={styles.version}>1.0.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} />}
    </>
  );
}
