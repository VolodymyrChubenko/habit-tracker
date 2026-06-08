import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTodayProgress } from '../../hooks/useTodayProgress';
import { useHabitsStore } from '../../store/habitsStore';
import { HabitList } from './HabitList';
import { DoneList } from './DoneList';
import { AddHabitSheet } from './AddHabitSheet';
import { EditHabitSheet } from './EditHabitSheet';
import type { Habit } from '../../types';
import styles from './Today.module.scss';

export default function TodayPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { todoHabits, doneHabits, total } = useTodayProgress();
  const { addHabit } = useHabitsStore();

  const completed = doneHabits.length;
  const progressPct = total === 0 ? 0 : (completed / total) * 100;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.titles}>
          <h1 className={styles.title}>Сьогодні</h1>
          <p className={styles.subtitle}>
            {format(new Date(), 'EEEE, d MMMM', { locale: uk })}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)} aria-label="Додати звичку">
          +
        </button>
      </div>

      {total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Прогрес</span>
            <span>{completed} / {total}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className={styles.list}>
        <HabitList habits={todoHabits} onEdit={setEditingHabit} />
      </div>

      <DoneList habits={doneHabits} onEdit={setEditingHabit} />

      {showAdd && (
        <AddHabitSheet
          onClose={() => setShowAdd(false)}
          onAdd={(name, color) => { addHabit(name, color); setShowAdd(false); }}
        />
      )}

      {editingHabit && (
        <EditHabitSheet
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </>
  );
}
