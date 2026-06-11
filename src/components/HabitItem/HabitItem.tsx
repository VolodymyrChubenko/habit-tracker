import { useEffect, useRef, useState } from 'react';
import type { Habit } from '../../types';
import styles from './HabitItem.module.scss';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

const COMPLETE_MS = 700;
const UNCOMPLETE_MS = 300;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HabitItem = ({ habit, done, onToggle, onEdit }: Props) => {
  const [animating, setAnimating] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (animating) return;
    if (prefersReducedMotion()) {
      onToggle();
      return;
    }
    setAnimating(true);
    timer.current = window.setTimeout(onToggle, done ? UNCOMPLETE_MS : COMPLETE_MS);
  };

  const className = [
    styles.card,
    done ? styles.done : '',
    animating ? (done ? styles.fading : styles.completing) : '',
  ].join(' ');

  return (
    <div className={className} onClick={onEdit}>
      {!done && <span className={styles.sweep} style={{ background: habit.color }} />}
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
        style={{ borderColor: habit.color, background: done ? habit.color : 'transparent' }}
        onClick={handleToggle}
      >
        <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4L19 7" pathLength="100" />
        </svg>
      </button>
    </div>
  );
};
