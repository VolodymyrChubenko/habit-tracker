# Splash Screen — Design Spec

**Date:** 2026-06-11
**Status:** Approved
**Component:** App startup splash animation

## Goal

Show a branded startup animation when the app cold-starts. The animation reproduces
the app logo being "completed" (a progress ring growing to 75% with a checkmark),
followed by the tagline **IMPROVE YOURSELF** revealing letter by letter. Total
duration ~3 seconds. Also switch the app's typeface to **Montserrat** everywhere.

## Visual specification

- **Background:** `#FAF7F0` (matches `$color-bg-raw`), full-screen.
- **Logo colors:** green `#7CB9A8` (`$color-accent`), orange `#E8A87C` (`$color-accent-warm`).
- **Tagline text:** `IMPROVE YOURSELF`, color `#333333`, Montserrat, `font-weight: 300`.
- **Chosen motion style:** Variant **C — "Bold sweep"**.

### Animation sequence (~3s total)

| Phase | Timing (approx) | What happens |
|-------|-----------------|--------------|
| 1. Logo intro + ring draw | 0.25s → 1.25s | Logo group animates from `rotate(-120deg) scale(.9)` → `rotate(0) scale(1)`. Ring draws on as **50% green / 50% orange** (split ring). |
| 2. Checkmark | 1.25s → 1.9s | Green checkmark draws on via stroke (dashoffset). |
| 3. Morph 50→75 | 1.9s → 2.45s | Green arc grows 50% → 75%, orange arc shrinks 50% → 25% (final logo state). |
| 4. Tagline reveal | 2.45s → ~3.3s | Letters of `IMPROVE YOURSELF` fade in from blur, staggered 45ms each. Letter-spacing eases `.04em` → `.10em`. |
| 5. Exit | after settle | Whole overlay fades out, then `onDone()` fires. |

### SVG geometry

- `viewBox="0 0 200 200"`, two `<circle cx="100" cy="100" r="74" pathLength="100" transform="rotate(-90 100 100)">`
  (one orange, one green) plus one checkmark `<path d="M64 104 L88 130 L140 74" pathLength="100">`.
- `stroke-width: 13`, `stroke-linecap: round`, `stroke-linejoin: round`, `fill: none`.
- Using `pathLength="100"` lets all dash math use simple percentages.

**Arc dash states (CSS classes drive transitions):**

| Element | initial | `.draw` | `.morph` |
|---------|---------|---------|----------|
| orange `stroke-dasharray` | `0 100` | `50 100` | `25 100` |
| green `stroke-dasharray` | `0 100` | `50 100` | `75 100` |
| green `stroke-dashoffset` | `0` | `-50` | `-25` |
| checkmark `stroke-dashoffset` | `100` (hidden) | — | — (drawn to `0` on `.check-on`) |

Transitions: arcs `0.9s ease`; checkmark `0.4s ease-out`; logo transform `0.9s cubic-bezier(.4,0,.2,1)`.

### Tagline reveal (Variant C)

- Each letter is a `<span>` with a `--i` index (0..15) for stagger.
- Initial: `opacity: 0; filter: blur(4px)`.
- On `.text`: `opacity: 1; filter: blur(0)` with `transition-delay: calc(var(--i) * 45ms)`.
- Word `letter-spacing`: `.04em` → `.10em` on `.text` (`transition: letter-spacing .6s ease`).
- Space between the two words is a non-breaking-space span (also indexed).

## Component design

New folder `src/components/SplashScreen/`:

- `SplashScreen.tsx` — renders the full-screen overlay (SVG logo + tagline). Owns a
  small phase state machine that adds CSS classes on a `setTimeout` chain:
  `draw` (250ms) → `check-on` (1250ms) → `morph` (1900ms) → `text` (2450ms) →
  `exit`/fade → calls `onDone`. Clears all timeouts on unmount.
  - Props: `{ onDone: () => void }`.
  - Tap handler on the overlay: on click/touch, cancel remaining timeouts, run the
    quick fade-out, then `onDone()` (skip).
  - `prefers-reduced-motion: reduce` (checked via `window.matchMedia`): skip the
    animation entirely and call `onDone()` immediately (next tick), so no abrupt motion.
- `SplashScreen.module.scss` — overlay (`position: fixed; inset: 0; z-index` above
  everything; background `#FAF7F0`; flex column centered), all the keyframe/transition
  classes above, tagline styles. Uses Montserrat.

## Integration

In `src/app/App.tsx`:

- Local state `showSplash`, initialized from `sessionStorage.getItem('splashShown')`
  being absent (i.e. show once per browser session).
- While `showSplash` is true, render `<SplashScreen onDone={...} />` as a sibling
  overlay above the existing `.app` content.
- `onDone`: `sessionStorage.setItem('splashShown', '1')` and `setShowSplash(false)`.
- Content underneath mounts normally (splash is an overlay, not a route gate), so the
  app is ready the instant the splash dismisses.

**Session semantics:** "once per session" = once per `sessionStorage` lifetime — shows
on a fresh tab / PWA launch / full reload, but not on in-app route navigation.

## Typography (app-wide)

In `src/styles/global.scss`:

- Add at top: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');`
- Change `html { font-family: ... }` from the current system stack to
  `'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`
- Everything inheriting `font: inherit` (buttons, inputs) picks this up automatically.

## Out of scope / YAGNI

- No setting to toggle the splash on/off.
- No "first launch only" variant (decided: once per session).
- No Lottie / external animation library — pure SVG + CSS.
- No skip button UI (tap-anywhere covers it).

## Testing

- Component renders overlay with SVG and 16 tagline letter spans.
- `onDone` is called after the full sequence (fake timers).
- Tap on overlay calls `onDone` early (skip).
- `prefers-reduced-motion` → `onDone` called immediately without running phases.
- App: splash shows when `sessionStorage.splashShown` absent; hidden and flag set after `onDone`; not shown when flag already present.
