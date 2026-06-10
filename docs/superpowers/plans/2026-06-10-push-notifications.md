# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily reminder push notification configurable from the Settings page (toggle on/off + time picker), delivered via Service Worker `showNotification`.

**Architecture:** A pure scheduling utility (`calcMsUntilTime`) provides testable time math. A custom Service Worker (`src/sw.ts`) listens for `postMessage` and schedules `showNotification` via `setTimeout`. A hook (`useReminderScheduler`) syncs the Zustand store to the SW on every change. Settings UI handles the Notification permission flow before enabling.

**Tech Stack:** React 18, TypeScript, Zustand/persist, Vitest, vite-plugin-pwa (injectManifest strategy), workbox-precaching

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/utils/notificationUtils.ts` | Create | Pure: `calcMsUntilTime(timeStr, now?)` |
| `src/utils/notificationUtils.test.ts` | Create | Unit tests for scheduling math |
| `src/store/settingsStore.ts` | Modify | Add `reminderEnabled`, `reminderTime`, setters |
| `src/store/settingsStore.test.ts` | Modify | Tests for new store fields |
| `src/sw.ts` | Create | Custom SW: message handler + showNotification |
| `vite.config.ts` | Modify | Switch `generateSW` → `injectManifest` |
| `src/hooks/useReminderScheduler.ts` | Create | Hook: store → postMessage to SW |
| `src/hooks/useReminderScheduler.test.ts` | Create | Hook tests with mocked serviceWorker |
| `src/pages/Settings/index.tsx` | Modify | Add "Нагадування" section + permission flow |
| `src/pages/Settings/Settings.module.scss` | Modify | Toggle + time input styles |
| `src/app/App.tsx` | Modify | Mount `useReminderScheduler` |

---

## Task 1: Pure scheduling utility

**Files:**
- Create: `src/utils/notificationUtils.ts`
- Create: `src/utils/notificationUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/utils/notificationUtils.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- notificationUtils
```

Expected: 4 failures — `calcMsUntilTime` not defined.

- [ ] **Step 3: Implement the utility**

```typescript
// src/utils/notificationUtils.ts
export function calcMsUntilTime(timeStr: string, now: Date = new Date()): number {
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- notificationUtils
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/utils/notificationUtils.ts src/utils/notificationUtils.test.ts
git commit -m "feat: add calcMsUntilTime scheduling utility"
```

---

## Task 2: Extend settingsStore

**Files:**
- Modify: `src/store/settingsStore.ts`
- Modify: `src/store/settingsStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/store/settingsStore.test.ts` (after the existing `beforeEach`, extend it):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  useSettingsStore.setState({
    theme: 'system',
    reminderEnabled: false,
    reminderTime: '08:00',
  });
});

describe('setTheme', () => {
  it('updates theme to light', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('updates theme to dark', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });
});

describe('reminder settings', () => {
  it('defaults to disabled with time 08:00', () => {
    const { reminderEnabled, reminderTime } = useSettingsStore.getState();
    expect(reminderEnabled).toBe(false);
    expect(reminderTime).toBe('08:00');
  });

  it('setReminderEnabled toggles the value', () => {
    useSettingsStore.getState().setReminderEnabled(true);
    expect(useSettingsStore.getState().reminderEnabled).toBe(true);
  });

  it('setReminderTime updates the time string', () => {
    useSettingsStore.getState().setReminderTime('09:30');
    expect(useSettingsStore.getState().reminderTime).toBe('09:30');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- settingsStore
```

Expected: reminder tests fail — fields not defined.

- [ ] **Step 3: Update the store**

Replace the full content of `src/store/settingsStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  reminderEnabled: boolean;
  reminderTime: string;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
      reminderEnabled: false,
      reminderTime: '08:00',
      setReminderEnabled: v => set({ reminderEnabled: v }),
      setReminderTime: t => set({ reminderTime: t }),
    }),
    { name: 'habit-tracker-settings' },
  ),
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- settingsStore
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/store/settingsStore.ts src/store/settingsStore.test.ts
git commit -m "feat: add reminderEnabled and reminderTime to settingsStore"
```

---

## Task 3: Custom Service Worker + vite.config update

**Files:**
- Create: `src/sw.ts`
- Modify: `vite.config.ts`

No unit tests — SW runs in a different context. Scheduling logic is covered by Task 1 tests.

- [ ] **Step 1: Verify workbox-precaching is available**

```bash
node -e "require('workbox-precaching'); console.log('ok')"
```

If output is `ok`, skip to Step 2. If it throws, run:

```bash
npm install workbox-precaching
```

- [ ] **Step 2: Create `src/sw.ts`**

```typescript
/// <reference lib="WebWorker" />
import { precacheAndRoute } from 'workbox-precaching';
import { calcMsUntilTime } from './utils/notificationUtils';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type: string; enabled: boolean; time: string };
  if (data?.type !== 'SCHEDULE_REMINDER') return;

  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (!data.enabled) return;

  const ms = calcMsUntilTime(data.time);
  scheduledTimer = setTimeout(() => {
    void self.registration.showNotification('Habit Tracker', {
      body: 'Час відмічати звички! 🌿',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    });
    scheduledTimer = null;
  }, ms);
});
```

- [ ] **Step 3: Update `vite.config.ts`**

Replace the `VitePWA(...)` call — change `generateSW` to `injectManifest` and rename `workbox` to `injectManifest`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Habit Tracker',
        short_name: 'Habits',
        description: 'Відслідковуй щоденні звички',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF7F0',
        theme_color: '#7CB9A8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  css: {
    modules: {
      generateScopedName: '[local]_[hash:5]',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
});
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: no errors, `dist/sw.js` is generated.

