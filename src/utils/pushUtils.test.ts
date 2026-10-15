import { describe, it, expect } from 'vitest';
import { buildReminders } from './pushUtils';
import type { Challenge, ChallengeLog } from '../types';

const TODAY = '2026-07-06';

const ch = (over: Partial<Challenge>): Challenge => ({
  id: 'c1',
  name: 'Медитація',
  color: '#7CB9A8',
  createdAt: '2026-06-01',
  order: 0,
  ...over,
});

const log = (challengeId: string, date: string): ChallengeLog => ({
  challengeId,
  date,
  completedAt: `${date}T07:00:00.000Z`,
});

describe('buildReminders', () => {
  it('бере лише активні челенджі з увімкненим нагадуванням', () => {
    const reminders = buildReminders(
      [
        ch({ id: 'a', reminderEnabled: true, reminderTime: '08:30', activeDays: [0, 2] }),
        ch({ id: 'b', reminderEnabled: false }),
        ch({ id: 'c', reminderEnabled: true, archivedAt: '2026-07-01' }),
      ],
      [],
      TODAY,
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toEqual({
      challengeId: 'a',
      name: 'Медитація',
      time: '08:30',
      days: [0, 2],
      completedDates: [],
    });
  });

  it('підставляє дефолтний час і всі дні, якщо поля відсутні', () => {
    const reminders = buildReminders([ch({ id: 'a', reminderEnabled: true })], [], TODAY);
    expect(reminders[0].time).toBe('09:00');
    expect(reminders[0].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('порожній activeDays → всі дні', () => {
    const reminders = buildReminders([ch({ id: 'a', reminderEnabled: true, activeDays: [] })], [], TODAY);
    expect(reminders[0].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('повертає порожній список без челенджів із нагадуваннями', () => {
    expect(buildReminders([ch({ id: 'a' })], [], TODAY)).toEqual([]);
  });

  it('completedDates — лише логи цього челенджу, від сьогодні', () => {
    const reminders = buildReminders(
      [ch({ id: 'a', reminderEnabled: true }), ch({ id: 'b', reminderEnabled: true })],
      [log('a', '2026-07-05'), log('a', TODAY), log('b', '2026-07-01')],
      TODAY,
    );
    expect(reminders.find(r => r.challengeId === 'a')?.completedDates).toEqual([TODAY]);
    expect(reminders.find(r => r.challengeId === 'b')?.completedDates).toEqual([]);
  });
});
