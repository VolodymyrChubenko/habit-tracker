# Habit Tracker PWA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA habit tracker with Today, Statistics, and Settings screens using the Soft & Warm design system.

**Architecture:** Today-first vertical slices — scaffold → stores/utils → shared components → Today (full workflow) → Statistics → Settings → PWA. Two Zustand stores (habitsStore + settingsStore) persisted to localStorage drive all UI via custom hooks.

**Tech Stack:** React 18, TypeScript strict, Vite 5, Zustand 4, React Router v6, SASS, Vitest, React Testing Library, vite-plugin-pwa, date-fns, nanoid

---

## File Map

```
src/
├── types/index.ts                          # All TS types
├── styles/
│   ├── _tokens.scss                        # SASS variables (palette, radii, shadows)
│   ├── _mixins.scss                        # Shared mixins
│   └── global.scss                         # Reset + body base
├── store/
│   ├── habitsStore.ts                      # habits[] + logs[] + CRUD
│   └── settingsStore.ts                    # theme
├── utils/
│   ├── dateUtils.ts                        # date-fns helpers
│   └── progressUtils.ts                    # SVG circle offset calc
├── hooks/
│   ├── useHabits.ts                        # Selectors: activeHabits, archivedHabits
│   ├── useTodayProgress.ts                 # { activeHabits, doneHabits } for today
│   └── useStatistics.ts                    # Map<DateString, number> progress 0..1
├── components/
│   ├── BottomNav/
│   │   ├── BottomNav.tsx
│   │   └── BottomNav.module.scss
│   ├── BottomSheet/
│   │   ├── BottomSheet.tsx
│   │   └── BottomSheet.module.scss
│   ├── Toast/
│   │   ├── Toast.tsx
│   │   ├── Toast.module.scss
│   │   └── useToast.ts
│   ├── CircularProgress/
│   │   └── CircularProgress.tsx            # Pure SVG, no SCSS needed
│   ├── ColorPicker/
│   │   ├── ColorPicker.tsx
│   │   └── ColorPicker.module.scss
│   └── HabitItem/
│       ├── HabitItem.tsx
│       └── HabitItem.module.scss
├── pages/
│   ├── Today/
│   │   ├── index.tsx
│   │   ├── Today.module.scss
│   │   ├── HabitList.tsx
│   │   ├── DoneList.tsx
│   │   └── AddHabitSheet.tsx
│   ├── Statistics/
│   │   ├── index.tsx
│   │   ├── Statistics.module.scss
│   │   ├── HabitSelector.tsx
│   │   ├── ProgressCalendar.tsx
│   │   └── DateEditSheet.tsx
│   └── Settings/
│       ├── index.tsx
│       └── Settings.module.scss
├── app/
│   ├── App.tsx
│   ├── App.module.scss
│   └── router.tsx
├── main.tsx
└── setupTests.ts
```

---

## Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `src/setupTests.ts`, `src/main.tsx`, `index.html`, `.gitignore`

- [ ] **Step 1: Init Vite project in current directory**

```bash
npm create vite@latest . -- --template react-ts
```
When prompted about existing files — answer **y** to overwrite.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install react-router-dom zustand date-fns nanoid
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D sass vite-plugin-pwa vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Replace `vite.config.ts` with test support**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
  },
});
```

- [ ] **Step 5: Create `src/setupTests.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Add test script to `package.json`**

In the `scripts` section add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Update `.gitignore`**

```
node_modules
dist
.superpowers
```

- [ ] **Step 8: Init git and first commit**

```bash
git init
git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html .gitignore src/main.tsx src/setupTests.ts
git commit -m "chore: scaffold Vite React TS project with Vitest"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write `src/types/index.ts`**

```ts
export type HabitId = string;
export type DateString = string; // "yyyy-MM-dd"

export interface Habit {
  id: HabitId;
  name: string;
  color: string; // hex "#7CB9A8"
  createdAt: DateString;
  archivedAt?: DateString;
}

export interface HabitLog {
  habitId: HabitId;
  date: DateString;
  completedAt: string; // ISO timestamp
}

export type Theme = 'light' | 'dark' | 'system';

export type ActiveTab = 'today' | 'statistics' | 'settings';
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript types"
```

---

## Task 3: SASS design tokens & global styles

**Files:**
- Create: `src/styles/_tokens.scss`, `src/styles/_mixins.scss`, `src/styles/global.scss`

- [ ] **Step 1: Create `src/styles/_tokens.scss`**

```scss
// Soft & Warm palette
$color-bg:             #FAF7F0;
$color-surface:        #FFFFFF;
$color-text:           #333333;
$color-text-secondary: #888888;
$color-text-muted:     #BBBBBB;
$color-border:         #F0EDE6;
$color-border-light:   #F5F2EC;
$color-accent:         #7CB9A8;
$color-accent-warm:    #E8A87C;
$color-accent-purple:  #9B89D4;
$color-dark-ui:        #5c5c5f;
$color-accent-bg:      #EBF5F2;

// Dark theme overrides (applied via [data-theme="dark"])
$color-bg-dark:        #1a1a1a;
$color-surface-dark:   #2a2a2a;
$color-text-dark:      #f0f0f0;
$color-border-dark:    #3a3a3a;

// Spacing / shape
$radius-card:   12px;
$radius-sheet:  20px;
$radius-pill:   14px;
$shadow-card:   0 1px 4px rgba(0, 0, 0, 0.06);
$shadow-nav:    0 -1px 10px rgba(0, 0, 0, 0.07);
```

- [ ] **Step 2: Create `src/styles/_mixins.scss`**

```scss
@use 'tokens' as *;

