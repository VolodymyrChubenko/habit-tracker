import { useStreaks } from '../../hooks/useStreaks';
import type { Challenge, ChallengeId, StatScope } from '../../types';
import styles from './StreakTiles.module.scss';

interface Props {
  scope: StatScope;
  challenges: Challenge[];
  filterIds: ChallengeId[] | null;
}

const dayWord = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дні';
  return 'днів';
};

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
