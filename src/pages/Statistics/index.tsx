import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useStatistics } from '../../hooks/useStatistics';
import { HabitSelector } from './HabitSelector';
import { ProgressCalendar } from './ProgressCalendar';
import { DateEditSheet } from './DateEditSheet';
import type { DateString, HabitId } from '../../types';
import styles from './Statistics.module.scss';

export default function StatisticsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterIds, setFilterIds] = useState<HabitId[] | null>(null);
  const [editDate, setEditDate] = useState<DateString | null>(null);

  const { progressByDate } = useStatistics(filterIds ?? undefined);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <h1 className={styles.title}>Статистика</h1>

      <HabitSelector selected={filterIds} onChange={setFilterIds} />

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>
          {format(new Date(year, month, 1), 'LLLL yyyy', { locale: uk })}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      <ProgressCalendar
        year={year}
        month={month}
        progressByDate={progressByDate}
        onDayClick={setEditDate}
      />

      {editDate && (
        <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />
      )}
    </>
  );
}
