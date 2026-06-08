import { useState } from 'react';
import { useHabitsStore } from '../../store/habitsStore';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';
import styles from './Today.module.scss';

interface Props {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
}

export const DoneList = ({ habits, onEdit }: Props) => {
  const [open, setOpen] = useState(true);
  const { uncompleteHabit } = useHabitsStore();
  const date = today();

  if (habits.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#7CB9A8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
          {habits.length}
        </span>
        <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>Виконано</span>
        <span style={{ marginLeft: 'auto', color: '#bbb', fontSize: 11 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className={styles.list}>
          {habits.map(habit => (
            <HabitItem
              key={habit.id}
              habit={habit}
              done={true}
              onToggle={() => uncompleteHabit(habit.id, date)}
              onEdit={() => onEdit(habit)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
