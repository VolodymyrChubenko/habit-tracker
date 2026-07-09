import { useState } from 'react';
import { useChallengesStore } from '../../store/challengesStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { Challenge, ChallengeId } from '../../types/index';
import styles from './ArchivedChallengeList.module.scss';

interface Props {
  challenges: Challenge[];
}

export const ArchivedChallengeList = ({ challenges }: Props) => {
  const { unarchiveChallenge, deleteChallenge } = useChallengesStore();
  const [confirmId, setConfirmId] = useState<ChallengeId | null>(null);

  if (challenges.length === 0) return null;

  const handleDelete = (id: ChallengeId) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteChallenge(id);
    setConfirmId(null);
  };

  return (
    <div className={styles.section}>
      <p className={styles.label}>Заархівовані челенджі</p>
      <div className={styles.list}>
        {challenges.map(h => (
          <div key={h.id} className={styles.card}>
            <span className={styles.dot} style={{ background: h.color }} />
            <div className={styles.meta}>
              <span className={styles.name}>{h.name}</span>
              {h.archivedAt && (
                <span className={styles.date}>
                  Архівовано {formatDisplayDate(h.archivedAt)}
                </span>
              )}
            </div>
            <button className={styles.restore} onClick={() => unarchiveChallenge(h.id)}>
              Відновити
            </button>
            <button
              className={confirmId === h.id ? styles.deleteConfirm : styles.delete}
              onClick={() => handleDelete(h.id)}
            >
              {confirmId === h.id ? 'Точно?' : 'Видалити'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
