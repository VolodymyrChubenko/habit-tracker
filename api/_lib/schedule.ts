/**
 * Чиста логіка розкладу нагадувань — без Redis і web-push,
 * щоб її можна було юніт-тестити.
 *
 * Сервер зберігає wall-clock час (HH:mm) + дні тижня + IANA-таймзону
 * і на кожному запуску крону перевіряє, чи "ця хвилина" настала
 * в локальному часі пристрою. DST обробляється Intl автоматично.
 */

export interface Reminder {
  challengeId: string;
  name: string;
  time: string; // "HH:mm"
  days: number[]; // Пн=0 … Нд=6
}

export interface DueHit extends Reminder {
  localDate: string; // "yyyy-MM-dd" у таймзоні пристрою
  lateSeconds: number; // наскільки крон спізнився відносно запланованої хвилини
}

const WEEKDAY_MON0: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

const localParts = (utc: Date, timeZone: string) => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(utc)) parts[p.type] = p.value;
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
    weekday: WEEKDAY_MON0[parts.weekday],
    secondsIntoDay: Number(hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
};

const DAY_SECONDS = 24 * 60 * 60;
const MIN_TTL_SECONDS = 60;

/**
 * TTL для push-повідомлення: нагадування живе до опівночі за локальним часом
 * пристрою. Прострочене «зроби зарядку о 8:00» не має прилітати наступного
 * ранку; дефолтний TTL у web-push — 4 тижні, тому його треба задавати явно.
 */
export const secondsUntilLocalMidnight = (timezone: string, nowUtc: Date): number => {
  const { secondsIntoDay } = localParts(nowUtc, timezone);
  return Math.max(MIN_TTL_SECONDS, DAY_SECONDS - secondsIntoDay);
};

/**
 * Які нагадування настали протягом останніх `windowMinutes` хвилин
 * (вікно терпить джитер крону; дедуплікація «не надіслати двічі»
 * живе окремо в Redis — тут лише унікальність у межах виклику).
 */
export const dueReminders = (
  reminders: Reminder[],
  timezone: string,
  nowUtc: Date,
  windowMinutes = 5,
): DueHit[] => {
  const hits: DueHit[] = [];
  const seen = new Set<string>();

  for (let k = 0; k < windowMinutes; k++) {
    const { date, time, weekday } = localParts(new Date(nowUtc.getTime() - k * 60_000), timezone);
    for (const r of reminders) {
      if (r.time !== time || !r.days.includes(weekday)) continue;
      const key = `${r.challengeId}:${date}:${r.time}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // k хвилин наздогону + секунди, що вже минули в поточній хвилині
      hits.push({ ...r, localDate: date, lateSeconds: k * 60 + nowUtc.getUTCSeconds() });
    }
  }

  return hits;
};
