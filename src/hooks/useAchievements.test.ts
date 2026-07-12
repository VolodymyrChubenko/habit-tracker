import { describe, it, expect } from 'vitest';
import { rankAchievements } from './useAchievements';
import type { Challenge, ChallengeLog, DateString } from '../types';

const ch = (id: string, over: Partial<Challenge> = {}): Challenge => ({
  id,
  name: id,
  color: '#7CB9A8',
  createdAt: '2026-06-01',
  order: 0,
  ...over,
});

const logsFor = (id: string, ...dates: DateString[]): ChallengeLog[] =>
  dates.map(date => ({ challengeId: id, date, completedAt: `${date}T10:00:00.000Z` }));

const TODAY = '2026-06-09';

describe('rankAchievements — сортування', () => {
  it('сортує за поточним стріком ↓', () => {
    const logs = [
      ...logsFor('a', '2026-06-09'),
      ...logsFor('b', '2026-06-07', '2026-06-08', '2026-06-09'),
    ];
    const result = rankAchievements([ch('a'), ch('b')], logs, TODAY);
    expect(result.map(e => e.challenge.id)).toEqual(['b', 'a']);
    expect(result[0].currentStreak).toBe(3);
    expect(result[1].currentStreak).toBe(1);
  });

  it('при рівному поточному стріку — за найдовшим ↓', () => {
    // a: поточний 1, рекорд 1; b: поточний 1, рекорд 3 (01-03)
    const logs = [
      ...logsFor('a', '2026-06-09'),
      ...logsFor('b', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-09'),
    ];
    const result = rankAchievements([ch('a'), ch('b')], logs, TODAY);
    expect(result.map(e => e.challenge.id)).toEqual(['b', 'a']);
    expect(result[0].longestStreak).toBe(3);
  });

  it('при рівних стріках — за кількістю виконань ↓', () => {
    // Обидва: поточний 0 (розрив вчора), рекорд 2; у b більше виконань
    const logs = [
      ...logsFor('a', '2026-06-01', '2026-06-02'),
      ...logsFor('b', '2026-06-01', '2026-06-02', '2026-06-04', '2026-06-06'),
    ];
    const result = rankAchievements([ch('a'), ch('b')], logs, TODAY);
    expect(result.map(e => e.challenge.id)).toEqual(['b', 'a']);
    expect(result[0].totalCompletions).toBe(4);
  });

  it('активні завжди вище архівних, навіть із меншим стріком', () => {
    const logs = [
      ...logsFor('archived', '2026-06-07', '2026-06-08', '2026-06-09'),
      ...logsFor('active', '2026-06-09'),
    ];
    const result = rankAchievements(
      [ch('archived', { archivedAt: '2026-06-05' }), ch('active')],
      logs,
      TODAY,
    );
    expect(result.map(e => e.challenge.id)).toEqual(['active', 'archived']);
  });
});

describe('rankAchievements — медалі', () => {
  it('перші три позиції отримують медалі 1, 2, 3', () => {
    const logs = [
      ...logsFor('a', '2026-06-07', '2026-06-08', '2026-06-09'),
      ...logsFor('b', '2026-06-08', '2026-06-09'),
      ...logsFor('c', '2026-06-09'),
    ];
    const result = rankAchievements([ch('a'), ch('b'), ch('c'), ch('d')], logs, TODAY);
    expect(result.map(e => e.medal)).toEqual([1, 2, 3, null]);
  });

  it('архівний може отримати медаль, якщо активних менше трьох', () => {
    const logs = logsFor('arch', '2026-06-09');
    const result = rankAchievements([ch('act'), ch('arch', { archivedAt: '2026-06-05' })], logs, TODAY);
    expect(result[0].challenge.id).toBe('act');
    expect(result[0].medal).toBe(1);
    expect(result[1].medal).toBe(2);
  });
});

describe('rankAchievements — статистика і порожні випадки', () => {
  it('рахує стріки з урахуванням активних днів челенджу', () => {
    // Пн–Пт челендж: Чт 04, Пт 05, [вікенд пропущено], Пн 08, Вт 09
    const logs = logsFor('a', '2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09');
    const result = rankAchievements(
      [ch('a', { reminderEnabled: true, activeDays: [0, 1, 2, 3, 4] })],
      logs,
      TODAY,
    );
    expect(result[0].currentStreak).toBe(4);
    expect(result[0].longestStreak).toBe(4);
    expect(result[0].totalCompletions).toBe(4);
  });

  it('порожній стор → порожній список', () => {
    expect(rankAchievements([], [], TODAY)).toEqual([]);
  });

  it('челендж без логів має нульову статистику', () => {
    const result = rankAchievements([ch('a')], [], TODAY);
    expect(result[0]).toMatchObject({ currentStreak: 0, longestStreak: 0, totalCompletions: 0, medal: 1 });
  });
});
