import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import styles from './AddHabitSheet.module.scss';

interface Props {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}

export const AddHabitSheet = ({ onClose, onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7CB9A8');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
  };

  return (
    <BottomSheet onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className={styles.title}>Нова звичка</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="habit-name">Назва</label>
          <input
            id="habit-name"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Наприклад: Медитація"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Колір</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <button type="submit" className={styles.btn} disabled={!name.trim()}>
          Додати звичку
        </button>
      </form>
    </BottomSheet>
  );
};
