import type { Habit } from '../../types';
import styles from './HabitItem.module.scss';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

export const HabitItem = ({ habit, done, onToggle, onEdit }: Props) => {
  return (
    <div className={[styles.card, done ? styles.done : ''].join(' ')} onClick={onEdit}>
      <div className={styles.dot} style={{ background: habit.color }} />
      <span
        className={styles.name}
        style={done ? { textDecoration: 'line-through' } : undefined}
      >
        {habit.name}
      </span>
      <button
        className={styles.circle}
        aria-label={done ? 'скасувати виконання' : 'виконати'}
        style={{
          borderColor: habit.color,
          background: done ? habit.color : 'transparent',
        }}
        onClick={e => { e.stopPropagation(); onToggle(); }}
      >
        {done ? '✓' : ''}
      </button>
    </div>
  );
};
