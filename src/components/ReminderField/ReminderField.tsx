import styles from './ReminderField.module.scss';

interface Props {
  enabled: boolean;
  time: string;
  onToggle: () => void;
  onTimeChange: (time: string) => void;
}

const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9B89D4" strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ClockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7CB9A8" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const ReminderField = ({ enabled, time, onToggle, onTimeChange }: Props) => (
  <div className={styles.field}>
    <span className={styles.label}>Нагадування</span>
    <div className={styles.card}>
      <div
        className={styles.row}
        role="switch"
        aria-checked={enabled}
        aria-label="Нагадувати щодня"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle();
          }
        }}
        onClick={onToggle}
      >
        <div className={styles.icon} style={{ background: '#F0EBF8' }}>
          <BellIcon />
        </div>
        <span className={styles.rowTitle}>Нагадувати щодня</span>
        <div className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}>
          <div className={styles.toggleTrack} />
          <div className={styles.toggleThumb} />
        </div>
      </div>

      {enabled && (
        <div className={styles.row} style={{ cursor: 'default' }}>
          <div className={styles.icon} style={{ background: '#EBF5F2' }}>
            <ClockIcon />
          </div>
          <span className={styles.rowTitle}>Час</span>
          <input
            type="time"
            className={styles.timeInput}
            value={time}
            onChange={e => onTimeChange(e.target.value)}
            aria-label="Час нагадування"
          />
        </div>
      )}
    </div>
  </div>
);
