import { describe, it, expect } from 'vitest';
import { calcStreak, calcLongestStreak } from './streakUtils';
import type { Challenge, DateString } from '../types';

const challenge = (createdAt: DateString, archivedAt?: DateString): Challenge => ({
  id: 'h1',
  name: 'Test',
  color: '#7CB9A8',
  createdAt,
  archivedAt,
  order: 0,
});

/** Челендж з нагадуванням і активними днями (Пн=0 … Нд=6). */
const weekdayChallenge = (createdAt: DateString, activeDays: number[]): Challenge => ({
  ...challenge(createdAt),
  reminderEnabled: true,
  reminderTime: '09:00',
  activeDays,
});

const dates = (...ds: DateString[]): Set<DateString> => new Set(ds);

describe('calcStreak — сьогодні відмічено', () => {
  it('рахує сьогодні + попередні дні поспіль', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('стрейк = 1, якщо лише сьогодні (вчора пропущено)', () => {
    const done = dates('2026-06-09');
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(1);
  });
});

describe('calcStreak — сьогодні НЕ відмічено', () => {
  it('рахує від учора, якщо сьогодні ще не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('обнуляє стрейк, якщо вчора пропущено і сьогодні не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07');
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — пропуск у середині', () => {
  it('зупиняє підрахунок на першому пропуску', () => {
    const done = dates('2026-06-09', '2026-06-08', '2026-06-06'); // 07 пропущено
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — межа createdAt', () => {
  it('день до createdAt не вважається пропуском', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(challenge('2026-06-07'), done, '2026-06-09')).toBe(3);
  });

  it('не рахує дні до createdAt', () => {
    const done = dates('2026-06-09', '2026-06-08'); // createdAt 08
    expect(calcStreak(challenge('2026-06-08'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — порожні / нульові випадки', () => {
  it('повертає 0, якщо логів немає', () => {
    expect(calcStreak(challenge('2026-06-01'), dates(), '2026-06-09')).toBe(0);
  });

  it('повертає 0 для старого стрейку без зв\'язку із сьогодні/вчора', () => {
    const done = dates('2026-06-01', '2026-06-02', '2026-06-03');
    expect(calcStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — ретроактивні дні до createdAt', () => {
  it('рахує дні відмічені ДО createdAt як частину стрейку', () => {
    // createdAt = 08, але юзер відмітив 06 і 07 ретроактивно
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(challenge('2026-06-08'), done, '2026-06-09')).toBe(4);
  });

  it('зупиняється на пропуску навіть якщо є ретроактивні дні далі', () => {
    // 05 є, але 06 пропущено → стрейк = 3 (09, 08, 07), 05 не рахується
    const done = dates('2026-06-05', '2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(challenge('2026-06-08'), done, '2026-06-09')).toBe(3);
  });
});

describe('calcStreak — ретроактивне виправлення', () => {
  it('відновлює стрейк після виправлення пропущеного дня', () => {
    const before = dates('2026-06-06', '2026-06-07');
    expect(calcStreak(challenge('2026-06-01'), before, '2026-06-09')).toBe(0);

    const after = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(challenge('2026-06-01'), after, '2026-06-09')).toBe(3);
  });
});

// Календар: 2026-06-01 = понеділок, 06=Сб, 07=Нд, 08=Пн, 09=Вт
const MON_FRI = [0, 1, 2, 3, 4];

describe('calcStreak — активні дні тижня', () => {
  it('вимкнене нагадування → activeDays ігнорується, всі дні активні', () => {
    const ch = { ...challenge('2026-06-01'), reminderEnabled: false, activeDays: MON_FRI };
    // Сб+Нд не відмічені → для "всі дні активні" це розрив
    const done = dates('2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09');
    expect(calcStreak(ch, done, '2026-06-09')).toBe(2);
  });

  it('невиконаний вікенд не рве стрік для Пн–Пт челенджу', () => {
    // Чт 04, Пт 05 виконано; Сб 06, Нд 07 пропущено; Пн 08, Вт 09 виконано
    const done = dates('2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09');
    expect(calcStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-09')).toBe(4);
  });

  it('виконання у неактивний день рахується як бонус (+1)', () => {
    // Пт 05, Сб 06, Нд 07, Пн 08, Вт 09 — все виконано, включно з вікендом
    const done = dates('2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-09')).toBe(5);
  });

  it('пропущений активний день рве стрік', () => {
    // Пт 05 пропущено (активний!) → стрік лише Пн 08 + Вт 09
    const done = dates('2026-06-04', '2026-06-08', '2026-06-09');
    expect(calcStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-09')).toBe(2);
  });

  it('сьогодні неактивний і не виконаний → пропускається, рахує з активних днів назад', () => {
    // Сьогодні Сб 06 (неактивний, не виконаний); Чт 04 + Пт 05 виконані
    const done = dates('2026-06-04', '2026-06-05');
    expect(calcStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-06')).toBe(2);
  });

  it('сьогодні активний і не виконаний → пропускається без розриву (існуюче правило)', () => {
    // Сьогодні Вт 09 не виконаний; Пн 08 виконаний
    const done = dates('2026-06-08');
    expect(calcStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-09')).toBe(1);
  });

  it('порожній activeDays → всі дні активні (захист)', () => {
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(weekdayChallenge('2026-06-01', []), done, '2026-06-09')).toBe(4);
  });

  it('не зациклюється, коли до createdAt тягнеться хвіст неактивних днів', () => {
    // Челендж лише по понеділках; створений 08, виконаний 08; сьогодні 09
    const done = dates('2026-06-08');
    expect(calcStreak(weekdayChallenge('2026-06-08', [0]), done, '2026-06-09')).toBe(1);
  });
});

describe('calcLongestStreak', () => {
  it('без активних днів — найдовша серія календарних днів', () => {
    // 01-03 поспіль, 04 пропущено, 05-09 поспіль → 5
    const done = dates('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcLongestStreak(challenge('2026-06-01'), done, '2026-06-30')).toBe(5);
  });

  it('вікенд не розриває серію Пн–Пт челенджу', () => {
    // Чт 04, Пт 05, [вікенд], Пн 08, Вт 09 → 4
    const done = dates('2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09');
    expect(calcLongestStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-30')).toBe(4);
  });

  it('пропущений активний день розриває: повертає довшу з двох серій', () => {
    // Серія 1: Пн 01 - Ср 03 (3); Чт 04 пропущено; Серія 2: Пт 05 + Пн 08 + Вт 09 + Ср 10 (4)
    const done = dates('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-09', '2026-06-10');
    expect(calcLongestStreak(weekdayChallenge('2026-06-01', MON_FRI), done, '2026-06-30')).toBe(4);
  });

  it('поточна незавершена сьогоднішня дата не розриває серію', () => {
    // Сьогодні 09, не виконано; 06-08 виконано → longest 3
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcLongestStreak(challenge('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('повертає 0 без логів', () => {
    expect(calcLongestStreak(challenge('2026-06-01'), dates(), '2026-06-09')).toBe(0);
  });

  it('рахує ретроактивні відмітки до createdAt', () => {
    // createdAt 08, відмічено 05 (Пт), 08, 09 для Пн-Пт → серія 3
    const done = dates('2026-06-05', '2026-06-08', '2026-06-09');
    expect(calcLongestStreak(weekdayChallenge('2026-06-08', MON_FRI), done, '2026-06-30')).toBe(3);
  });

  it('дорівнює поточному стріку, коли історія — одна серія', () => {
    const ch = weekdayChallenge('2026-06-01', MON_FRI);
    const done = dates('2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09');
    expect(calcLongestStreak(ch, done, '2026-06-09')).toBe(calcStreak(ch, done, '2026-06-09'));
  });
});