@mixin card {
  background: $color-surface;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

@mixin sheet-base {
  background: $color-surface;
  border-radius: $radius-sheet $radius-sheet 0 0;
  padding: 20px;
}
```

- [ ] **Step 3: Create `src/styles/global.scss`**

```scss
@use 'tokens' as *;

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background: $color-bg;
  color: $color-text;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-tap-highlight-color: transparent;
}

body {
  min-height: 100dvh;
  overflow-x: hidden;
}

button {
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
}

input {
  font: inherit;
}

[data-theme="dark"] {
  background: $color-bg-dark;
  color: $color-text-dark;
}
```

- [ ] **Step 4: Import global styles in `src/main.tsx`**

```tsx
import './styles/global.scss';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Commit**

```bash
git add src/styles src/main.tsx
git commit -m "feat: add SASS tokens, mixins, global styles"
```

---

## Task 4: habitsStore

**Files:**
- Create: `src/store/habitsStore.ts`, `src/store/habitsStore.test.ts`

- [ ] **Step 1: Write failing tests `src/store/habitsStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useHabitsStore } from './habitsStore';

beforeEach(() => {
  useHabitsStore.setState({ habits: [], logs: [] });
});

describe('addHabit', () => {
  it('adds a habit with id, name, color, createdAt', () => {
    useHabitsStore.getState().addHabit('Медитація', '#7CB9A8');
    const { habits } = useHabitsStore.getState();
    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Медитація');
    expect(habits[0].color).toBe('#7CB9A8');
    expect(habits[0].id).toBeTruthy();
    expect(habits[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('completeHabit', () => {
  it('adds a log entry for the given date', () => {
    useHabitsStore.getState().addHabit('Читання', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    const { logs } = useHabitsStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].habitId).toBe(habits[0].id);
    expect(logs[0].date).toBe('2026-06-04');
  });

  it('does not duplicate if already completed', () => {
    useHabitsStore.getState().addHabit('Спорт', '#9B89D4');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    expect(useHabitsStore.getState().logs).toHaveLength(1);
  });
});

describe('uncompleteHabit', () => {
  it('removes the log for the given habit and date', () => {
    useHabitsStore.getState().addHabit('Йога', '#7CB9A8');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    useHabitsStore.getState().uncompleteHabit(habits[0].id, '2026-06-04');
    expect(useHabitsStore.getState().logs).toHaveLength(0);
  });
});

describe('archiveHabit', () => {
  it('sets archivedAt on the habit', () => {
    useHabitsStore.getState().addHabit('Читання', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().archiveHabit(habits[0].id);
    const archived = useHabitsStore.getState().habits[0];
    expect(archived.archivedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('saveLogsForDate', () => {
  it('replaces all logs for a date with the given habitIds', () => {
    useHabitsStore.getState().addHabit('A', '#7CB9A8');
    useHabitsStore.getState().addHabit('B', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-01');
    useHabitsStore.getState().saveLogsForDate('2026-06-01', [habits[1].id]);
    const logs = useHabitsStore.getState().logs.filter(l => l.date === '2026-06-01');
    expect(logs).toHaveLength(1);
    expect(logs[0].habitId).toBe(habits[1].id);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run src/store/habitsStore.test.ts
```
Expected: FAIL — "Cannot find module './habitsStore'"

- [ ] **Step 3: Write `src/store/habitsStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Habit, HabitId, HabitLog, DateString } from '../types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (name: string, color: string) => void;
  completeHabit: (habitId: HabitId, date: DateString) => void;
  uncompleteHabit: (habitId: HabitId, date: DateString) => void;
  archiveHabit: (habitId: HabitId) => void;
  saveLogsForDate: (date: DateString, habitIds: HabitId[]) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (name, color) =>
        set(state => ({
          habits: [
            ...state.habits,
            { id: nanoid(), name, color, createdAt: format(new Date(), 'yyyy-MM-dd') },
          ],
        })),

      completeHabit: (habitId, date) => {
        const already = get().logs.some(l => l.habitId === habitId && l.date === date);
        if (already) return;
        set(state => ({
          logs: [...state.logs, { habitId, date, completedAt: new Date().toISOString() }],
        }));
      },

      uncompleteHabit: (habitId, date) =>
        set(state => ({
          logs: state.logs.filter(l => !(l.habitId === habitId && l.date === date)),
        })),

      archiveHabit: (habitId) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, archivedAt: format(new Date(), 'yyyy-MM-dd') } : h,
          ),
        })),

      saveLogsForDate: (date, habitIds) =>
        set(state => ({
          logs: [
            ...state.logs.filter(l => l.date !== date),
            ...habitIds.map(habitId => ({
              habitId,
              date,
              completedAt: new Date().toISOString(),
            })),
          ],
        })),
    }),
    { name: 'habit-tracker-storage' },
  ),
);
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run src/store/habitsStore.test.ts
```
Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/habitsStore.ts src/store/habitsStore.test.ts
git commit -m "feat: add habitsStore with CRUD and saveLogsForDate"
```

---

## Task 5: settingsStore

**Files:**
- Create: `src/store/settingsStore.ts`, `src/store/settingsStore.test.ts`

- [ ] **Step 1: Write failing test `src/store/settingsStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ theme: 'system' });
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:run src/store/settingsStore.test.ts
```

- [ ] **Step 3: Write `src/store/settingsStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
    }),
    { name: 'habit-tracker-settings' },
  ),
);
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm run test:run src/store/settingsStore.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/store/settingsStore.ts src/store/settingsStore.test.ts
git commit -m "feat: add settingsStore"
```

---

## Task 6: Utility functions

**Files:**
- Create: `src/utils/dateUtils.ts`, `src/utils/dateUtils.test.ts`, `src/utils/progressUtils.ts`, `src/utils/progressUtils.test.ts`

- [ ] **Step 1: Write `src/utils/dateUtils.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { toDateString, getDaysInMonth, getMonthStart, formatDisplayDate } from './dateUtils';

