import { format, subDays, addDays, parseISO } from 'date-fns';
import type { DateString, Challenge } from '../types';
import { weekdayMon0 } from './dateUtils';

const toStr = (d: Date): DateString => format(d, 'yyyy-MM-dd');

/** Запобіжник від нескінченних циклів (~11 років). */
const MAX_DAYS = 4000;

/**
 * Чи день активний для челенджу.
 * Дні тижня діють лише при увімкненому нагадуванні;
 * відсутній/порожній/повний activeDays = всі дні активні.
 */
const isActiveDay = (challenge: Challenge, dateStr: DateString): boolean => {
  if (!challenge.reminderEnabled) return true;
  const days = challenge.activeDays;
  if (!days || days.length === 0 || days.length === 7) return true;
  return days.includes(weekdayMon0(dateStr));
};

/**
 * Поточний стрейк (днів поспіль).
 * - сьогодні не виконано → пропускається без розриву (ще не "пропуск")
 * - виконаний день (активний чи ні) → +1
 * - активний невиконаний день зупиняє підрахунок
 * - НЕактивний невиконаний день пропускається (не рве стрік)
 * - ретроактивні дні до createdAt рахуються, якщо відмічені
 */
export const calcStreak = (
  challenge: Challenge,
  completedDates: Set<DateString>,
  todayStr: DateString,
): number => {
  let streak = 0;
  let cursor = parseISO(todayStr);

  for (let i = 0; i < MAX_DAYS; i++) {
    const dateStr = toStr(cursor);
    if (dateStr < challenge.createdAt && !completedDates.has(dateStr)) break;

    if (completedDates.has(dateStr)) {
      streak += 1;
    } else if (dateStr !== todayStr && isActiveDay(challenge, dateStr)) {
      break;
    }
    cursor = subDays(cursor, 1);
  }

  return streak;
};

/**
 * Найдовший стрейк за всю історію. Ті самі правила, що й calcStreak:
 * активний невиконаний день (крім сьогодні) обриває серію,
 * неактивні дні пропускаються, виконані — рахуються.
 */
export const calcLongestStreak = (
  challenge: Challenge,
  completedDates: Set<DateString>,
  todayStr: DateString,
): number => {
  if (completedDates.size === 0) return 0;

  let earliest = challenge.createdAt;
  for (const d of completedDates) {
    if (d < earliest) earliest = d;
  }

  const end = parseISO(todayStr);
  let cursor = parseISO(earliest);
  let run = 0;
  let best = 0;

  for (let i = 0; i < MAX_DAYS && cursor <= end; i++) {
    const dateStr = toStr(cursor);
    if (completedDates.has(dateStr)) {
      run += 1;
      if (run > best) best = run;
    } else if (dateStr !== todayStr && isActiveDay(challenge, dateStr)) {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }

  return best;
};
