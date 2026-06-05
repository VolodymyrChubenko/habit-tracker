import { CircularProgress } from '../../components/CircularProgress/CircularProgress';
import { getDaysInMonth, getMonthStart, toDateString, today } from '../../utils/dateUtils';
import type { DateString } from '../../types';
import styles from './Statistics.module.scss';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

interface Props {
  year: number;
  month: number; // 0-indexed
  progressByDate: Map<DateString, number>;
  onDayClick: (date: DateString) => void;
}

type Cell =
  | { key: string; empty: true }
  | { key: string; empty: false; day: number; dateStr: DateString };

export const ProgressCalendar = ({ year, month, progressByDate, onDayClick }: Props) => {
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getMonthStart(year, month);
  const todayStr = today();

  const cells: Cell[] = [
    ...Array.from({ length: startOffset }, (_, i): Cell => ({ key: `e${i}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, i): Cell => {
      const day = i + 1;
      const dateStr = toDateString(new Date(year, month, day));
      return { key: dateStr, empty: false, day, dateStr };
    }),
  ];

  return (
    <div className={styles.calendar}>
      <div className={styles.dayHeaders}>
        {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className={styles.daysGrid}>
        {cells.map(cell =>
          cell.empty ? (
            <div key={cell.key} style={{ aspectRatio: 1 }} />
          ) : (
            <div
              key={cell.key}
              className={[
                styles.dayCell,
                cell.dateStr === todayStr ? styles.today : '',
                cell.dateStr > todayStr ? styles.future : '',
              ].join(' ')}
              onClick={() => cell.dateStr <= todayStr && onDayClick(cell.dateStr)}
            >
              <CircularProgress
                day={cell.day}
                progress={progressByDate.get(cell.dateStr) ?? 0}
                isToday={cell.dateStr === todayStr}
                isFuture={cell.dateStr > todayStr}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
};