describe('toDateString', () => {
  it('formats date as yyyy-MM-dd', () => {
    expect(toDateString(new Date(2026, 5, 4))).toBe('2026-06-04');
  });
});

describe('getDaysInMonth', () => {
  it('returns 30 for June', () => {
    expect(getDaysInMonth(2026, 5)).toBe(30); // month is 0-indexed
  });
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
  });
});

describe('getMonthStart', () => {
  it('returns day-of-week index (Mon=0) of first day of month', () => {
    // June 2026 starts on Monday
    expect(getMonthStart(2026, 5)).toBe(0);
  });
});

describe('formatDisplayDate', () => {
  it('returns localized date like "Середа, 4 червня"', () => {
    const result = formatDisplayDate('2026-06-04');
    expect(result).toContain('4');
    expect(typeof result).toBe('string');
  });
});
```

- [ ] **Step 2: Write `src/utils/dateUtils.ts`**

```ts
import { format, getDaysInMonth as dfnsDays, parseISO, startOfMonth, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { DateString } from '../types';

export const toDateString = (date: Date): DateString =>
  format(date, 'yyyy-MM-dd');

export const getDaysInMonth = (year: number, month: number): number =>
  dfnsDays(new Date(year, month, 1));

/** Returns 0=Mon … 6=Sun offset for the first day of the month */
export const getMonthStart = (year: number, month: number): number => {
  const first = startOfMonth(new Date(year, month, 1));
  const dow = getDay(first); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
};

export const formatDisplayDate = (date: DateString): string =>
  format(parseISO(date), 'EEEE, d MMMM', { locale: uk });

export const today = (): DateString => toDateString(new Date());
```

- [ ] **Step 3: Write `src/utils/progressUtils.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcOffset, CIRCUMFERENCE } from './progressUtils';

describe('calcOffset', () => {
  it('returns 0 for full progress (all done)', () => {
    expect(calcOffset(1)).toBe(0);
  });

  it('returns full circumference for zero progress', () => {
    expect(calcOffset(0)).toBeCloseTo(CIRCUMFERENCE);
  });

  it('returns half circumference for 0.5 progress', () => {
    expect(calcOffset(0.5)).toBeCloseTo(CIRCUMFERENCE * 0.5);
  });
});
```

- [ ] **Step 4: Write `src/utils/progressUtils.ts`**

```ts
const RADIUS = 13;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~81.68

export const calcOffset = (progress: number): number =>
  CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));
```

- [ ] **Step 5: Run all utils tests**

```bash
npm run test:run src/utils/
```
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/
git commit -m "feat: add dateUtils and progressUtils with tests"
```

---

## Task 7: Custom hooks

**Files:**
- Create: `src/hooks/useHabits.ts`, `src/hooks/useTodayProgress.ts`, `src/hooks/useStatistics.ts`

- [ ] **Step 1: Write `src/hooks/useHabits.ts`**

```ts
import { useHabitsStore } from '../store/habitsStore';

export const useHabits = () => {
  const habits = useHabitsStore(s => s.habits);
  const activeHabits = habits.filter(h => !h.archivedAt);
  const archivedHabits = habits.filter(h => !!h.archivedAt);
  return { activeHabits, archivedHabits };
};
```

- [ ] **Step 2: Write `src/hooks/useTodayProgress.ts`**

```ts
import { useHabitsStore } from '../store/habitsStore';
import { useHabits } from './useHabits';
import { today } from '../utils/dateUtils';

export const useTodayProgress = () => {
  const { activeHabits } = useHabits();
  const logs = useHabitsStore(s => s.logs);
  const date = today();

  const completedIds = new Set(
    logs.filter(l => l.date === date).map(l => l.habitId),
  );

  const todoHabits = activeHabits.filter(h => !completedIds.has(h.id));
  const doneHabits = activeHabits.filter(h => completedIds.has(h.id));

  return { todoHabits, doneHabits, total: activeHabits.length };
};
```

- [ ] **Step 3: Write `src/hooks/useStatistics.ts`**

```ts
import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import type { DateString, HabitId } from '../types';

export const useStatistics = (filterIds?: HabitId[]) => {
  const habits = useHabitsStore(s => s.habits);
  const logs = useHabitsStore(s => s.logs);

  const progressByDate = useMemo(() => {
    const map = new Map<DateString, number>();
    const logsByDate = new Map<DateString, Set<HabitId>>();

    for (const log of logs) {
      if (filterIds && !filterIds.includes(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.habitId);
    }

    for (const [date, completedIds] of logsByDate) {
      const activeOnDate = habits.filter(h => {
        if (h.archivedAt && h.archivedAt < date) return false;
        if (h.createdAt > date) return false;
        return true;
      });
      const total = filterIds
        ? activeOnDate.filter(h => filterIds.includes(h.id)).length
        : activeOnDate.length;
      map.set(date, total === 0 ? 0 : completedIds.size / total);
    }

    return map;
  }, [habits, logs, filterIds]);

  return { progressByDate };
};
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useHabits, useTodayProgress, useStatistics hooks"
```