- [ ] **Step 5: Commit**

```bash
git add src/sw.ts vite.config.ts
git commit -m "feat: add custom service worker with SCHEDULE_REMINDER handler"
```

---

## Task 4: `useReminderScheduler` hook

**Files:**
- Create: `src/hooks/useReminderScheduler.ts`
- Create: `src/hooks/useReminderScheduler.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/useReminderScheduler.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReminderScheduler } from './useReminderScheduler';
import { useSettingsStore } from '../store/settingsStore';

const mockPostMessage = vi.fn();

beforeEach(() => {
  mockPostMessage.mockClear();
  useSettingsStore.setState({
    theme: 'system',
    reminderEnabled: false,
    reminderTime: '08:00',
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve({ active: { postMessage: mockPostMessage } }),
    },
    configurable: true,
    writable: true,
  });
});

describe('useReminderScheduler', () => {
  it('sends SCHEDULE_REMINDER on mount with store defaults', async () => {
    renderHook(() => useReminderScheduler());
    await act(async () => { await Promise.resolve(); });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'SCHEDULE_REMINDER',
      enabled: false,
      time: '08:00',
    });
  });

  it('re-sends when reminderEnabled changes', async () => {
    renderHook(() => useReminderScheduler());
    await act(async () => { await Promise.resolve(); });

    act(() => { useSettingsStore.getState().setReminderEnabled(true); });
    await act(async () => { await Promise.resolve(); });

    expect(mockPostMessage).toHaveBeenLastCalledWith({
      type: 'SCHEDULE_REMINDER',
      enabled: true,
      time: '08:00',
    });
  });

  it('re-sends when reminderTime changes', async () => {
    renderHook(() => useReminderScheduler());
    await act(async () => { await Promise.resolve(); });

    act(() => { useSettingsStore.getState().setReminderTime('21:00'); });
    await act(async () => { await Promise.resolve(); });

    expect(mockPostMessage).toHaveBeenLastCalledWith({
      type: 'SCHEDULE_REMINDER',
      enabled: false,
      time: '21:00',
    });
  });

  it('does nothing when serviceWorker is not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    renderHook(() => useReminderScheduler());
    await act(async () => { await Promise.resolve(); });
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- useReminderScheduler
```

Expected: 4 failures — module not found.

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/useReminderScheduler.ts
import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useReminderScheduler() {
  const reminderEnabled = useSettingsStore(s => s.reminderEnabled);
  const reminderTime = useSettingsStore(s => s.reminderTime);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then(reg => {
        reg.active?.postMessage({
          type: 'SCHEDULE_REMINDER',
          enabled: reminderEnabled,
          time: reminderTime,
        });
      })
      .catch(() => {});
  }, [reminderEnabled, reminderTime]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- useReminderScheduler
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useReminderScheduler.ts src/hooks/useReminderScheduler.test.ts
git commit -m "feat: add useReminderScheduler hook"
```

---

## Task 5: Settings UI — "Нагадування" section

**Files:**
- Modify: `src/pages/Settings/Settings.module.scss`
- Modify: `src/pages/Settings/index.tsx`

- [ ] **Step 1: Add Toggle and time input styles to `Settings.module.scss`**

Append to the end of the file:

```scss
// Toggle
.toggle {
  position: relative;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}

.toggleTrack {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: $color-border;
  transition: background 0.2s ease;
}

.toggleThumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.toggleOn .toggleTrack { background: $color-accent; }
.toggleOn .toggleThumb { transform: translateX(18px); }

// Time input
.timeInput {
  font-size: 15px;
  font-weight: 500;
  color: $color-text;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}
