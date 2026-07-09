import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/Toast/useToast';
import { Toast } from '../../components/Toast/Toast';
import type { Theme } from '../../types';
import styles from './Settings.module.scss';
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon, BellIcon, ClockIcon } from './icons';

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
            disabled={!reminderEnabled}
            aria-label="Час нагадування"
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
          <span className={styles.version}>1.1.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} />}
    </>
  );
}