---

## Task 8: App shell

**Files:**
- Create: `src/app/router.tsx`, `src/app/App.tsx`, `src/app/App.module.scss`
- Modify: `src/main.tsx` (already imports router)

- [ ] **Step 1: Create placeholder pages (stubs for router)**

```tsx
// src/pages/Today/index.tsx
export default function TodayPage() {
  return <div>Today</div>;
}

// src/pages/Statistics/index.tsx
export default function StatisticsPage() {
  return <div>Statistics</div>;
}

// src/pages/Settings/index.tsx
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

- [ ] **Step 2: Write `src/app/router.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import TodayPage from '../pages/Today';
import StatisticsPage from '../pages/Statistics';
import SettingsPage from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

- [ ] **Step 3: Write `src/app/App.module.scss`**

```scss
@use '../styles/tokens' as *;

.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background: $color-bg;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 0;
}
```

- [ ] **Step 4: Write `src/app/App.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import styles from './App.module.scss';

export default function App() {
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

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/pages/
git commit -m "feat: app shell with router, layout, placeholder pages"
```

---

## Task 9: BottomNav component

**Files:**
- Create: `src/components/BottomNav/BottomNav.tsx`, `src/components/BottomNav/BottomNav.module.scss`, `src/components/BottomNav/BottomNav.test.tsx`

- [ ] **Step 1: Write failing test `BottomNav.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

const renderNav = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>,
  );

it('renders three nav items', () => {
  renderNav();
  expect(screen.getByText('Сьогодні')).toBeInTheDocument();
  expect(screen.getByText('Статистика')).toBeInTheDocument();
  expect(screen.getByText('Налаштування')).toBeInTheDocument();
});

it('marks Today as active on /', () => {
  renderNav('/');
  expect(screen.getByText('Сьогодні').closest('a')).toHaveClass('active');
});

it('marks Statistics as active on /statistics', () => {
  renderNav('/statistics');
  expect(screen.getByText('Статистика').closest('a')).toHaveClass('active');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:run src/components/BottomNav/BottomNav.test.tsx
```

- [ ] **Step 3: Write `BottomNav.module.scss`**

```scss
@use '../../styles/tokens' as *;

.nav {
  background: $color-surface;
  border-radius: 20px;
  margin: 0 12px 12px;
  padding: 6px 8px;
  display: flex;
  justify-content: space-around;
  box-shadow: $shadow-nav;
  flex-shrink: 0;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 12px;
  border-radius: $radius-pill;
  text-decoration: none;
  color: $color-text-muted;
  transition: background 0.15s;

  svg { stroke: $color-text-muted; }

  span {
    font-size: 10px;
    font-weight: 500;
  }

  &.active {
    background: $color-accent-bg;
    color: $color-accent;
    svg { stroke: $color-accent; }
    span { font-weight: 600; }
  }
}
```

- [ ] **Step 4: Write `BottomNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.scss';

const IconToday = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="3" rx="1.5" />
    <rect x="3" y="11" width="18" height="3" rx="1.5" />
    <rect x="3" y="17" width="18" height="3" rx="1.5" />
  </svg>
);

const IconStats = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="14" width="4" height="7" rx="1" />
    <rect x="10" y="9" width="4" height="12" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
  </svg>
);

const IconSettings = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const tabs = [
  { to: '/', label: 'Сьогодні', Icon: IconToday, end: true },
  { to: '/statistics', label: 'Статистика', Icon: IconStats, end: false },
  { to: '/settings', label: 'Налаштування', Icon: IconSettings, end: false },
];

export const BottomNav = () => (
  <nav className={styles.nav}>
    {tabs.map(({ to, label, Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.active : ''].join(' ')
        }
      >
        <Icon />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npm run test:run src/components/BottomNav/BottomNav.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/BottomNav/
git commit -m "feat: BottomNav with SVG icons, active pill, NavLink"
```

---

## Task 10: BottomSheet component

**Files:**
- Create: `src/components/BottomSheet/BottomSheet.tsx`, `src/components/BottomSheet/BottomSheet.module.scss`

- [ ] **Step 1: Write `BottomSheet.module.scss`**

```scss
@use '../../styles/tokens' as *;

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.15s ease;
}

.sheet {
  background: $color-surface;
  border-radius: $radius-sheet $radius-sheet 0 0;
  padding: 20px;
  width: 100%;
  max-height: 85dvh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
}

.handle {
  width: 36px;
  height: 4px;
  background: $color-border;
  border-radius: 4px;
  margin: 0 auto 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

- [ ] **Step 2: Write `BottomSheet.tsx`**

```tsx
import { useEffect } from 'react';
import styles from './BottomSheet.module.scss';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = ({ onClose, children }: Props) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomSheet/
git commit -m "feat: BottomSheet with backdrop, slide-up animation"
```

---

## Task 11: Toast + useToast

**Files:**
- Create: `src/components/Toast/Toast.tsx`, `src/components/Toast/Toast.module.scss`, `src/components/Toast/useToast.ts`

- [ ] **Step 1: Write `useToast.ts`**

```ts
import { useState, useCallback, useRef } from 'react';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((state: ToastState, durationMs = 4000) => {
    clearTimeout(timerRef.current);
    setToast(state);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, dismiss };
};
```

- [ ] **Step 2: Write `Toast.module.scss`**

```scss
@use '../../styles/tokens' as *;

.toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  z-index: 200;
  white-space: nowrap;
  animation: slideUp 0.2s ease;
}

