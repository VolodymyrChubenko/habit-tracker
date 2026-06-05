# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 18 + TypeScript (strict) PWA habit tracker. Stack: Vite, Zustand (with `persist`), React Router v6, date-fns, nanoid.

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc + vite build
npm run preview    # preview PWA (service worker active)
npm test           # watch mode tests
npm run test:run   # single test run
```

## Architecture

### Data model

Two separate stores — `habits` and `logs` — never merged into one object. This enables efficient date-range statistics and a clean backend migration path.

```typescript
Habit   { id, name, color, createdAt, archivedAt? }
HabitLog { habitId, date (ISO "yyyy-MM-dd"), completedAt (ISO timestamp) }
```

### State

- `habitsStore` — habits + logs + CRUD (`addHabit`, `completeHabit`, `uncompleteHabit`, `archiveHabit`). Persisted to `localStorage` via `zustand/persist`.
- `settingsStore` — theme (`light | dark | system`). Persisted separately.

### Layout

`App.tsx` wraps all routes with `<Outlet /> + <BottomNav />`. BottomNav uses `useLocation()` to determine active tab.

### Key logic

- **Today split:** `activeHabits = habits where NOT completedToday`, `doneHabits = habits where completedToday`.
- **Statistics progress:** `completedCount / totalActiveHabits` per date → drives `CircularProgress` SVG (stroke-dasharray/dashoffset).
- **Past-date editing:** click on calendar date → sheet with per-habit checkboxes for that day.

### Backend migration

Only `store/*.ts` changes when moving to an API — all components, hooks, types, and utils remain untouched. `completeHabit` becomes an async API call instead of a local `set()`.
