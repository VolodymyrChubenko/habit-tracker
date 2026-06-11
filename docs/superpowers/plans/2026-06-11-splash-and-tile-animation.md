# Splash Screen + Habit Tile Complete Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ~3s branded startup splash animation (logo ring growing to 75% + "IMPROVE YOURSELF" reveal), switch the app to the Montserrat typeface, and add a "color sweep + collapse" animation when a habit is marked done on the Today page.

**Architecture:** Two new self-contained pieces of UI. `SplashScreen` is a fixed full-screen overlay rendered by `App` once per browser session (`sessionStorage` flag), driven by a `setTimeout` phase machine that toggles cumulative CSS classes; it calls `onDone` to unmount. The habit-complete animation lives entirely inside `HabitItem` — it defers the existing `onToggle` callback until its CSS exit animation finishes, so no store, hook, or list code changes (consistent with the CLAUDE.md backend-migration principle). Both respect `prefers-reduced-motion`.

**Tech Stack:** React 19 + TypeScript (strict), SCSS modules, Vitest + Testing Library + jsdom, inline SVG (no animation library).

**Specs:**
- `docs/superpowers/specs/2026-06-11-splash-screen-design.md`
- `docs/superpowers/specs/2026-06-11-habit-complete-animation-design.md`

---

## File Structure

- **Create** `src/components/SplashScreen/SplashScreen.tsx` — overlay component, phase machine, tap-to-skip, reduced-motion short-circuit.
- **Create** `src/components/SplashScreen/SplashScreen.module.scss` — overlay + SVG ring/checkmark/tagline animation (Variant C).
- **Create** `src/components/SplashScreen/SplashScreen.test.tsx` — behavioral tests (sequence, skip, reduced motion, render).
- **Modify** `src/app/App.tsx` — render `SplashScreen` once per session.
- **Modify** `src/styles/global.scss` — Montserrat `@import` + `html` font-family.
- **Modify** `src/components/HabitItem/HabitItem.tsx` — deferred `onToggle`, sweep element, SVG checkmark, reduced-motion.
- **Modify** `src/components/HabitItem/HabitItem.module.scss` — sweep, completing/fading, done fade-in, SVG check.
- **Modify** `src/components/HabitItem/HabitItem.test.tsx` — deferred-timing + reduced-motion tests.
- **Modify** `src/setupTests.ts` — global `window.matchMedia` mock (jsdom lacks it).

---

## Task 1: Test infrastructure — mock `matchMedia`

jsdom does not implement `window.matchMedia`. Both `SplashScreen` and `HabitItem` (and the existing `App` theme effect) call it, so tests need a default mock that reports `matches: false`.

**Files:**
- Modify: `src/setupTests.ts`

- [ ] **Step 1: Add the matchMedia mock**

Replace the entire contents of `src/setupTests.ts` with:

```ts
import '@testing-library/jest-dom';

// jsdom does not implement matchMedia — provide a default (matches: false) mock.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 2: Run the existing suite to confirm nothing broke**

Run: `npm run test:run`
Expected: PASS (same tests as before, matchMedia mock is additive).

- [ ] **Step 3: Commit**

```bash
git add src/setupTests.ts
git commit -m "test: mock window.matchMedia in jsdom setup"
```

---

## Task 2: Montserrat typeface app-wide

**Files:**
- Modify: `src/styles/global.scss:1-37`

- [ ] **Step 1: Add the font import and switch the font-family**

In `src/styles/global.scss`, the file currently starts with `@use 'tokens' as *;`. Add the CSS `@import` immediately after the `@use` line (Sass requires `@use` to come first), and change the `html` font stack.

Change the top of the file from:

```scss
@use 'tokens' as *;

// CSS custom properties — define light defaults, override for dark theme
```

to:

```scss
@use 'tokens' as *;
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');

