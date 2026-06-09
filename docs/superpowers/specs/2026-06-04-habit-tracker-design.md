# Habit Tracker PWA — Design Spec

**Date:** 2026-06-04  
**Stack:** React 18 + TypeScript (strict) + Vite + Zustand + React Router v6 + SASS  
**Approach:** Today-first — Today повністю → Statistics → Settings → PWA

---

## Visual Style

**Palette — Soft & Warm:**

```scss
$color-bg:             #FAF7F0;
$color-surface:        #FFFFFF;
$color-text:           #333333;
$color-text-secondary: #888888;
$color-border:         #F0EDE6;
$color-border-light:   #F5F2EC;
$color-accent:         #7CB9A8;  // teal — primary
$color-accent-warm:    #E8A87C;  // warm orange
$color-accent-purple:  #9B89D4;
$color-dark-ui:        #5c5c5f;  // dark theme icon bg, gradients
$color-accent-bg:      #EBF5F2;  // pill background for active nav tab

$radius-card:  12px;
$radius-sheet: 20px;
$shadow-card:  0 1px 4px rgba(0, 0, 0, 0.06);
$shadow-nav:   0 -1px 10px rgba(0, 0, 0, 0.07);
```

**CSS structure:** `_tokens.scss` → `_mixins.scss` → `global.scss` + `*.module.scss` per component.  
**Dark theme:** `data-theme="dark"` on `<html>`, separate set of `$` overrides.

---

## BottomNav

Three tabs: **Сьогодні / Статистика / Налаштування**.

- Icons: SVG, 30×30px, `stroke="#BBBBBB"` when inactive, `stroke="$color-accent"` when active
- Labels: `font-size: 10px`, grey when inactive, `$color-accent` + `font-weight: 600` when active
- Layout: icon above label (vertical), always — both inactive and active
- Active tab: pill background `$color-accent-bg`, `border-radius: 14px`, padding `8px 14px`
- Active state determined via `useLocation()`

**Icons (SVG stroke, no fill):**
- Сьогодні: three stacked rounded rectangles (list icon)
- Статистика: three bars (bar chart)
- Налаштування: gear (circle + path)

---

## Today Screen (`/`)

### Layout
- Header: title "Сьогодні" (24px, 700) + date subtitle (13px) + `+` button (38px circle, `$color-accent`)
- Progress bar: `completedCount / totalActiveHabits`, 4px height, `$color-accent` fill
- Active habit list (`HabitList`)
- Done accordion (`DoneList`)
- BottomNav

### HabitItem
- White card, `$radius-card`, `$shadow-card`, padding 15px
- Left: 12px color dot
- Center: habit name (16px, 500)
- Right: 28px circle button — empty border when incomplete, filled `✓` when complete
- Tap circle → `completeHabit(id, today)` → item moves to DoneList

### DoneList
- Accordion header: count badge (teal circle) + "Виконано" label + chevron
- Expanded: completed items at 65% opacity, name with `text-decoration: line-through`
- Tap done item → `uncompleteHabit(id, today)` → moves back to active list

### Archive
- Long press or left swipe on active habit card → "Архівувати" action
- Immediate execution + undo toast (4s): "Звичку архівовано · Відмінити"
- No confirmation dialog

### AddHabitSheet
- Triggered by `+` header button
- Bottom sheet, `border-radius: 20px 20px 0 0`, drag handle (36×4px)
- Fields: name (text input) + color picker
- ColorPicker: 5 preset swatches + `input[type=color]` for custom
- Button: "Додати звичку" (full-width, `$color-accent` bg)
- Close: drag down or backdrop tap

---

## Statistics Screen (`/statistics`)

### Layout
- Header: "Статистика" (24px, 700)
- Habit filter chips (scrollable row): "Всі" pill (filled teal) + per-habit chips with color dot
- Month navigation: `‹ Червень 2026 ›`
- Calendar grid
- BottomNav

### ProgressCalendar
- 7-column CSS grid, Mon–Sun headers (11px, `$color-text-secondary`)
- Each cell: `aspect-ratio: 1`, centered SVG circle (34×34px)
- **Empty day** (no habits done): thin `$color-border` ring
- **Partial day** (`0 < progress < 1`): `stroke-dasharray / stroke-dashoffset` arc, `$color-accent`
- **Full day** (all done): full solid `$color-accent` ring
- **Today**: subtle `rgba($color-accent, 0.12)` background, teal number
- **Future days**: same empty ring, number in `#ccc`

Progress formula:
```ts
const progress = completedOnDate / totalActiveHabitsOnDate; // 0..1
const offset = circumference * (1 - progress);             // stroke-dashoffset
```

No legend block.

### Past-date editing
- Tap any past/today cell → bottom sheet
- Sheet header: weekday + date string
- List: all habits as checkbox rows (color dot + name + square checkbox)
- Button: "Зберегти" — batch-writes/removes logs for that date
- Checkbox state initialised from existing logs

---

## Settings Screen (`/settings`)

Single section "Зовнішній вигляд":
- **Світла** — sun icon on `$color-bg` background
- **Темна** — moon icon on `$color-dark-ui` (`#5c5c5f`) background
- **Як у системі** — monitor icon on gradient (`$color-bg 50% / $color-dark-ui 50%`) — default selected
- Selection indicator: filled teal circle with checkmark

Secondary row: версія `1.0.0` (read-only).

---

## Build Order (Today-first)

1. `types/index.ts` + `store/habitsStore.ts` + `store/settingsStore.ts`
2. `styles/_tokens.scss` + `styles/global.scss`
3. `app/router.tsx` + `App.tsx` (Outlet + BottomNav)
4. `components/BottomNav.tsx`
5. `pages/Today/` — HabitList → DoneList → AddHabitSheet → archive/undo toast
6. `pages/Statistics/` — ProgressCalendar → HabitSelector → past-date sheet
7. `pages/Settings/` — theme switcher
8. `vite.config.ts` — PWA manifest + Workbox
