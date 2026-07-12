import { useStreaks } from '../../hooks/useStreaks';
import { dayWord } from '../../utils/pluralize';
import type { Challenge, ChallengeId, StatScope } from '../../types';
import styles from './StreakTiles.module.scss';

interface Props {
  scope: StatScope;
  challenges: Challenge[];
  filterIds: ChallengeId[] | null;
}

export const StreakTiles = ({ challenges, filterIds }: Props) => {
  const streaks = useStreaks(challenges, filterIds);

  if (streaks.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.heading}>Статус</p>
      <div className={styles.grid}>
        {streaks.map(({ challenge, streak }) => (
          <div key={challenge.id} className={styles.tile} style={{ borderLeftColor: challenge.color }}>
            <span className={styles.name}>{challenge.name}</span>
            <span className={styles.count} style={{ color: challenge.color }}>{streak}</span>
            <span className={styles.label}>{dayWord(streak)} поспіль</span>
          </div>
        ))}
      </div>
    </div>
  );
};
