import { useState } from 'react';
import { useHabitsStore } from '../../store/habitsStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { Habit, HabitId } from '../../types/index';
import styles from './ArchivedHabitList.module.scss';

interface Props {
  habits: Habit[];
}

export const ArchivedHabitList = ({ habits }: Props) => {
  const { unarchiveHabit, deleteHabit } = useHabitsStore();
  const [confirmId, setConfirmId] = useState<HabitId | null>(null);

  if (habits.length === 0) return null;

  const handleDelete = (id: HabitId) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteHabit(id);
    setConfirmId(null);
  };

  return (
    <div className={styles.section}>
      <p className={styles.label}>Заархівовані звички</p>
      <div className={styles.list}>
        {habits.map(h => (
          <div key={h.id} className={styles.card}>
            <span className={styles.dot} style={{ background: h.color }} />
            <div className={styles.meta}>
              <span className={styles.name}>{h.name}</span>
              {h.archivedAt && (
                <span className={styles.date}>
                  Архівовано {formatDisplayDate(h.archivedAt)}
                </span>
              )}
            </div>
            <button className={styles.restore} onClick={() => unarchiveHabit(h.id)}>
              Відновити
            </button>
            <button
              className={confirmId === h.id ? styles.deleteConfirm : styles.delete}
              onClick={() => handleDelete(h.id)}
            >
              {confirmId === h.id ? 'Точно?' : 'Видалити'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
