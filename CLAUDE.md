# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 18 + TypeScript (strict) PWA challenge tracker. Stack: Vite, Zustand (with `persist`), React Router v6, date-fns, nanoid.

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc + vite build
npm run preview    # preview PWA (service worker active)
npm test           # watch mode tests
npm run test:run   # single test run
```

## Code review

When the user says «переглянути мій код», «переглянь мій код», «запустити рецензент» / «запусти рецензента», or runs `/code-reviewer`, spawn the project subagent `code-reviewer` (`.claude/agents/code-reviewer.md`) and show its Markdown report in full. It only reports — do not apply fixes unless the user asks separately.

## Architecture

### Data model

Two separate stores — `challenges` and `logs` — never merged into one object. This enables efficient date-range statistics and a clean backend migration path.

```typescript
Challenge   { id, name, color, createdAt, archivedAt? }
ChallengeLog { challengeId, date (ISO "yyyy-MM-dd"), completedAt (ISO timestamp) }
```

### State

- `challengesStore` — challenges + logs + CRUD (`addChallenge`, `completeChallenge`, `uncompleteChallenge`, `archiveChallenge`). Persisted to `localStorage` via `zustand/persist`.
- `settingsStore` — theme (`light | dark | system`). Persisted separately.

### Layout

`App.tsx` wraps all routes with `<Outlet /> + <BottomNav />`. BottomNav uses `useLocation()` to determine active tab.

### Key logic

- **Today split:** `activeChallenges = challenges where NOT completedToday`, `doneChallenges = challenges where completedToday`.
- **Statistics progress:** `completedCount / totalActiveChallenges` per date → drives `CircularProgress` SVG (stroke-dasharray/dashoffset).
- **Past-date editing:** click on calendar date → sheet with per-challenge checkboxes for that day.

### Backend migration

Only `store/*.ts` changes when moving to an API — all components, hooks, types, and utils remain untouched. `completeChallenge` becomes an async API call instead of a local `set()`.
