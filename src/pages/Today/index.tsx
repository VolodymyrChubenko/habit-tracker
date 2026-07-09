import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTodayProgress } from '../../hooks/useTodayProgress';
import { useChallengesStore } from '../../store/challengesStore';
import { ChallengeList } from './ChallengeList';
import { DoneList } from './DoneList';
import { AddChallengeSheet } from './AddChallengeSheet';
import { EditChallengeSheet } from './EditChallengeSheet';
import type { Challenge } from '../../types';
import styles from './Today.module.scss';

export default function TodayPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const { todoChallenges, doneChallenges, total } = useTodayProgress();
  const { addChallenge } = useChallengesStore();

  const completed = doneChallenges.length;
  const progressPct = total === 0 ? 0 : (completed / total) * 100;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.titles}>
          <h1 className={styles.title}>Сьогодні</h1>
          <p className={styles.subtitle}>
            {format(new Date(), 'EEEE, d MMMM', { locale: uk })}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)} aria-label="Додати челендж">
          +
        </button>
      </div>

      {total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Прогрес</span>
            <span>{completed} / {total}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
      
      {total === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <h2 className={styles.emptyTitle}>Ще немає челенджів</h2>
          <p className={styles.emptyText}>
            Створи свій перший челендж і почни відстежувати прогрес
          </p>
          <button className={styles.emptyBtn} onClick={() => setShowAdd(true)}>
            <span className={styles.emptyBtnPlus}>+</span> Додати челендж
          </button>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            <ChallengeList challenges={todoChallenges} onEdit={setEditingChallenge} />
          </div>

          <DoneList challenges={doneChallenges} onEdit={setEditingChallenge} />
        </>
      )}

      {showAdd && (
        <AddChallengeSheet
          onClose={() => setShowAdd(false)}
          onAdd={(name, color, reminder) => { addChallenge(name, color, reminder); setShowAdd(false); }}
        />
      )}

      {editingChallenge && (
        <EditChallengeSheet
          challenge={editingChallenge}
          onClose={() => setEditingChallenge(null)}
        />
      )}
    </>
  );
}
