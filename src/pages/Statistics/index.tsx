import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChallenges } from '../../hooks/useChallenges';
import { StatBoard } from './StatBoard';
import { DateEditSheet } from './DateEditSheet';
import type { DateString } from '../../types';
import styles from './Statistics.module.scss';

export default function StatisticsPage() {
  const { activeChallenges } = useChallenges();
  const [editDate, setEditDate] = useState<DateString | null>(null);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика</h1>
        <Link to="/statistics/archive" className={styles.archiveLink}>
          Архів
        </Link>
      </div>

      <StatBoard scope="active" challenges={activeChallenges} onDayClick={setEditDate} />

      {editDate && (
        <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />
      )}
    </>
  );
}
