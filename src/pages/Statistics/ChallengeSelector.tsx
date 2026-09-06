import type { Challenge, ChallengeId } from '../../types';
import styles from './ChallengeSelector.module.scss';

interface Props {
  challenges: Challenge[];
  selected: ChallengeId[] | null; // null = all
  onChange: (ids: ChallengeId[] | null) => void;
}

export const ChallengeSelector = ({ challenges, selected, onChange }: Props) => {
  const pillClass = (active: boolean, extra?: string) =>
    [styles.pill, extra ?? '', active ? styles.active : ''].join(' ');

  return (
    <div className={styles.row}>
      <button
        className={pillClass(selected === null, styles.pillAll)}
        onClick={() => onChange(null)}
      >
        Всі
      </button>
      {challenges.map(h => {
        const isActive = selected?.includes(h.id) ?? false;
        return (
          <button
            key={h.id}
            className={pillClass(isActive)}
            onClick={() => {
              if (isActive) {
                const next = selected!.filter(id => id !== h.id);
                onChange(next.length === 0 ? null : next);
              } else {
                onChange([...(selected ?? []), h.id]);
              }
            }}
          >
            {/* колір челенджа — це дані, а не тема, тому лишається inline */}
            <span className={styles.dot} style={{ background: h.color }} />
            {h.name}
          </button>
        );
      })}
    </div>
  );
};
