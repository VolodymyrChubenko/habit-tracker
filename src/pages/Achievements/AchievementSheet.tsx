import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { dayWord } from '../../utils/pluralize';
import type { AchievementEntry } from '../../hooks/useAchievements';
import { FlameIcon } from './FlameIcon';
import styles from './AchievementSheet.module.scss';

interface Props {
  entry: AchievementEntry;
  onClose: () => void;
}

const MEDALS: Record<1 | 2 | 3, string> = {
  1: '🥇 1-ше місце',
  2: '🥈 2-ге місце',
  3: '🥉 3-тє місце',
};

export const AchievementSheet = ({ entry, onClose }: Props) => {
  const { challenge, currentStreak, longestStreak, totalCompletions, medal } = entry;
  const startedAt = format(parseISO(challenge.createdAt), 'd MMMM yyyy', { locale: uk });

  return (
    <BottomSheet onClose={onClose}>
      <div className={styles.name}>
        <span className={styles.dot} style={{ background: challenge.color }} />
        {challenge.name}
      </div>
      <div className={styles.sub}>
        розпочато {startedAt}
        {medal && <> · {MEDALS[medal]}</>}
      </div>

      <p className={styles.heading}>Статистика</p>
      <div className={styles.grid}>
        <div className={styles.flameCard}>
          <div className={styles.flameWrap}>
            <FlameIcon size={128} color={challenge.color} filled />
            <div className={styles.flameNum}>
              <span className={styles.n}>{currentStreak}</span>
              <span className={styles.w}>{dayWord(currentStreak)}</span>
            </div>
          </div>
          <span className={styles.flameCap}>поточна серія</span>
        </div>

        <div className={styles.tile}>
          <span className={styles.value} style={{ color: challenge.color }}>
            {longestStreak} {dayWord(longestStreak)}
          </span>
          <span className={styles.label}>Найбільше поспіль</span>
        </div>

        <div className={styles.tile}>
          <span className={styles.value} style={{ color: challenge.color }}>
            {totalCompletions} {dayWord(totalCompletions)}
          </span>
          <span className={styles.label}>Всі виконання</span>
        </div>
      </div>
    </BottomSheet>
  );
};
