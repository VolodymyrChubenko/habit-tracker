import { format, getDaysInMonth as dfnsDays, parseISO, startOfMonth, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { DateString } from '../types';

export const toDateString = (date: Date): DateString =>
  format(date, 'yyyy-MM-dd');

export const getDaysInMonth = (year: number, month: number): number =>
  dfnsDays(new Date(year, month, 1));

/** Returns 0=Mon … 6=Sun offset for the first day of the month */
export const getMonthStart = (year: number, month: number): number => {
  const first = startOfMonth(new Date(year, month, 1));
  const dow = getDay(first); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
};

export const formatDisplayDate = (date: DateString): string =>
  format(parseISO(date), 'EEEE, d MMMM', { locale: uk });

export const today = (): DateString => toDateString(new Date());