// CSS custom properties — define light defaults, override for dark theme
```

Then change the `html` rule's font-family from:

```scss
html {
  background: $color-bg;
  color: $color-text;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
```

to:

```scss
html {
  background: $color-bg;
  color: $color-text;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: PASS (tsc + vite build complete, no SCSS errors).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.scss
git commit -m "feat: use Montserrat typeface app-wide"
```

---

## Task 3: SplashScreen component (logic, TDD)

The component renders a fixed overlay with an SVG logo and the tagline, runs a phase machine, supports tap-to-skip, and short-circuits on reduced motion. Timeline from mount (ms): `draw` 50 → `checkOn` 1250 → `morph` 1900 → `text` 2450 → `exit` 3300 → `onDone` 3700. Tap → `exit` then `onDone` after 250ms.

**Files:**
- Create: `src/components/SplashScreen/SplashScreen.tsx`
- Test: `src/components/SplashScreen/SplashScreen.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/SplashScreen/SplashScreen.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SplashScreen } from './SplashScreen';

afterEach(() => {
  vi.useRealTimers();
});

it('renders the tagline', () => {
  render(<SplashScreen onDone={vi.fn()} />);
  expect(screen.getByLabelText('IMPROVE YOURSELF')).toBeInTheDocument();
});

it('calls onDone after the full sequence', () => {
  vi.useFakeTimers();
  const onDone = vi.fn();
  render(<SplashScreen onDone={onDone} />);
  expect(onDone).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(3700); });
  expect(onDone).toHaveBeenCalledOnce();
});

it('skips to onDone on tap', () => {
  vi.useFakeTimers();
  const onDone = vi.fn();
  const { container } = render(<SplashScreen onDone={onDone} />);
  fireEvent.click(container.firstChild as Element);
  act(() => { vi.advanceTimersByTime(300); });
  expect(onDone).toHaveBeenCalledOnce();
});

