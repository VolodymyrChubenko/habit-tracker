# Habit Tile Complete Animation — Design Spec

**Date:** 2026-06-11
**Status:** Approved
**Component:** Today page — habit tile mark-as-done animation

## Goal

When a habit is marked complete on the Today page, play a satisfying animation on its
tile before it moves into the "Виконано" (Done) section. Currently the toggle is
instant: `completeHabit` writes a log, `useTodayProgress` recomputes, and the tile
snaps from the active list into the done list with no transition.

**Chosen motion style:** Variant **4 — "Color sweep + collapse"**.

## Visual specification

### Complete (todo → done)

| Phase | Timing (approx) | What happens |
|-------|-----------------|--------------|
| 1. Circle fill + check | 0 → 0.3s | Circle button fills with `habit.color`; white checkmark draws on via stroke (dashoffset 100 → 0). |
| 2. Color sweep | 0 → 0.4s | A `habit.color` overlay (≈18% opacity) sweeps across the tile from the circle side: `transform: scaleX(0) → scaleX(1)`, `transform-origin: right`. |
| 3. Collapse | 0.5s → 0.85s | Tile fades and shrinks slightly: `opacity 1 → 0`, `transform: scale(1) → scale(.94)`. |
| 4. Store update | ~0.55s | `onToggle()` fires → `completeHabit` writes the log → tile unmounts from active list and mounts in the Done section. |

- The tile entering the Done section gets a gentle **fade-in on mount** (mount-time CSS
  animation on the done card), so it appears smoothly instead of snapping in.

### Uncomplete (done → todo)

- Simple **fade** (short `opacity` fade-out, ~0.25s), then `onToggle()` → `uncompleteHabit`
  writes removal → tile moves back to the active list. No sweep/collapse.

### Reduced motion

- `prefers-reduced-motion: reduce` (checked via `window.matchMedia`): skip all animation
  and timers; call `onToggle()` immediately (current instant behavior).

## Component design

All logic lives in **`src/components/HabitItem/HabitItem.tsx`** + its
`HabitItem.module.scss`. Stores are NOT touched — the delay lives in the UI layer,
consistent with the CLAUDE.md backend-migration principle (components/hooks/stores
stay decoupled).

- Local state `completing: boolean` (and direction is derived from the existing `done`
  prop): `!done` → run sweep + collapse; `done` → run fade.
- Circle click handler:
  1. If reduced motion → call `onToggle()` immediately, return.
  2. Else set `completing = true` (adds the CSS phase class), then `setTimeout` ~550ms
     (complete) / ~250ms (uncomplete) → call `onToggle()`.
  3. Guard against double-trigger while `completing` is true.
  4. Clear the timeout on unmount.
- Markup additions:
  - A `<span class="sweep">` overlay element inside the card (absolutely positioned,
    `background: habit.color`, low opacity, `transform-origin: right`).
  - The existing circle button keeps `habit.color`; checkmark becomes an inline SVG
    `<path d="M5 13l4 4L19 7" pathLength="100">` with white stroke and dashoffset draw
    (replacing the current `✓` text glyph) so it can animate on.
- `HabitItem.module.scss`:
  - `.sweep` default `transform: scaleX(0)`; on `.completing` (complete direction)
    `scaleX(1)` with `transition: transform .4s ease`.
  - `.completing` collapse keyframe (`opacity`/`scale`) with `.5s` delay.
  - Fade-out keyframe for the uncomplete direction.
  - `@keyframes` fade-in used by done-section cards on mount.
  - Respect `@media (prefers-reduced-motion: reduce)` to disable animations as a CSS
    backstop (in addition to the JS guard).

### Why HabitItem owns it (not the lists)

`HabitItem` already receives `done` and `onToggle`, and is rendered in both `HabitList`
(active) and `DoneList`. Keeping the animation + delayed `onToggle` inside the tile means
neither list, the hook, nor the store changes. The store update is simply deferred by the
tile until its exit animation finishes.

## Color

The sweep and circle fill use the per-habit `habit.color` (already passed as a prop and
used for the dot/circle), so each tile animates in its own color.

## Out of scope / YAGNI

- No confetti/particles (that was Variant 3, not chosen).
- No cross-container FLIP "fly to done" motion — the collapse + fade-in reads as the move.
- No setting to toggle the animation.
- No animation on drag-reorder (unchanged).

## Testing

- Completing a todo tile: `onToggle` is NOT called synchronously on click; it fires after
  the delay (fake timers). `completing` class is applied during the window.
- Uncompleting a done tile: fade path, `onToggle` after the shorter delay.
- Double-click during animation does not call `onToggle` twice.
- `prefers-reduced-motion` → `onToggle` called immediately, no timers.
- Checkmark SVG renders for done state; circle uses `habit.color`.
- Existing HabitItem tests still pass (update for the SVG checkmark replacing the `✓` glyph
  and the deferred `onToggle` timing).