.action {
  color: $color-accent;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [ ] **Step 3: Write `Toast.tsx`**

```tsx
import styles from './Toast.module.scss';

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast = ({ message, actionLabel, onAction }: Props) => (
  <div className={styles.toast}>
    <span>{message}</span>
    {actionLabel && (
      <button className={styles.action} onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast/
git commit -m "feat: Toast component and useToast hook"
```

---

## Task 12: CircularProgress & ColorPicker components

**Files:**
- Create: `src/components/CircularProgress/CircularProgress.tsx`, `src/components/ColorPicker/ColorPicker.tsx`, `src/components/ColorPicker/ColorPicker.module.scss`

- [ ] **Step 1: Write `CircularProgress.tsx`**

```tsx
import { CIRCUMFERENCE, calcOffset } from '../../utils/progressUtils';

interface Props {
  progress: number;  // 0..1
  size?: number;
  color?: string;
  day: number;
  isToday?: boolean;
  isFuture?: boolean;
}

const RADIUS = 13;

export const CircularProgress = ({
  progress,
  size = 34,
  color = '#7CB9A8',
  day,
  isToday = false,
  isFuture = false,
}: Props) => {
  const offset = calcOffset(progress);
  const textColor = isToday ? color : isFuture ? '#cccccc' : '#555555';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 34 34">
        {/* Track */}
        <circle cx="17" cy="17" r={RADIUS} fill="none" stroke="#F0EDE6" strokeWidth="2.5" />
        {/* Progress arc */}
        {progress > 0 && (
          <circle
            cx="17" cy="17" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 17 17)"
          />
        )}
      </svg>
      <span style={{ position: 'absolute', fontSize: 10, fontWeight: isToday ? 700 : 500, color: textColor }}>
        {day}
      </span>
    </div>
  );
};
```

- [ ] **Step 2: Write `ColorPicker.module.scss`**

```scss
@use '../../styles/tokens' as *;

.wrap {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: border-color 0.1s;

  &.selected {
    border-color: $color-text;
  }
}

.custom {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px dashed $color-border;
  cursor: pointer;
  overflow: hidden;
  position: relative;

  input[type='color'] {
    position: absolute;
    inset: -4px;
    opacity: 0;
    cursor: pointer;
    width: 140%;
    height: 140%;
  }
}
```

- [ ] **Step 3: Write `ColorPicker.tsx`**

```tsx
import styles from './ColorPicker.module.scss';

const PRESETS = ['#7CB9A8', '#E8A87C', '#9B89D4', '#F06B7E', '#5BA4CF'];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: Props) => (
  <div className={styles.wrap}>
    {PRESETS.map(color => (
      <button
        key={color}
        type="button"
        className={[styles.swatch, value === color ? styles.selected : ''].join(' ')}
        style={{ background: color }}
        onClick={() => onChange(color)}
      />
    ))}
    <div className={styles.custom} style={{ background: PRESETS.includes(value) ? 'transparent' : value }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CircularProgress/ src/components/ColorPicker/
git commit -m "feat: CircularProgress SVG and ColorPicker components"
```

---

## Task 13: HabitItem component

**Files:**
- Create: `src/components/HabitItem/HabitItem.tsx`, `src/components/HabitItem/HabitItem.module.scss`, `src/components/HabitItem/HabitItem.test.tsx`

- [ ] **Step 1: Write failing test `HabitItem.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitItem } from './HabitItem';

const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01' };

it('renders habit name', () => {
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onArchive={vi.fn()} />);
  expect(screen.getByText('Медитація')).toBeInTheDocument();
});

it('calls onToggle when circle button clicked', async () => {
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onArchive={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).toHaveBeenCalledOnce();
});

it('shows checkmark and strikethrough when done', () => {
  render(<HabitItem habit={habit} done={true} onToggle={vi.fn()} onArchive={vi.fn()} />);
  expect(screen.getByText('Медитація')).toHaveStyle({ textDecoration: 'line-through' });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:run src/components/HabitItem/HabitItem.test.tsx
```

- [ ] **Step 3: Write `HabitItem.module.scss`**

```scss
@use '../../styles/mixins' as *;
@use '../../styles/tokens' as *;

.card {
  @include card;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;

  &.done { opacity: 0.65; }
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.name {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: $color-text;

  .done & { text-decoration: line-through; color: $color-text-secondary; }
}

.circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
```

- [ ] **Step 4: Write `HabitItem.tsx`**

```tsx
import type { Habit } from '../../types';
import styles from './HabitItem.module.scss';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onArchive: () => void;
}

export const HabitItem = ({ habit, done, onToggle, onArchive }: Props) => {
  let pressTimer: ReturnType<typeof setTimeout>;

  const handlePressStart = () => {
    pressTimer = setTimeout(onArchive, 600);
  };
  const handlePressEnd = () => clearTimeout(pressTimer);

  return (
    <div
      className={[styles.card, done ? styles.done : ''].join(' ')}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div className={styles.dot} style={{ background: habit.color }} />
      <span className={styles.name}>{habit.name}</span>
      <button
        className={styles.circle}
        aria-label={done ? 'скасувати виконання' : 'виконати'}
        style={{
          borderColor: habit.color,
          background: done ? habit.color : 'transparent',
        }}
        onClick={onToggle}
      >
        {done ? '✓' : ''}
      </button>
    </div>
  );
};
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:run src/components/HabitItem/HabitItem.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/HabitItem/
git commit -m "feat: HabitItem with long-press archive and toggle"
```

---

## Task 14: Today page — HabitList, DoneList, index

**Files:**
- Modify: `src/pages/Today/index.tsx`
- Create: `src/pages/Today/Today.module.scss`, `src/pages/Today/HabitList.tsx`, `src/pages/Today/DoneList.tsx`

- [ ] **Step 1: Write `Today.module.scss`**

```scss
@use '../../styles/tokens' as *;

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.titles { display: flex; flex-direction: column; gap: 2px; }

.title { font-size: 24px; font-weight: 600; color: $color-text; }

.subtitle { font-size: 13px; color: $color-text-secondary; }

.addBtn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: $color-accent;
  color: #fff;
  font-size: 22px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(124, 185, 168, 0.35);
  cursor: pointer;
  border: none;
}

.progressWrap { margin-bottom: 18px; }

.progressMeta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: $color-text-secondary;
  margin-bottom: 5px;
}

.progressTrack {
  height: 4px;
  background: $color-border;
  border-radius: 4px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: $color-accent;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.list { display: flex; flex-direction: column; gap: 8px; }
```

- [ ] **Step 2: Write `HabitList.tsx`**

```tsx
import { useHabitsStore } from '../../store/habitsStore';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';

interface Props {
  habits: Habit[];
  onArchive: (id: string, name: string) => void;
}

export const HabitList = ({ habits, onArchive }: Props) => {
  const { completeHabit } = useHabitsStore();
  const date = today();

  return (
    <>
      {habits.map(habit => (
        <HabitItem
          key={habit.id}
          habit={habit}
          done={false}
          onToggle={() => completeHabit(habit.id, date)}
          onArchive={() => onArchive(habit.id, habit.name)}
        />
      ))}
    </>
  );
};
```

- [ ] **Step 3: Write `DoneList.tsx`**

```tsx
import { useState } from 'react';
import { useHabitsStore } from '../../store/habitsStore';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';
import styles from './Today.module.scss';

interface Props {
  habits: Habit[];
}

export const DoneList = ({ habits }: Props) => {
  const [open, setOpen] = useState(true);
  const { uncompleteHabit } = useHabitsStore();
  const date = today();

  if (habits.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#7CB9A8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
          {habits.length}
        </span>
        <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>Виконано</span>
        <span style={{ marginLeft: 'auto', color: '#bbb', fontSize: 11 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className={styles.list}>
          {habits.map(habit => (
            <HabitItem
              key={habit.id}
              habit={habit}
              done={true}
              onToggle={() => uncompleteHabit(habit.id, date)}
              onArchive={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Write `src/pages/Today/index.tsx`**

```tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTodayProgress } from '../../hooks/useTodayProgress';
import { useHabitsStore } from '../../store/habitsStore';
import { HabitList } from './HabitList';
import { DoneList } from './DoneList';
import { AddHabitSheet } from './AddHabitSheet';
import { Toast } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import styles from './Today.module.scss';

