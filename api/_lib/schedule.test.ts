import { describe, it, expect } from 'vitest';
import { dueReminders, secondsUntilLocalMidnight, type Reminder } from './schedule';

// 2026-07-06 — понеділок. Влітку Київ = UTC+3 (EEST), Нью-Йорк = UTC-4 (EDT).
const rem = (over: Partial<Reminder> = {}): Reminder => ({
  challengeId: 'c1',
  name: 'Медитація',
  time: '09:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  ...over,
});

describe('dueReminders — точний збіг хвилини', () => {
  it('спрацьовує рівно о 09:00 за Києвом (06:00 UTC влітку)', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:00:00Z'));
    expect(hits).toHaveLength(1);
    expect(hits[0].challengeId).toBe('c1');
    expect(hits[0].localDate).toBe('2026-07-06');
  });

  it('той самий UTC-момент у Нью-Йорку (02:00 локально) — не спрацьовує', () => {
    const hits = dueReminders([rem()], 'America/New_York', new Date('2026-07-06T06:00:00Z'));
    expect(hits).toHaveLength(0);
  });

  it('нагадування на 02:00 у Нью-Йорку в цей момент спрацьовує', () => {
    const hits = dueReminders([rem({ time: '02:00' })], 'America/New_York', new Date('2026-07-06T06:00:00Z'));
    expect(hits).toHaveLength(1);
    expect(hits[0].localDate).toBe('2026-07-06');
  });
});

describe('dueReminders — вікно наздогону', () => {
  it('ловить нагадування, що було 4 хвилини тому (в межах вікна 5 хв)', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:04:00Z'));
    expect(hits).toHaveLength(1);
  });

  it('не ловить нагадування старше за вікно (5+ хвилин тому)', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:05:00Z'));
    expect(hits).toHaveLength(0);
  });

  it('повертає кожне нагадування максимум один раз', () => {
    const hits = dueReminders(
      [rem(), rem({ challengeId: 'c2', name: 'Спорт' })],
      'Europe/Kyiv',
      new Date('2026-07-06T06:02:00Z'),
    );
    expect(hits.map(h => h.challengeId).sort()).toEqual(['c1', 'c2']);
  });
});

describe('dueReminders — дні тижня (Пн=0 … Нд=6)', () => {
  it('спрацьовує у понеділок, коли активний лише понеділок', () => {
    const hits = dueReminders([rem({ days: [0] })], 'Europe/Kyiv', new Date('2026-07-06T06:00:00Z'));
    expect(hits).toHaveLength(1);
  });

  it('не спрацьовує у понеділок, коли активний лише вівторок', () => {
    const hits = dueReminders([rem({ days: [1] })], 'Europe/Kyiv', new Date('2026-07-06T06:00:00Z'));
    expect(hits).toHaveLength(0);
  });

  it('неділя мапиться в 6', () => {
    // 2026-07-05 — неділя
    const sunday = new Date('2026-07-05T06:00:00Z');
    expect(dueReminders([rem({ days: [6] })], 'Europe/Kyiv', sunday)).toHaveLength(1);
    expect(dueReminders([rem({ days: [5] })], 'Europe/Kyiv', sunday)).toHaveLength(0);
  });

  it('день тижня визначається у локальній таймзоні, не в UTC', () => {
    // 21:30 UTC понеділка = 00:30 вівторка у Києві
    const hits = dueReminders(
      [rem({ time: '00:30', days: [1] })],
      'Europe/Kyiv',
      new Date('2026-07-06T21:30:00Z'),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0].localDate).toBe('2026-07-07');
  });

  it('порожній список днів — ніколи не спрацьовує', () => {
    expect(dueReminders([rem({ days: [] })], 'Europe/Kyiv', new Date('2026-07-06T06:00:00Z'))).toHaveLength(0);
  });
});

describe('dueReminders — перехід на літній час (Київ, 2026-03-29)', () => {
  it('до переходу (28.03, UTC+2): 09:00 = 07:00 UTC', () => {
    expect(dueReminders([rem()], 'Europe/Kyiv', new Date('2026-03-28T07:00:00Z'))).toHaveLength(1);
    expect(dueReminders([rem()], 'Europe/Kyiv', new Date('2026-03-28T06:00:00Z'))).toHaveLength(0);
  });

  it('у день переходу (29.03, UTC+3): 09:00 = 06:00 UTC', () => {
    expect(dueReminders([rem()], 'Europe/Kyiv', new Date('2026-03-29T06:00:00Z'))).toHaveLength(1);
    expect(dueReminders([rem()], 'Europe/Kyiv', new Date('2026-03-29T07:00:00Z'))).toHaveLength(0);
  });
});

describe('dueReminders — lateSeconds', () => {
  it('точний збіг хвилини — нуль', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:00:00Z'));
    expect(hits[0].lateSeconds).toBe(0);
  });

  it('рахує секунди всередині поточної хвилини', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:00:42Z'));
    expect(hits[0].lateSeconds).toBe(42);
  });

  it('наздогін на 3 хвилини = 180 с плюс секунди', () => {
    const hits = dueReminders([rem()], 'Europe/Kyiv', new Date('2026-07-06T06:03:07Z'));
    expect(hits[0].lateSeconds).toBe(187);
  });
});

describe('secondsUntilLocalMidnight', () => {
  it('опівдні за UTC лишається пів доби', () => {
    expect(secondsUntilLocalMidnight('UTC', new Date('2026-07-06T12:00:00Z'))).toBe(12 * 3600);
  });

  it('рахує в локальній таймзоні, не в UTC', () => {
    // 06:00 UTC = 09:00 у Києві влітку → лишається 15 годин
    expect(secondsUntilLocalMidnight('Europe/Kyiv', new Date('2026-07-06T06:00:00Z'))).toBe(15 * 3600);
  });

  it('враховує хвилини й секунди', () => {
    // 20:30:15 у Києві
    expect(secondsUntilLocalMidnight('Europe/Kyiv', new Date('2026-07-06T17:30:15Z')))
      .toBe(3 * 3600 + 29 * 60 + 45);
  });

  it('о 23:59 не опускається нижче хвилини', () => {
    expect(secondsUntilLocalMidnight('Europe/Kyiv', new Date('2026-07-06T20:59:30Z'))).toBe(60);
  });

  it('одразу після локальної півночі — майже повна доба', () => {
    // 21:00 UTC = 00:00 наступного дня у Києві
    expect(secondsUntilLocalMidnight('Europe/Kyiv', new Date('2026-07-06T21:00:00Z'))).toBe(24 * 3600);
  });

  it('зимовий Київ (UTC+2) рахується по зсуву того дня', () => {
    // 10:00 UTC = 12:00 у Києві взимку → лишається 12 годин
    expect(secondsUntilLocalMidnight('Europe/Kyiv', new Date('2026-01-15T10:00:00Z'))).toBe(12 * 3600);
  });
});
