# Push Notifications — Design Spec
**Date:** 2026-06-10  
**Approach:** Client-only (Service Worker `postMessage` + `showNotification`)  
**Scope:** Daily reminder at a user-configured time; no server required

---

## Overview

Add a "Нагадування" section to the Settings page. The user can toggle a daily reminder on/off and set the time. When enabled, the app schedules a notification via the Service Worker. The SW fires `showNotification()` at the configured time each day.

---

## Architecture

Six files are affected:

| File | Change |
|---|---|
| `src/store/settingsStore.ts` | Add `reminderEnabled`, `reminderTime`, two setters |
| `src/pages/Settings/index.tsx` | Add "Нагадування" section (top position) |
| `src/sw.ts` *(new)* | Custom SW: handle `message`, schedule `showNotification` |
| `src/hooks/useReminderScheduler.ts` *(new)* | Hook: sync store → SW on mount and on change |
| `src/app/App.tsx` | Mount `useReminderScheduler` |
| `vite.config.ts` | Switch `generateSW` → `injectManifest` |

---

## Data Model

Add to `settingsStore` (persisted via `zustand/persist`):

```typescript
reminderEnabled: boolean   // default: false
reminderTime: string       // "HH:mm" format, default: "08:00"
setReminderEnabled: (v: boolean) => void
setReminderTime: (t: string) => void
```

---

## Data Flow

```
User toggles ON
  → requestPermission()
  → if granted: setReminderEnabled(true) → store persisted
  → useReminderScheduler detects change → postMessage to SW
  → SW clears previous setTimeout
  → SW calculates ms until reminderTime (today or tomorrow if past)
  → SW setTimeout → self.registration.showNotification()
```

On every app open, `useReminderScheduler` re-sends the schedule to the SW, resetting the timer. This compensates for SW termination between sessions.

---

## Service Worker (`src/sw.ts`)

- Extends existing Workbox precache (injectManifest strategy)
- Listens for `message` event:

```typescript
// message shape
{ type: 'SCHEDULE_REMINDER', enabled: boolean, time: string }
```

- On receive:
  1. `clearTimeout(scheduledTimer)`
  2. If `enabled === false`: return
  3. Parse `time` ("HH:mm") → calculate ms until next occurrence
     - If the time has already passed today → schedule for tomorrow (+24h)
  4. `setTimeout(() => self.registration.showNotification(...), ms)`

- Notification payload:
  ```typescript
  title: 'Habit Tracker'
  options: {
    body: 'Час відмічати звички! 🌿',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-reminder',   // deduplicates if fired twice
  }
  ```

---

## `useReminderScheduler` Hook

```typescript
// reads from store
const { reminderEnabled, reminderTime } = useSettingsStore()

// on mount and when values change:
// navigator.serviceWorker.ready → sw.postMessage({ type, enabled, time })
```

Used once in `App.tsx` (not in Settings — avoids double-send).

---

## Settings UI

Section order on the Settings page:
1. **Нагадування** ← new, top
2. Зовнішній вигляд
3. Версія

### "Нагадування" section layout

```
┌─────────────────────────────────────────────┐
│ НАГАДУВАННЯ                                 │
├─────────────────────────────────────────────┤
│ 🔔  Щоденне нагадування          [Toggle]  │
├─────────────────────────────────────────────┤
│ 🕐  Час нагадування              [08:00 ▾] │  ← disabled (opacity 0.4) when toggle off
└─────────────────────────────────────────────┘
```

- Toggle uses existing visual style (accent color `#7CB9A8` when active)
- Time input: native `<input type="time">`, styled to match the row
- When toggle is off: time row has `opacity: 0.4`, `pointer-events: none`

---

## Permission Flow

| State | Action |
|---|---|
| `Notification.permission === 'granted'` | Enable immediately |
| `Notification.permission === 'default'` | Call `requestPermission()` → if granted: enable; if denied: show Toast, revert toggle |
| `Notification.permission === 'denied'` | Show Toast "Дозвольте сповіщення у налаштуваннях браузера", do not enable |
| SW not supported | Show Toast "Сповіщення не підтримуються", disable toggle |
| Notification API not supported | Same as above |

---

## vite.config.ts Change

```typescript
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  // ...rest unchanged
})
```

---

## Limitations

- The SW `setTimeout` is cleared if the SW is terminated by the browser
- On Android with the PWA installed to the home screen, the SW survives long enough for reliable daily notifications
- On iOS (Safari, PWA on home screen, iOS 16.4+), push notifications are supported but SW lifetime is shorter — delivery is best-effort
- On desktop browsers (tab closed), notifications will not fire — this is expected for the client-only approach

---

## Out of Scope

- Server-side push (VAPID, push subscriptions) — future enhancement
- Per-habit notification times
- Snooze functionality
- Dynamic notification body (showing incomplete habits count)
