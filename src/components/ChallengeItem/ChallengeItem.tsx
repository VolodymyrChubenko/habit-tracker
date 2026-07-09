import { useEffect, useRef, useState } from 'react';
import type { Challenge } from '../../types';
import styles from './ChallengeItem.module.scss';

interface Props {
  challenge: Challenge;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

const COMPLETE_MS = 700;
const UNCOMPLETE_MS = 300;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ChallengeItem = ({ challenge, done, onToggle, onEdit }: Props) => {
  const [animating, setAnimating] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const firing = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firing.current) return;
    firing.current = true;
    if (prefersReducedMotion()) {
      onToggle();
      return;
    }
    setAnimating(true);
    timer.current = window.setTimeout(onToggle, done ? UNCOMPLETE_MS : COMPLETE_MS);
  };

  // While animating: a done tile fades out (uncomplete), a todo tile sweeps + collapses (complete).
  const className = [
    styles.card,
    done ? styles.done : '',
    animating ? (done ? styles.fading : styles.completing) : '',
  ].join(' ');

  return (
    <div className={className} onClick={onEdit}>
      {!done && <span className={styles.sweep} style={{ background: challenge.color }} />}
      <div className={styles.dot} style={{ background: challenge.color }} />
      <span
        className={styles.name}
        style={done ? { textDecoration: 'line-through' } : undefined}
      >
        {challenge.name}
      </span>
      <button
        className={styles.circle}
        aria-label={done ? 'скасувати виконання' : 'виконати'}
        style={{ borderColor: challenge.color, background: done ? challenge.color : 'transparent' }}
        onClick={handleToggle}
      >
        <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4L19 7" pathLength="100" />
        </svg>
      </button>
    </div>
  );
};
