import { describe, it, expect } from 'vitest';
import { calcStreak } from './streakUtils';
import type { Habit, DateString } from '../types';

const habit = (createdAt: DateString, archivedAt?: DateString): Habit => ({
  id: 'h1',
  name: 'Test',
  color: '#7CB9A8',
  createdAt,
  archivedAt,
  order: 0,
});

const dates = (...ds: DateString[]): Set<DateString> => new Set(ds);

describe('calcStreak — сьогодні відмічено', () => {
  it('рахує сьогодні + попередні дні поспіль', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('стрейк = 1, якщо лише сьогодні (вчора пропущено)', () => {
    const done = dates('2026-06-09');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(1);
  });
});

describe('calcStreak — сьогодні НЕ відмічено', () => {
  it('рахує від учора, якщо сьогодні ще не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('обнуляє стрейк, якщо вчора пропущено і сьогодні не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — пропуск у середині', () => {
  it('зупиняє підрахунок на першому пропуску', () => {
    const done = dates('2026-06-09', '2026-06-08', '2026-06-06'); // 07 пропущено
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — межа createdAt', () => {
  it('день до createdAt не вважається пропуском', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(habit('2026-06-07'), done, '2026-06-09')).toBe(3);
  });

  it('не рахує дні до createdAt', () => {
    const done = dates('2026-06-09', '2026-06-08'); // createdAt 08
    expect(calcStreak(habit('2026-06-08'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — порожні / нульові випадки', () => {
  it('повертає 0, якщо логів немає', () => {
    expect(calcStreak(habit('2026-06-01'), dates(), '2026-06-09')).toBe(0);
  });

  it('повертає 0 для старого стрейку без зв\'язку із сьогодні/вчора', () => {
    const done = dates('2026-06-01', '2026-06-02', '2026-06-03');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — ретроактивне виправлення', () => {
  it('відновлює стрейк після виправлення пропущеного дня', () => {
    const before = dates('2026-06-06', '2026-06-07');
    expect(calcStreak(habit('2026-06-01'), before, '2026-06-09')).toBe(0);

    const after = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(habit('2026-06-01'), after, '2026-06-09')).toBe(3);
  });
});
