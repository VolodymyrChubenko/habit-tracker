import { format, subDays, parseISO } from 'date-fns';
import type { DateString, Habit } from '../types';

const toStr = (d: Date): DateString => format(d, 'yyyy-MM-dd');

/**
 * Поточний стрейк (днів поспіль).
 * - сьогодні виконано → включаємо сьогодні, рахуємо назад
 * - сьогодні НЕ виконано → рахуємо від учора (сьогодні ще не "пропуск")
 * - перший пропуск зупиняє підрахунок
 * - дні до createdAt не вважаються пропуском
 */
export const calcStreak = (
  habit: Habit,
  completedDates: Set<DateString>,
  todayStr: DateString,
): number => {
  const todayDone = completedDates.has(todayStr);

  let cursor = todayDone ? parseISO(todayStr) : subDays(parseISO(todayStr), 1);
  let streak = 0;

  while (true) {
    const dateStr = toStr(cursor);
    if (dateStr < habit.createdAt) break;

    if (completedDates.has(dateStr)) {
      streak += 1;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }

  return streak;
};
