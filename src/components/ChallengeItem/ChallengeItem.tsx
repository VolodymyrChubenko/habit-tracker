import { useEffect, useRef, useState } from 'react';
import type { Challenge } from '../../types';
import styles from './ChallengeItem.module.scss';

interface Props {
  challenge: Challenge;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
  /** attributes + listeners з useSortable. Без них хендл не рендериться — і рядок не тягається. */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /** прийшло push-нагадування, яке ще не відпрацювали */
  reminding?: boolean;
}

const COMPLETE_MS = 700;
const UNCOMPLETE_MS = 300;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ChallengeItem = ({
  challenge,
  done,
  onToggle,
  onEdit,
  dragHandleProps,
  reminding,
}: Props) => {
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
    reminding ? styles.reminding : '',
    animating ? (done ? styles.fading : styles.completing) : '',
  ].join(' ');

  return (
    <div id={`challenge-${challenge.id}`} className={className} onClick={onEdit}>
      {!done && <span className={styles.sweep} style={{ background: challenge.color }} />}
      {dragHandleProps && (
        <span
          className={styles.handle}
          aria-label="Перетягнути"
          {...dragHandleProps}
          // тап по хендлу ніколи не відкриває шіт редагування
          onClick={e => e.stopPropagation()}
        >
          <svg viewBox="0 0 10 16" aria-hidden="true">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="14" r="1.5" />
            <circle cx="8" cy="14" r="1.5" />
          </svg>
        </span>
      )}
      <div className={styles.dot} style={{ background: challenge.color }} />
      <span
        className={styles.name}
        style={done ? { textDecoration: 'line-through' } : undefined}
      >
        {challenge.name}
      </span>
      {reminding && (
        <span className={styles.bell} role="img" aria-label="нагадування">
          🔔
        </span>
      )}
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
