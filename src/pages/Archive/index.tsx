import { useNavigate } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from '../Statistics/StatBoard';
import { ArchivedHabitList } from './ArchivedHabitList';
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

      <StatBoard scope="archived" habits={archivedHabits} />
      <ArchivedHabitList habits={archivedHabits} />
    </>
  );
}
