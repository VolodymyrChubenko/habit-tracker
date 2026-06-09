import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useStatistics } from '../../hooks/useStatistics';
import { useSwipe } from '../../hooks/useSwipe';
import { HabitSelector } from './HabitSelector';
import { ProgressCalendar } from './ProgressCalendar';
import { StreakTiles } from './StreakTiles';
import type { DateString, Habit, HabitId, StatScope } from '../../types';
import styles from './Statistics.module.scss';

interface Props {
  scope: StatScope;
  habits: Habit[];
  onDayClick?: (date: DateString) => void;
}

export const StatBoard = ({ scope, habits, onDayClick }: Props) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterIds, setFilterIds] = useState<HabitId[] | null>(null);

  const { progressByDate } = useStatistics(scope, filterIds ?? undefined);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const swipe = useSwipe({ onSwipeLeft: nextMonth, onSwipeRight: prevMonth });

  return (
    <>
      <HabitSelector habits={habits} selected={filterIds} onChange={setFilterIds} />

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>
          {format(new Date(year, month, 1), 'LLLL yyyy', { locale: uk })}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      <div {...swipe}>
        <ProgressCalendar
          year={year}
          month={month}
          progressByDate={progressByDate}
          onDayClick={onDayClick}
        />
      </div>

      <StreakTiles scope={scope} habits={habits} filterIds={filterIds} />
    </>
  );
};