it('calls onDone immediately when reduced motion is preferred', () => {
  const mql = {
    matches: true, media: '', onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  } as unknown as MediaQueryList;
  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  const onDone = vi.fn();
  render(<SplashScreen onDone={onDone} />);
  expect(onDone).toHaveBeenCalledOnce();
  spy.mockRestore();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- SplashScreen`
Expected: FAIL with "Cannot find module './SplashScreen'".

- [ ] **Step 3: Implement the component**

Create `src/components/SplashScreen/SplashScreen.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SplashScreen.module.scss';

interface Props {
  onDone: () => void;
}

const LETTERS = 'IMPROVE YOURSELF'.split('');

export function SplashScreen({ onDone }: Props) {
  const [phases, setPhases] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const add = (cls: string, at: number) =>
      timers.current.push(window.setTimeout(() => setPhases(p => [...p, cls]), at));

    add('draw', 50);
    add('checkOn', 1250);
    add('morph', 1900);
    add('text', 2450);
    add('exit', 3300);
    timers.current.push(window.setTimeout(finish, 3700));

    const ids = timers.current;
    return () => ids.forEach(clearTimeout);
  }, [finish]);

  const skip = () => {
    if (finished.current) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhases(p => (p.includes('exit') ? p : [...p, 'exit']));
    timers.current.push(window.setTimeout(finish, 250));
  };

  const className = [styles.splash, ...phases.map(p => styles[p])].join(' ');

  return (
    <div className={className} onClick={skip} role="presentation">
      <svg className={styles.logo} viewBox="0 0 200 200" aria-hidden="true">
        <circle
          className={`${styles.ring} ${styles.orange}`}
          cx="100" cy="100" r="74" pathLength="100"
          transform="rotate(-90 100 100)"
        />
        <circle
          className={`${styles.ring} ${styles.green}`}
          cx="100" cy="100" r="74" pathLength="100"
          transform="rotate(-90 100 100)"
        />
        <path className={styles.check} d="M64 104 L88 130 L140 74" pathLength="100" />
      </svg>
      <div className={styles.word} aria-label="IMPROVE YOURSELF">
        {LETTERS.map((ch, i) => (
          <span key={i} style={{ '--i': i } as React.CSSProperties}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- SplashScreen`
Expected: PASS (4 tests). Note: the styles import resolves to an empty object in tests (CSS modules), so `styles[p]` is `undefined` and class names are sparse — that is fine; tests assert behavior, not classes.

- [ ] **Step 5: Commit**

```bash
git add src/components/SplashScreen/SplashScreen.tsx src/components/SplashScreen/SplashScreen.test.tsx
git commit -m "feat: add SplashScreen component with phase machine"
```

---

## Task 4: SplashScreen styles (Variant C)

**Files:**
- Create: `src/components/SplashScreen/SplashScreen.module.scss`

- [ ] **Step 1: Write the stylesheet**

Create `src/components/SplashScreen/SplashScreen.module.scss`:

```scss
@use '../../styles/tokens' as *;

.splash {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #FAF7F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.exit { opacity: 0; }

/* logo intro */
.logo {
  width: 130px;
  height: 130px;
  transform: rotate(-120deg) scale(0.9);
  transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1);
}
.draw .logo { transform: rotate(0deg) scale(1); }

/* ring arcs */
.ring { fill: none; stroke-width: 13; stroke-linecap: round; }
.orange {
  stroke: $color-accent-warm;
  stroke-dasharray: 0 100;
  transition: stroke-dasharray 0.9s ease;
}
.green {
  stroke: $color-accent;
  stroke-dasharray: 0 100;
  stroke-dashoffset: 0;
  transition: stroke-dasharray 0.9s ease, stroke-dashoffset 0.9s ease;
}
.draw .orange { stroke-dasharray: 50 100; }
.draw .green  { stroke-dasharray: 50 100; stroke-dashoffset: -50; }
.morph .orange { stroke-dasharray: 25 100; }
.morph .green  { stroke-dasharray: 75 100; stroke-dashoffset: -25; }

/* checkmark */
.check {
  fill: none;
  stroke: $color-accent;
  stroke-width: 13;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 0.4s ease-out;
}
.checkOn .check { stroke-dashoffset: 0; }

/* tagline */
.word {
  display: flex;
  margin-top: 28px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: #333333;
  letter-spacing: 0.04em;
  transition: letter-spacing 0.6s ease;
}
.text .word { letter-spacing: 0.10em; }

.word span {
  opacity: 0;
  filter: blur(4px);
  transition: opacity 0.3s ease, filter 0.3s ease;
}
.text .word span {
  opacity: 1;
  filter: blur(0);
  transition-delay: calc(var(--i) * 45ms);
}

@media (prefers-reduced-motion: reduce) {
  .splash, .logo, .orange, .green, .check, .word, .word span {
    transition: none !important;
  }
}
```

(Note: phase classes like `.text`, `.draw`, `.checkOn`, `.morph` are applied to the `.splash` root, so descendant selectors `.text .word`, `.draw .logo`, `.checkOn .check`, `.morph .orange` resolve correctly within this CSS module.)

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: PASS (no SCSS errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/SplashScreen/SplashScreen.module.scss
git commit -m "feat: add SplashScreen Variant C styles"
```

---

## Task 5: Render SplashScreen once per session in App

**Files:**
- Modify: `src/app/App.tsx:1-39`

- [ ] **Step 1: Wire the splash into App**

Edit `src/app/App.tsx`. Update the imports at the top:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { SplashScreen } from '../components/SplashScreen/SplashScreen';
import { useSettingsStore } from '../store/settingsStore';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import styles from './App.module.scss';
```

Inside the `App` function, add splash state directly under `useReminderScheduler();`:

```tsx
  const [showSplash, setShowSplash] = useState(
    () => typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('splashShown'),
  );

  const handleSplashDone = useCallback(() => {
    try { sessionStorage.setItem('splashShown', '1'); } catch { /* ignore */ }
    setShowSplash(false);
  }, []);
```

Update the returned JSX to render the splash as the last child of the app container:

```tsx
  return (
    <div className={styles.app}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
    </div>
  );
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Run the full test suite**

Run: `npm run test:run`
Expected: PASS (all existing + SplashScreen tests).

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: show splash screen once per session"
```

---

## Task 6: HabitItem complete animation (logic, TDD)

`HabitItem` defers its `onToggle` so the exit animation can play. Direction comes from the existing `done` prop: completing (`!done`) waits `COMPLETE_MS` (700ms, covers sweep 0–0.35s + collapse 0.35–0.65s); uncompleting (`done`) waits `UNCOMPLETE_MS` (300ms, covers a 0.25s fade). Reduced motion calls `onToggle` immediately. A guard prevents double-trigger.

**Files:**
- Modify: `src/components/HabitItem/HabitItem.tsx:1-34`
- Test: `src/components/HabitItem/HabitItem.test.tsx`

- [ ] **Step 1: Update the tests**

Replace the entire contents of `src/components/HabitItem/HabitItem.test.tsx` with:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitItem } from './HabitItem';

const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 };

afterEach(() => {
  vi.useRealTimers();
});

it('renders habit name', () => {
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toBeInTheDocument();
});

it('defers onToggle until the complete animation finishes', () => {
  vi.useFakeTimers();
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(750); });
  expect(onToggle).toHaveBeenCalledOnce();
});

it('does not call onToggle twice on a double click', () => {
  vi.useFakeTimers();
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  const btn = screen.getByRole('button', { name: /виконати/i });
  fireEvent.click(btn);
  fireEvent.click(btn);
  act(() => { vi.advanceTimersByTime(750); });
  expect(onToggle).toHaveBeenCalledOnce();
});

it('calls onToggle immediately when reduced motion is preferred', () => {
  const mql = {
    matches: true, media: '', onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  } as unknown as MediaQueryList;
  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).toHaveBeenCalledOnce();
  spy.mockRestore();
});

it('does not call onEdit when circle button clicked', () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onEdit).not.toHaveBeenCalled();
});

it('calls onEdit when card is clicked', async () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  await userEvent.click(screen.getByText('Медитація'));
  expect(onEdit).toHaveBeenCalledOnce();
});

it('shows strikethrough when done', () => {
  render(<HabitItem habit={habit} done={true} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toHaveStyle({ textDecoration: 'line-through' });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- HabitItem`
Expected: FAIL — `defers onToggle...` fails because the current component calls `onToggle` synchronously (it is called before advancing timers).

- [ ] **Step 3: Implement the deferred-toggle component**

Replace the entire contents of `src/components/HabitItem/HabitItem.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Habit } from '../../types';
import styles from './HabitItem.module.scss';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

const COMPLETE_MS = 700;
const UNCOMPLETE_MS = 300;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HabitItem = ({ habit, done, onToggle, onEdit }: Props) => {
  const [animating, setAnimating] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (animating) return;
    if (prefersReducedMotion()) {
      onToggle();
      return;
    }
    setAnimating(true);
    timer.current = window.setTimeout(onToggle, done ? UNCOMPLETE_MS : COMPLETE_MS);
  };

  const className = [
    styles.card,
    done ? styles.done : '',
    animating ? (done ? styles.fading : styles.completing) : '',
  ].join(' ');

  return (
    <div className={className} onClick={onEdit}>
      {!done && <span className={styles.sweep} style={{ background: habit.color }} />}
      <div className={styles.dot} style={{ background: habit.color }} />
      <span
        className={styles.name}
        style={done ? { textDecoration: 'line-through' } : undefined}
      >
        {habit.name}
      </span>
      <button
        className={styles.circle}
        aria-label={done ? 'скасувати виконання' : 'виконати'}
        style={{ borderColor: habit.color, background: done ? habit.color : 'transparent' }}
        onClick={handleToggle}
      >
        <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4L19 7" pathLength="100" />
        </svg>
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- HabitItem`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/HabitItem/HabitItem.tsx src/components/HabitItem/HabitItem.test.tsx
git commit -m "feat: defer habit toggle for complete animation"
```

---

## Task 7: HabitItem complete animation (styles)

**Files:**
- Modify: `src/components/HabitItem/HabitItem.module.scss` (replace entire file)

- [ ] **Step 1: Write the stylesheet**

Replace the entire contents of `src/components/HabitItem/HabitItem.module.scss` with:

```scss
@use '../../styles/mixins' as *;
@use '../../styles/tokens' as *;

.card {
  @include card;
  position: relative;
  overflow: hidden;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;

  &.done {
    opacity: 0.65;
    animation: fadeIn 0.3s ease;
  }
}

/* color sweep overlay (complete direction only) */
.sweep {
  position: absolute;
  inset: 0;
  border-radius: $radius-card;
  opacity: 0.18;
  transform: scaleX(0);
  transform-origin: right;
  pointer-events: none;
}
.completing .sweep {
  transform: scaleX(1);
  transition: transform 0.35s ease;
}

/* exit animations */
.completing { animation: collapse 0.3s ease 0.35s forwards; }
.fading { animation: fadeOut 0.25s ease forwards; }

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

  .done & { color: $color-text-secondary; }
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
  cursor: pointer;
  transition: background 0.25s ease;
}

.check {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #fff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 0.3s ease 0.05s;
}
.done .check,
.completing .check { stroke-dashoffset: 0; }

@keyframes collapse { to { opacity: 0; transform: scale(0.94); } }
@keyframes fadeOut { to { opacity: 0; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 0.65; } }

@media (prefers-reduced-motion: reduce) {
  .completing, .fading, .card.done { animation: none; }
  .sweep, .check { transition: none; }
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/HabitItem/HabitItem.module.scss
git commit -m "feat: color sweep + collapse styles for habit tile"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the complete test suite**

Run: `npm run test:run`
Expected: PASS (all suites, including updated HabitItem and new SplashScreen).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: PASS (tsc strict + vite build).

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, open the app in a fresh browser tab (or after clearing `sessionStorage`), and verify:
- Splash plays: logo ring draws 50/50 → checkmark draws → grows to 75/25 → "IMPROVE YOURSELF" reveals letter-by-letter → fades to the app (~3s). Font is Montserrat.
- Tapping the splash skips it immediately.
- Reload the same tab → splash does NOT replay (sessionStorage). Open a new tab → it plays again.
- On Today, tapping a habit's circle: circle fills + checkmark draws, the habit color sweeps across the tile, it collapses/fades, then appears in "Виконано".
- Un-checking an item in "Виконано" fades it out and returns it to the active list.
- With OS "reduce motion" enabled, both splash and tile toggles are instant (no animation).

- [ ] **Step 4: Final commit (if any manual fixes were needed)**

```bash
git add -A
git commit -m "chore: splash + tile animation verification fixes"
```

(Skip if Step 3 surfaced no changes.)

---

## Self-Review notes

- **Spec coverage (splash):** background `#FAF7F0` (Task 4 `.splash`), Variant C choreography + timings (Tasks 3–4), tagline Montserrat 400 / `#333` / `.04em→.10em` (Task 4 `.word`), `pathLength=100` SVG geometry (Tasks 3–4), once-per-session via `sessionStorage` (Task 5), tap-to-skip (Task 3), reduced motion (Tasks 3–4), Montserrat app-wide (Task 2). ✓
- **Spec coverage (tile):** circle fill + SVG checkmark draw, color sweep, collapse, deferred store update (Tasks 6–7), done-section fade-in on mount (Task 7 `fadeIn`), uncomplete fade (Tasks 6–7), reduced motion (Tasks 6–7), logic in `HabitItem` only — no store/hook/list changes. ✓
- **App integration test:** intentionally verified via build + manual smoke test (Task 8) rather than a unit test — rendering `App` in isolation requires a Router context and a `navigator.serviceWorker` mock (`useReminderScheduler`), which is disproportionate for a thin `sessionStorage` gate. The risky logic (phase machine, deferred toggle, reduced motion) is unit-tested in Tasks 3 and 6.
- **Type consistency:** `COMPLETE_MS`/`UNCOMPLETE_MS` (Task 6) align with CSS timings (Task 7: sweep 0.35s + collapse 0.35+0.3s ≈ 0.65s < 0.70s; fade 0.25s < 0.30s). `onDone`/`onToggle` prop names match existing callers (`App`, `HabitList`, `DoneList`). Phase class names (`draw`, `checkOn`, `morph`, `text`, `exit`) match between Task 3 (TS) and Task 4 (SCSS).
```