export default function TodayPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { todoHabits, doneHabits, total } = useTodayProgress();
  const { archiveHabit, addHabit } = useHabitsStore();
  const { toast, show: showToast, dismiss } = useToast();

  const handleArchive = (id: string, name: string) => {
    archiveHabit(id);
    showToast({
      message: `«${name}» архівовано`,
      actionLabel: 'Відмінити',
      onAction: () => {
        useHabitsStore.setState(s => ({
          habits: s.habits.map(h => h.id === id ? { ...h, archivedAt: undefined } : h),
        }));
        dismiss();
      },
    });
  };

  const completed = doneHabits.length;
  const progressPct = total === 0 ? 0 : (completed / total) * 100;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.titles}>
          <h1 className={styles.title}>Сьогодні</h1>
          <p className={styles.subtitle}>
            {format(new Date(), 'EEEE, d MMMM', { locale: uk })}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)} aria-label="Додати звичку">
          +
        </button>
      </div>

      {total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Прогрес</span>
            <span>{completed} / {total}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className={styles.list}>
        <HabitList habits={todoHabits} onArchive={handleArchive} />
      </div>

      <DoneList habits={doneHabits} />

      {showAdd && (
        <AddHabitSheet
          onClose={() => setShowAdd(false)}
          onAdd={(name, color) => { addHabit(name, color); setShowAdd(false); }}
        />
      )}

      {toast && (
        <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={toast.onAction} />
      )}
    </>
  );
}
```

- [ ] **Step 5: Run dev server and verify Today page renders**

```bash
npm run dev
```
Open http://localhost:5173. Should see "Сьогодні" header and BottomNav.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Today/
git commit -m "feat: Today page with HabitList, DoneList, progress bar, archive toast"
```

---

## Task 15: AddHabitSheet

**Files:**
- Create: `src/pages/Today/AddHabitSheet.tsx`, `src/pages/Today/AddHabitSheet.module.scss`

- [ ] **Step 1: Write `AddHabitSheet.module.scss`**

```scss
@use '../../styles/tokens' as *;

.title { font-size: 17px; font-weight: 600; color: $color-text; margin-bottom: 18px; }

.field { margin-bottom: 14px; }

.label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  background: $color-bg;
  border: 1.5px solid $color-border;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 15px;
  color: $color-text;
  outline: none;

  &:focus { border-color: $color-accent; }
}

.btn {
  width: 100%;
  background: $color-accent;
  color: #fff;
  border-radius: $radius-card;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 20px;
  cursor: pointer;
  border: none;

  &:disabled { opacity: 0.5; cursor: default; }
}
```

- [ ] **Step 2: Write `AddHabitSheet.tsx`**

