import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { useHabitsStore } from '../../store/habitsStore';
import type { Habit } from '../../types';
import styles from './EditHabitSheet.module.scss';

interface Props {
  habit: Habit;
  onClose: () => void;
}

export const EditHabitSheet = ({ habit, onClose }: Props) => {
  const [name, setName] = useState(habit.name);
  const [color, setColor] = useState(habit.color);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { updateHabit, archiveHabit, deleteHabit } = useHabitsStore();

  const handleSave = () => {
    if (!name.trim()) return;
    updateHabit(habit.id, { name: name.trim(), color });
    onClose();
  };

  const handleStop = () => {
    archiveHabit(habit.id);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteHabit(habit.id);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <p className={styles.title}>Редагувати звичку</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="edit-habit-name">Назва</label>
        <input
          id="edit-habit-name"
          className={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Колір</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <button
        type="button"
        className={styles.btnSave}
        disabled={!name.trim()}
        onClick={handleSave}
      >
        Зберегти зміни
      </button>

      <div className={styles.danger}>
        <p className={styles.dangerLabel}>Небезпечна зона</p>

        {!habit.archivedAt && (
          <button type="button" className={styles.btnStop} onClick={handleStop}>
            Зупинити звичку
          </button>
        )}

        <button
          type="button"
          className={confirmDelete ? styles.btnDeleteConfirm : styles.btnDelete}
          onClick={handleDelete}
        >
          {confirmDelete ? 'Натисніть ще раз для підтвердження' : 'Видалити звичку'}
        </button>
      </div>
    </BottomSheet>
  );
};
