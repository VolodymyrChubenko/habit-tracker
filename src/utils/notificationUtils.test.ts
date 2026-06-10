import { describe, it, expect } from 'vitest';
import { calcMsUntilTime } from './notificationUtils';

describe('calcMsUntilTime', () => {
  it('returns ms until the time today when it has not passed', () => {
    const now = new Date('2026-06-10T07:00:00');
    expect(calcMsUntilTime('08:00', now)).toBe(60 * 60 * 1000); // 1 hour
  });

  it('schedules for tomorrow when the time has already passed today', () => {
    const now = new Date('2026-06-10T09:00:00');
    expect(calcMsUntilTime('08:00', now)).toBe(23 * 60 * 60 * 1000); // 23 hours
  });

  it('schedules for tomorrow when the time is exactly now', () => {
    const now = new Date('2026-06-10T08:00:00.000');
    expect(calcMsUntilTime('08:00', now)).toBe(24 * 60 * 60 * 1000);
  });

  it('handles minutes correctly', () => {
    const now = new Date('2026-06-10T08:30:00');
    expect(calcMsUntilTime('08:45', now)).toBe(15 * 60 * 1000); // 15 min
  });
});
