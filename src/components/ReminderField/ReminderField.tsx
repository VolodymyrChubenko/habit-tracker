import styles from './ReminderField.module.scss';

interface Props {
  enabled: boolean;
  time: string;
  /** Активні дні тижня: Пн=0 … Нд=6 */
  activeDays: number[];
  onToggle: () => void;
  onTimeChange: (time: string) => void;
  onActiveDaysChange: (days: number[]) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

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

export const ReminderField = ({ enabled, time, activeDays, onToggle, onTimeChange, onActiveDaysChange }: Props) => {
  const toggleDay = (index: number) => {
    if (activeDays.includes(index)) {
      if (activeDays.length === 1) return; // хоча б один день має лишатися
      onActiveDaysChange(activeDays.filter(d => d !== index));
    } else {
      onActiveDaysChange([...activeDays, index].sort((a, b) => a - b));
    }
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>Нагадування</span>
      <div className={styles.card}>
        <div
          className={styles.row}
          role="switch"
          aria-checked={enabled}
          aria-label="Нагадування"
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
          <span className={styles.rowTitle}>Нагадування</span>
          <div className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}>
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </div>
        </div>

        {enabled && (
          <>
            <div className={styles.weekRow}>
              <div className={styles.tiles}>
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    className={`${styles.tile} ${activeDays.includes(i) ? styles.tileOn : ''}`}
                    aria-pressed={activeDays.includes(i)}
                    aria-label={day}
                    onClick={() => toggleDay(i)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
};
