import { describe, it, expect } from 'vitest';
import { toDateString, getDaysInMonth, getMonthStart, formatDisplayDate } from './dateUtils';

describe('toDateString', () => {
  it('formats date as yyyy-MM-dd', () => {
    expect(toDateString(new Date(2026, 5, 4))).toBe('2026-06-04');
  });
});

describe('getDaysInMonth', () => {
  it('returns 30 for June', () => {
    expect(getDaysInMonth(2026, 5)).toBe(30); // month is 0-indexed
  });
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
  });
});

describe('getMonthStart', () => {
  it('returns day-of-week index (Mon=0) of first day of month', () => {
    // June 2026 starts on Monday
    expect(getMonthStart(2026, 5)).toBe(0);
  });
});

describe('formatDisplayDate', () => {
  it('returns localized date like "Середа, 4 червня"', () => {
    const result = formatDisplayDate('2026-06-04');
    expect(result).toContain('4');
    expect(typeof result).toBe('string');
  });
});
