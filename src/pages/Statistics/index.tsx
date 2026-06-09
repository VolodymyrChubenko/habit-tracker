import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from './StatBoard';
import { DateEditSheet } from './DateEditSheet';
import type { DateString } from '../../types';
import styles from './Statistics.module.scss';

export default function StatisticsPage() {
  const { activeHabits, archivedHabits } = useHabits();
  const [editDate, setEditDate] = useState<DateString | null>(null);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика</h1>
        {archivedHabits.length > 0 && (
          <Link to="/statistics/archive" className={styles.archiveLink}>
            Архів
          </Link>
        )}
      </div>

      <StatBoard scope="active" habits={activeHabits} onDayClick={setEditDate} />

      {editDate && (
        <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />
      )}
    </>
  );
}
