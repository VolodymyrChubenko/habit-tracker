import { useNavigate } from 'react-router-dom';
import { useChallenges } from '../../hooks/useChallenges';
import { StatBoard } from '../Statistics/StatBoard';
import { ArchivedChallengeList } from './ArchivedChallengeList';
import styles from '../Statistics/Statistics.module.scss';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { archivedChallenges } = useChallenges();

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Архів навичок</h1>
        <button
          className={styles.closeBtn}
          aria-label="Закрити архів"
          onClick={() => navigate('/statistics')}
        >
          ✕
        </button>
      </div>

      <StatBoard scope="archived" challenges={archivedChallenges} />
      <ArchivedChallengeList challenges={archivedChallenges} />
    </>
  );
}