```tsx
import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import styles from './AddHabitSheet.module.scss';

interface Props {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}

export const AddHabitSheet = ({ onClose, onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7CB9A8');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
  };

  return (
    <BottomSheet onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className={styles.title}>Нова звичка</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="habit-name">Назва</label>
          <input
            id="habit-name"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Наприклад: Медитація"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Колір</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <button type="submit" className={styles.btn} disabled={!name.trim()}>
          Додати звичку
        </button>
      </form>
    </BottomSheet>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Today/AddHabitSheet.tsx src/pages/Today/AddHabitSheet.module.scss
git commit -m "feat: AddHabitSheet with name input and ColorPicker"
```

---

## Task 16: Statistics page

**Files:**
- Modify: `src/pages/Statistics/index.tsx`
- Create: `src/pages/Statistics/Statistics.module.scss`, `src/pages/Statistics/ProgressCalendar.tsx`, `src/pages/Statistics/HabitSelector.tsx`, `src/pages/Statistics/DateEditSheet.tsx`

- [ ] **Step 1: Write `Statistics.module.scss`**

```scss
@use '../../styles/tokens' as *;

.title { font-size: 24px; font-weight: 600; color: $color-text; margin-bottom: 16px; }

.monthNav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.monthLabel { font-size: 15px; font-weight: 600; color: $color-text; }

.navBtn {
  font-size: 18px;
  color: $color-text-secondary;
  padding: 4px 10px;
  cursor: pointer;
  background: none;
  border: none;
}

.calendar {
  background: $color-surface;
  border-radius: 16px;
  padding: 12px;
  box-shadow: $shadow-card;
}

.dayHeaders {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;

  span {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: $color-text-secondary;
    padding: 2px 0;
  }
}

.daysGrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

.dayCell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  border-radius: 8px;

  &.today { background: rgba(124, 185, 168, 0.12); }
  &.future { cursor: default; }
}
```

- [ ] **Step 2: Write `HabitSelector.tsx`**

```tsx
import { useHabits } from '../../hooks/useHabits';
import type { HabitId } from '../../types';

interface Props {
  selected: HabitId[] | null; // null = all
  onChange: (ids: HabitId[] | null) => void;
}

export const HabitSelector = ({ selected, onChange }: Props) => {
  const { activeHabits } = useHabits();

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, overflowX: 'auto' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          borderRadius: 20, padding: '5px 13px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
          background: selected === null ? '#7CB9A8' : '#fff',
          color: selected === null ? '#fff' : '#555',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        Всі
      </button>
      {activeHabits.map(h => {
        const isActive = selected?.includes(h.id);
        return (
          <button
            key={h.id}
            onClick={() => {
              if (isActive) {
                const next = selected!.filter(id => id !== h.id);
                onChange(next.length === 0 ? null : next);
              } else {
                onChange([...(selected ?? []), h.id]);
              }
            }}
            style={{
              borderRadius: 20, padding: '5px 13px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #E8E4DC',
              background: isActive ? '#EBF5F2' : '#fff', color: '#555',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            {h.name}
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 3: Write `ProgressCalendar.tsx`**

```tsx
import { CircularProgress } from '../../components/CircularProgress/CircularProgress';
import { getDaysInMonth, getMonthStart, toDateString, today } from '../../utils/dateUtils';
import type { DateString } from '../../types';
import styles from './Statistics.module.scss';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

interface Props {
  year: number;
  month: number; // 0-indexed
  progressByDate: Map<DateString, number>;
  onDayClick: (date: DateString) => void;
}

