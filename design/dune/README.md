# Палітра «Дюна»

Референс: Dune Shadow #240F22 · Desert Flame #AE1203 · Sand Light #FFDFB6 (`tracker/5.jpg`).
Змінюються лише кольори; розміри, шрифт і компоненти — як у `../default/`.
Кольори челенджів (ColorPicker PRESETS) — дані користувача, від палітри не залежать.

## Файли

- `_light_dune.scss` — селектор `[data-palette="dune"]`
- `_dark_dune.scss` — селектор `[data-palette="dune"][data-theme="dark"]`

Імена змінних ті самі, що в `src/styles/themes/_light.scss`, тож компоненти не змінюються.

## Токени

| Змінна | Світла | Темна |
|---|---|---|
| `--color-bg` | #FFF7EC | #240F22 |
| `--color-surface` | #FFFFFF | #341A31 |
| `--color-text` | #240F22 | #FFEFD9 |
| `--color-text-secondary` | #6A4A55 | #E3CBB9 |
| `--color-text-muted` | #785A64 | #C7AC9C |
| `--color-border` | #F0DFC6 | #4C2B47 |
| `--color-border-light` | #F7EBDA | #41233C |
| `--color-accent` | #AE1203 | #FF7A57 |
| `--color-accent-bg` | #FBE3D8 | #4C1E26 |
| `--color-accent-warm` | #D9963F | #FFDFB6 |
| `--color-accent-purple` | #6B3A63 | #E2A9D2 |
| `--color-accent-purple-bg` | #F3E6EE | #4C2B47 |
| `--color-on-accent` | #FFFFFF | #240F22 |
| `--color-danger` | #7E1230 | #FFB2A6 |
| `--color-on-danger` | #FFFFFF | #240F22 |
| `--color-sheet-row` | #FFF7EC | #2B1428 |
| `--color-sheet-title` | #240F22 | #FFEFD9 |
| `--color-sheet-subtitle` | #6A4A55 | #E3CBB9 |
| `--color-checkbox-border` | #E3CDB0 | #5E3A58 |
| `--color-sheet-handle` | #F0DFC6 | #5E3A58 |
| `--color-ring-track-past` | #EEDAC0 | #563351 |
| `--color-ring-track-future` | #F6E9D6 | #432640 |
| `--color-day-text-past` | #5A3D48 | #F0DCCB |
| `--color-day-text-future` | #8E737B | #A88E85 |
| `--color-icon-border` | #F0DFC6 | #4C2B47 |
| `--color-theme-preview-light` | #FFF7EC | #FFF7EC |
| `--color-theme-preview-dark` | #33192F | #341A31 |
| `--shadow-card` | 0 1px 4px rgba(0,0,0,0.06) | 0 1px 4px rgba(0,0,0,0.25) |
| `--shadow-nav` | 0 -1px 10px rgba(0,0,0,0.07) | 0 -1px 10px rgba(0,0,0,0.3) |

Також: `--color-overlay` rgba(0,0,0,.35); `--color-toast-bg/-text` = text/bg теми; `--color-splash-*` = фон/текст поточної теми (заставка в темній темі темна); медалі без змін.

`--color-toast-action` (кнопка дії в тості): світла #FF7A57, темна #AE1203.

## Контраст (WCAG, ≥ 4.5 для тексту)

| Пара | Світла | Темна |
|---|---|---|
| text на bg | 16.9 | 15.9 |
| text2 на surface | 7.7 | 10.1 |
| muted на surface | 6.1 | 7.3 |
| onAccent на accent | 7.3 | 7.0 |
| accent на surface | 7.3 | 6.1 |
| accent на accentBg | 5.9 | 5.4 |
| onDanger на danger | 10.4 | 10.4 |
| danger на surface | 10.4 | 9.1 |
| dayPast на surface | 9.6 | 11.8 |

## Переглянути

Канвас Claude Design → сторінка «Нові палітри», або `../default/screens/PaletteDune.dc.html`.
Кожен основний екран у `../default/screens/` має проп `palette`.
