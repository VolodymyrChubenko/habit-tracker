import { useState } from 'react';
import { useAchievements, type AchievementEntry } from '../../hooks/useAchievements';
import { dayWord } from '../../utils/pluralize';
import type { ChallengeId } from '../../types';
import { FlameIcon } from './FlameIcon';
import { AchievementSheet } from './AchievementSheet';
import styles from './Achievements.module.scss';

const MEDAL_EMOJI: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const medalClass: Record<1 | 2 | 3, string> = { 1: styles.m1, 2: styles.m2, 3: styles.m3 };

const Row = ({ entry, position, onClick }: { entry: AchievementEntry; position: number; onClick: () => void }) => {
  const { challenge, currentStreak, longestStreak, totalCompletions, medal } = entry;
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={`${styles.rank} ${medal ? medalClass[medal] : ''}`}>
        {medal ? MEDAL_EMOJI[medal] : position}
      </span>
      <span className={styles.rowMain}>
        <span className={styles.rowName}>
          <span className={styles.dot} style={{ background: challenge.color }} />
          {challenge.name}
        </span>
        <span className={styles.rowSub}>рекорд {longestStreak} · всього {totalCompletions}</span>
      </span>
      <span className={styles.streak} style={{ color: challenge.color }}>
        <FlameIcon color={challenge.color} />
        <span className={styles.streakNum}>{currentStreak}</span>
        <span className={styles.streakWord}>{dayWord(currentStreak)}</span>
      </span>
    </button>
  );
};

export default function AchievementsPage() {
  const entries = useAchievements();
  const [selectedId, setSelectedId] = useState<ChallengeId | null>(null);

  const active = entries.filter(e => !e.challenge.archivedAt);
  const archived = entries.filter(e => e.challenge.archivedAt);
  const selected = entries.find(e => e.challenge.id === selectedId) ?? null;

  return (
    <>
      <h1 className={styles.title}>Досягнення</h1>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FlameIcon size={40} color="var(--color-accent)" />
          </div>
          <h2 className={styles.emptyTitle}>Скоро тут будуть досягнення</h2>
          <p className={styles.emptyText}>
            Виконуй челенджі щодня — і тут з'являться серії та нагороди
          </p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {active.map((entry, i) => (
              <Row
                key={entry.challenge.id}
                entry={entry}
                position={i + 1}
                onClick={() => setSelectedId(entry.challenge.id)}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <div className={styles.archived}>
              <p className={styles.sectionHead}>Архів</p>
              <div className={styles.list}>
                {archived.map((entry, i) => (
                  <Row
                    key={entry.challenge.id}
                    entry={entry}
                    position={active.length + i + 1}
                    onClick={() => setSelectedId(entry.challenge.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selected && <AchievementSheet entry={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
