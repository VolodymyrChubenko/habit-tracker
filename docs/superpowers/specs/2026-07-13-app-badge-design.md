# App Icon Badge (накопичені сповіщення) — Design Spec
**Date:** 2026-07-13
**Approach:** Badge = кількість активних (непереглянутих) сповіщень; App Badging API із service worker
**Scope:** Лічильник на іконці встановленої PWA; жодного нового UI чи серверних змін

---

## Overview

Коли приходить push-нагадування, на іконці застосунку зʼявляється числовий бейдж — як у нативних мобільних застосунках (iOS/desktop). Число означає **кількість непрочитаних нагадувань** і завжди дорівнює кількості сповіщень, які зараз висять у шторці. Відкриття застосунку або клік по сповіщенню «прочитує» їх і скидає бейдж.

Джерело істини — `registration.getNotifications()`: жодного окремого лічильника чи стану, який може розсинхронізуватися.

---

## Architecture

| File | Change |
|---|---|
| `src/sw.ts` | Після `showNotification` та в `notificationclick` — перерахунок бейджа за активними сповіщеннями |
| `src/utils/badgeUtils.ts` *(new)* | Хелпери: `syncBadge(registration)`, `clearReminders(registration)` — працюють і у вікні, і в SW |
| `src/app/App.tsx` (або новий хук) | На старті та на `visibilitychange → visible`: закрити reminder-сповіщення і скинути бейдж |
| `src/utils/badgeUtils.test.ts` *(new)* | Unit-тести хелперів із мокнутими `setAppBadge`/`getNotifications` |

Сервер (`api/*`) не змінюється: payload уже містить усе потрібне, дедуплікація по `tag: reminder-<challengeId>` вже є.

---

## Data Flow

```
Push приходить
  → SW showNotification (tag: reminder-<challengeId>)
  → getNotifications() → n активних
  → navigator.setAppBadge(n)

Клік по сповіщенню
  → notification.close()
  → getNotifications() → перерахунок → setAppBadge(n) або clearAppBadge()
  → фокус/відкриття вікна (як зараз)

Відкриття/фокус застосунку
  → registration.getNotifications() → filter(tag починається з "reminder") → close() усіх
  → navigator.clearAppBadge()
```

Оскільки `tag` унікальний per-challenge, повторний push того самого челенджу замінює старе сповіщення і не роздуває лічильник.

---

## Helpers (`src/utils/badgeUtils.ts`)

```typescript
// n = кількість активних сповіщень; 0 → clearAppBadge
syncBadge(registration: ServiceWorkerRegistration): Promise<void>

// закриває всі reminder-сповіщення і чистить бейдж
clearReminders(registration: ServiceWorkerRegistration): Promise<void>
```

- Обидва — fire-and-forget: усередині `try/catch`, помилка Badging API ніколи не ламає показ сповіщення чи роботу застосунку.
- Feature detection: `'setAppBadge' in navigator` — інакше no-op (сповіщення показуються як зараз).
- `navigator` типізується як `Navigator & { setAppBadge?; clearAppBadge? }` — у SW це `WorkerNavigator`, хелпер приймає обидва.

## Error Handling

- Немає підтримки API (Firefox, Android Chrome) → no-op, поведінка як сьогодні.
- `setAppBadge` кидає (наприклад, не-встановлена PWA на iOS) → мовчки ігноруємо.
- `getNotifications()` недоступний у контексті вікна без registration → хелпери завжди отримують registration параметром.

---

## Platform Behavior

| Платформа | Результат |
|---|---|
| iOS 16.4+ (PWA на домашньому екрані) | Числовий бейдж, як на референсному скріншоті |
| Desktop Chrome / Edge / Safari (встановлена PWA) | Числовий бейдж |
| Android | API відсутній → no-op; лаунчер сам показує крапку від активних сповіщень |
| Firefox / не-встановлений сайт | Нічого (no-op) |

---

## Testing

- `badgeUtils.test.ts`: мок `navigator.setAppBadge`/`clearAppBadge` + фейковий registration з `getNotifications`:
  - n > 0 → `setAppBadge(n)`;
  - n = 0 → `clearAppBadge()`;
  - API відсутній → жодних викликів, без помилок;
  - `setAppBadge` reject → помилка не прокидається назовні;
  - `clearReminders` закриває всі сповіщення та чистить бейдж.
- Ручна перевірка на iOS: надіслати 2 нагадування → бейдж «2»; відкрити застосунок → бейдж зник.