```

- [ ] **Step 2: Replace the full `src/pages/Settings/index.tsx`**

```tsx
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/Toast/useToast';
import { Toast } from '../../components/Toast/Toast';
import type { Theme } from '../../types';
import styles from './Settings.module.scss';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A87C" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7CB9A8" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12">
    <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B89D4" strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7CB9A8" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const themeOptions: { value: Theme; label: string; sub?: string; iconBg: string; Icon: () => React.JSX.Element }[] = [
  { value: 'light', label: 'Світла', iconBg: '#FAF7F0', Icon: SunIcon },
  { value: 'dark', label: 'Темна', iconBg: '#5c5c5f', Icon: MoonIcon },
  { value: 'system', label: 'Як у системі', sub: 'Автоматично', iconBg: 'linear-gradient(135deg, #FAF7F0 50%, #5c5c5f 50%)', Icon: MonitorIcon },
];

export default function SettingsPage() {
  const { theme, setTheme, reminderEnabled, reminderTime, setReminderEnabled, setReminderTime } = useSettingsStore();
  const { toast, show } = useToast();

  const handleReminderToggle = async () => {
    if (!reminderEnabled) {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        show({ message: 'Сповіщення не підтримуються у цьому браузері' });
        return;
      }
      if (Notification.permission === 'denied') {
        show({ message: 'Дозвольте сповіщення у налаштуваннях браузера' });
        return;
      }
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          show({ message: 'Дозвіл на сповіщення не надано' });
          return;
        }
      }
    }
    setReminderEnabled(!reminderEnabled);
  };

  return (
    <>
      <h1 className={styles.title}>Налаштування</h1>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Нагадування</div>

        <div className={styles.row} onClick={() => void handleReminderToggle()}>
          <div className={styles.icon} style={{ background: '#F0EBF8', border: '1.5px solid #E8E4DC' }}>
            <BellIcon />
          </div>
          <span className={styles.rowTitle}>Щоденне нагадування</span>
          <div className={`${styles.toggle} ${reminderEnabled ? styles.toggleOn : ''}`}>
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </div>
        </div>

        <div
          className={styles.row}
          style={{
            opacity: reminderEnabled ? 1 : 0.4,
            pointerEvents: reminderEnabled ? 'auto' : 'none',
            cursor: 'default',
          }}
        >
          <div className={styles.icon} style={{ background: '#EBF5F2', border: '1.5px solid #E8E4DC' }}>
            <ClockIcon />
          </div>
          <span className={styles.rowTitle}>Час нагадування</span>
          <input
            type="time"
            className={styles.timeInput}
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Зовнішній вигляд</div>
        {themeOptions.map(({ value, label, sub, iconBg, Icon }) => (
          <div key={value} className={styles.row} onClick={() => setTheme(value)}>
            <div className={styles.icon} style={{ background: iconBg, border: '1.5px solid #E8E4DC' }}>
              <Icon />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>{label}</div>
              {sub && <div className={styles.rowSub}>{sub}</div>}
            </div>
            <div
              className={styles.check}
              style={{ background: theme === value ? '#7CB9A8' : 'transparent', border: theme === value ? 'none' : '2px solid #E0DDD8' }}
            >
              {theme === value && <CheckIcon />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.row} style={{ cursor: 'default' }}>
          <span style={{ flex: 1, fontSize: 15, color: '#aaa' }}>Версія</span>
          <span className={styles.version}>1.0.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} />}
    </>
  );
}
```

- [ ] **Step 3: Run full test suite to confirm nothing broke**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings/index.tsx src/pages/Settings/Settings.module.scss
git commit -m "feat: add Нагадування section to Settings page"
```

---

## Task 6: Wire hook + final verification

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add `useReminderScheduler` to `App.tsx`**

```tsx
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { useSettingsStore } from '../store/settingsStore';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import styles from './App.module.scss';

export default function App() {
  const theme = useSettingsStore(s => s.theme);
  useReminderScheduler();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.matches
        ? root.setAttribute('data-theme', 'dark')
        : root.removeAttribute('data-theme');

      const handler = (e: MediaQueryListEvent) =>
        e.matches ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <div className={styles.app}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 3: Build to verify SW compiles**

```bash
npm run build
```

Expected: no errors. Check that `dist/sw.js` exists and contains `SCHEDULE_REMINDER`.

```bash
grep -c "SCHEDULE_REMINDER" dist/sw.js
```

Expected: `1` (or more).

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: mount useReminderScheduler in App"
```

---

## Manual Smoke Test (after all tasks)

1. `npm run preview` — opens the PWA with active service worker
2. Open Settings → "Нагадування" section is at the top
3. Toggle ON → browser asks for notification permission → grant it
4. Set time to 1-2 minutes from now
5. Wait → notification "Час відмічати звички! 🌿" appears
6. Toggle OFF → no further notifications
7. Toggle ON again, set a past time → notification fires ~24 hours later (verify by checking that timer is > 23h via devtools SW inspection)
