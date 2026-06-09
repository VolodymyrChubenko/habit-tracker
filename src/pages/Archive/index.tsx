import { useNavigate } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from '../Statistics/StatBoard';
import styles from '../Statistics/Statistics.module.scss';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { archivedHabits } = useHabits();

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

      {archivedHabits.length === 0 ? (
        <p className={styles.empty}>Немає заархівованих навичок</p>
      ) : (
        <StatBoard scope="archived" habits={archivedHabits} />
      )}
    </>
  );
}
