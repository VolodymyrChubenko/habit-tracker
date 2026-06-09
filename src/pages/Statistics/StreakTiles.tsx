import { useStreaks } from '../../hooks/useStreaks';
import type { Habit, HabitId, StatScope } from '../../types';
import styles from './StreakTiles.module.scss';

interface Props {
  scope: StatScope;
  habits: Habit[];
  filterIds: HabitId[] | null;
}

const dayWord = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дні';
  return 'днів';
};

export const StreakTiles = ({ habits, filterIds }: Props) => {
  const streaks = useStreaks(habits, filterIds);

  if (streaks.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.heading}>Статус</p>
      <div className={styles.grid}>
        {streaks.map(({ habit, streak }) => (
          <div key={habit.id} className={styles.tile} style={{ borderLeftColor: habit.color }}>
            <span className={styles.name}>{habit.name}</span>
            <span className={styles.count} style={{ color: habit.color }}>{streak}</span>
            <span className={styles.label}>{dayWord(streak)} поспіль</span>
          </div>
        ))}
      </div>
    </div>
  );
};
