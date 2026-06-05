import type { Habit } from '../../types';
import styles from './HabitItem.module.scss';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onArchive: () => void;
}

export const HabitItem = ({ habit, done, onToggle, onArchive }: Props) => {
  let pressTimer: ReturnType<typeof setTimeout>;

  const handlePressStart = () => {
    pressTimer = setTimeout(onArchive, 600);
  };
  const handlePressEnd = () => clearTimeout(pressTimer);

  return (
    <div
      className={[styles.card, done ? styles.done : ''].join(' ')}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
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
        onClick={onToggle}
      >
        {done ? '✓' : ''}
      </button>
    </div>
  );
};
