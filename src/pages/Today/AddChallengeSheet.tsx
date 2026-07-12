import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { ReminderField } from '../../components/ReminderField/ReminderField';
import styles from './AddChallengeSheet.module.scss';

interface Props {
  onClose: () => void;
  onAdd: (name: string, color: string, reminder: { enabled: boolean; time: string; activeDays: number[] }) => void;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const AddChallengeSheet = ({ onClose, onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7CB9A8');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [activeDays, setActiveDays] = useState<number[]>(ALL_DAYS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color, { enabled: reminderEnabled, time: reminderTime, activeDays });
  };

  return (
    <BottomSheet onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className={styles.title}>Новий челендж</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="challenge-title">Назва</label>
          <input
            id="challenge-title"
            name="challenge-title"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Наприклад: Медитація"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Колір</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <ReminderField
          enabled={reminderEnabled}
          time={reminderTime}
          activeDays={activeDays}
          onToggle={() => setReminderEnabled(v => !v)}
          onTimeChange={setReminderTime}
          onActiveDaysChange={setActiveDays}
        />

        <button type="submit" className={styles.btn} disabled={!name.trim()}>
          Додати челендж
        </button>
      </form>
    </BottomSheet>
  );
};