export const ProgressCalendar = ({ year, month, progressByDate, onDayClick }: Props) => {
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getMonthStart(year, month);
  const todayStr = today();

  const cells = Array.from({ length: startOffset }, (_, i) => ({ key: `e${i}`, empty: true }))
    .concat(
      Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = toDateString(new Date(year, month, day));
        return { key: dateStr, empty: false, day, dateStr };
      }),
    );

  return (
    <div className={styles.calendar}>
      <div className={styles.dayHeaders}>
        {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className={styles.daysGrid}>
        {cells.map(cell =>
          cell.empty ? (
            <div key={cell.key} style={{ aspectRatio: 1 }} />
          ) : (
            <div
              key={cell.key}
              className={[
                styles.dayCell,
                cell.dateStr === todayStr ? styles.today : '',
                cell.dateStr! > todayStr ? styles.future : '',
              ].join(' ')}
              onClick={() => cell.dateStr! <= todayStr && onDayClick(cell.dateStr!)}
            >
              <CircularProgress
                day={cell.day!}
                progress={progressByDate.get(cell.dateStr!) ?? 0}
                isToday={cell.dateStr === todayStr}
                isFuture={cell.dateStr! > todayStr}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Write `DateEditSheet.tsx`**

```tsx
import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { useHabits } from '../../hooks/useHabits';
import { useHabitsStore } from '../../store/habitsStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { DateString, HabitId } from '../../types';

interface Props {
  date: DateString;
  onClose: () => void;
}

export const DateEditSheet = ({ date, onClose }: Props) => {
  const { activeHabits } = useHabits();
  const logs = useHabitsStore(s => s.logs);
  const { saveLogsForDate } = useHabitsStore();

  const initial = new Set<HabitId>(
    logs.filter(l => l.date === date).map(l => l.habitId),
  );
  const [checked, setChecked] = useState<Set<HabitId>>(initial);

  const toggle = (id: HabitId) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    saveLogsForDate(date, [...checked]);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 4 }}>
        {formatDisplayDate(date)}
      </div>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 18 }}>
        Відмітити виконані звички
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeHabits.map(h => (
          <div
            key={h.id}
            onClick={() => toggle(h.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FAF7F0', borderRadius: 10, cursor: 'pointer' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: '#333' }}>{h.name}</span>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: checked.has(h.id) ? h.color : '#fff',
              border: checked.has(h.id) ? 'none' : '2px solid #E0DDD8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13,
            }}>
              {checked.has(h.id) ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{ width: '100%', background: '#7CB9A8', color: '#fff', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, marginTop: 18, border: 'none', cursor: 'pointer' }}
      >
        Зберегти
      </button>
    </BottomSheet>
  );
};
```

- [ ] **Step 5: Write `src/pages/Statistics/index.tsx`**

```tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useStatistics } from '../../hooks/useStatistics';
import { HabitSelector } from './HabitSelector';
import { ProgressCalendar } from './ProgressCalendar';
import { DateEditSheet } from './DateEditSheet';
import type { DateString, HabitId } from '../../types';
import styles from './Statistics.module.scss';

export default function StatisticsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterIds, setFilterIds] = useState<HabitId[] | null>(null);
  const [editDate, setEditDate] = useState<DateString | null>(null);

  const { progressByDate } = useStatistics(filterIds ?? undefined);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <h1 className={styles.title}>Статистика</h1>

      <HabitSelector selected={filterIds} onChange={setFilterIds} />

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>
          {format(new Date(year, month, 1), 'LLLL yyyy', { locale: uk })}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      <ProgressCalendar
        year={year}
        month={month}
        progressByDate={progressByDate}
        onDayClick={setEditDate}
      />

      {editDate && (
        <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Statistics/
git commit -m "feat: Statistics page with calendar, habit filter, past-date editing"
```

---

## Task 17: Settings page

**Files:**
- Modify: `src/pages/Settings/index.tsx`
- Create: `src/pages/Settings/Settings.module.scss`

- [ ] **Step 1: Write `Settings.module.scss`**

```scss
@use '../../styles/tokens' as *;

.title { font-size: 24px; font-weight: 600; color: $color-text; margin-bottom: 24px; }

.section {
  background: $color-surface;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: $shadow-card;
  margin-bottom: 16px;
}

.sectionLabel {
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid $color-border-light;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid $color-border-light;

  &:last-child { border-bottom: none; }
}

.icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rowTitle { flex: 1; font-size: 15px; color: $color-text; font-weight: 500; }

.rowSub { font-size: 12px; color: $color-text-secondary; margin-top: 1px; }

.check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.version { font-size: 15px; color: $color-text-muted; }
```

- [ ] **Step 2: Write `src/pages/Settings/index.tsx`**

```tsx
import { useSettingsStore } from '../../store/settingsStore';
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

const themeOptions: { value: Theme; label: string; sub?: string; iconBg: string; Icon: () => JSX.Element }[] = [
  { value: 'light', label: 'Світла', iconBg: '#FAF7F0', Icon: SunIcon },
  { value: 'dark', label: 'Темна', iconBg: '#5c5c5f', Icon: MoonIcon },
  { value: 'system', label: 'Як у системі', sub: 'Автоматично', iconBg: 'linear-gradient(135deg, #FAF7F0 50%, #5c5c5f 50%)', Icon: MonitorIcon },
];

export default function SettingsPage() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <>
      <h1 className={styles.title}>Налаштування</h1>

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
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings/
git commit -m "feat: Settings page with theme selector"
```

---

## Task 18: Dark theme wiring

**Files:**
- Modify: `src/app/App.tsx`, `src/styles/global.scss`

- [ ] **Step 1: Apply `data-theme` attribute based on settingsStore in `App.tsx`**

```tsx
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { useSettingsStore } from '../store/settingsStore';
import styles from './App.module.scss';

export default function App() {
  const theme = useSettingsStore(s => s.theme);

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

- [ ] **Step 2: Add dark theme CSS variables to `global.scss`**

```scss
[data-theme="dark"] {
  --bg: #{$color-bg-dark};
  --surface: #{$color-surface-dark};
  --text: #{$color-text-dark};
  --border: #{$color-border-dark};

  background: $color-bg-dark;
  color: $color-text-dark;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/App.tsx src/styles/global.scss
git commit -m "feat: dark theme wiring via data-theme attribute"
```

---

## Task 19: PWA configuration

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder, replace with real icons)

- [ ] **Step 1: Add placeholder icons**

```bash
# Create minimal placeholder PNGs (replace with real icons before release)
# Download any 192x192 and 512x512 PNG and save to public/
```

Place any PNG file as `public/icon-192.png` and `public/icon-512.png`.

- [ ] **Step 2: Update `vite.config.ts` with PWA plugin**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
  },
});
```

- [ ] **Step 3: Verify PWA build**

```bash
npm run build && npm run preview
```
Open http://localhost:4173. DevTools → Application → Service Workers should show registered SW.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts public/
git commit -m "feat: PWA manifest and service worker via vite-plugin-pwa"
```

---

## Task 20: Final check & CLAUDE.md update

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```
Expected: all tests PASS

- [ ] **Step 2: Build production bundle**

```bash
npm run build
```
Expected: no TypeScript errors, bundle created in `dist/`

- [ ] **Step 3: Update CLAUDE.md with final commands**

Add to the Commands section in `CLAUDE.md`:
```
npm run dev        # dev server
npm run build      # tsc + vite build
npm run preview    # preview PWA (service worker active)
npm test           # watch mode tests
npm run test:run   # single test run
```

- [ ] **Step 4: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with test commands"
```
