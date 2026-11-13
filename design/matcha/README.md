# Палітра «Матча»

Референс: Dark Roast #261815 · Matcha Leaf #B3CC10 · Cocoa Soil #774023 (`tracker/1.jpg`).
Змінюються лише кольори; розміри, шрифт і компоненти — як у `../default/`.
Кольори челенджів (ColorPicker PRESETS) — дані користувача, від палітри не залежать.

## Файли

- `_light_matcha.scss` — селектор `[data-palette="matcha"]`
- `_dark_matcha.scss` — селектор `[data-palette="matcha"][data-theme="dark"]`

Імена змінних ті самі, що в `src/styles/themes/_light.scss`, тож компоненти не змінюються.

## Токени

| Змінна | Світла | Темна |
|---|---|---|
| `--color-bg` | #F5F3EA | #261815 |
| `--color-surface` | #FFFFFF | #362622 |
| `--color-text` | #261815 | #F4F0E6 |
| `--color-text-secondary` | #6E5A50 | #C9BDB2 |
| `--color-text-muted` | #7A6A62 | #AE9E93 |
| `--color-border` | #E7E2D4 | #4A3832 |
| `--color-border-light` | #EFEBE0 | #3F2F2A |
| `--color-accent` | #5E6C08 | #B3CC10 |
| `--color-accent-bg` | #EEF3CC | #3A3A16 |
| `--color-accent-warm` | #774023 | #C97B4E |
| `--color-accent-purple` | #8A5233 | #D08C63 |
| `--color-accent-purple-bg` | #F3E8E0 | #4A3026 |
| `--color-on-accent` | #FFFFFF | #261815 |
| `--color-danger` | #B3261E | #FF7B6E |
| `--color-on-danger` | #FFFFFF | #261815 |
| `--color-sheet-row` | #F5F3EA | #2C1E1A |
| `--color-sheet-title` | #261815 | #F4F0E6 |
| `--color-sheet-subtitle` | #6E5A50 | #C9BDB2 |
| `--color-checkbox-border` | #D6CFC2 | #5E4A42 |
| `--color-sheet-handle` | #E7E2D4 | #5E4A42 |
| `--color-ring-track-past` | #E3DDCF | #523F38 |
| `--color-ring-track-future` | #EEEADF | #42322C |
| `--color-day-text-past` | #5A4A42 | #DDD2C8 |
| `--color-day-text-future` | #8C7E76 | #A08F84 |
| `--color-icon-border` | #E7E2D4 | #4A3832 |
| `--color-theme-preview-light` | #F5F3EA | #F5F3EA |
| `--color-theme-preview-dark` | #362622 | #362622 |
| `--shadow-card` | 0 1px 4px rgba(0,0,0,0.06) | 0 1px 4px rgba(0,0,0,0.25) |
| `--shadow-nav` | 0 -1px 10px rgba(0,0,0,0.07) | 0 -1px 10px rgba(0,0,0,0.3) |

Також: `--color-overlay` rgba(0,0,0,.35); `--color-toast-bg/-text` = text/bg теми; `--color-splash-*` = фон/текст поточної теми (заставка в темній темі темна); медалі без змін.

`--color-toast-action` (кнопка дії в тості): світла #B3CC10, темна #5E6C08.

## Контраст (WCAG, ≥ 4.5 для тексту)

| Пара | Світла | Темна |
|---|---|---|
| text на bg | 15.4 | 15.1 |
| text2 на surface | 6.5 | 7.8 |
| muted на surface | 5.2 | 5.6 |
| onAccent на accent | 5.8 | 9.4 |
| accent на surface | 5.8 | 7.9 |
| accent на accentBg | 5.1 | 6.4 |
| onDanger на danger | 6.5 | 6.8 |
| danger на surface | 6.5 | 5.7 |
| dayPast на surface | 8.4 | 9.7 |

## Переглянути

Канвас Claude Design → сторінка «Нові палітри», або `../default/screens/PaletteMatcha.dc.html`.
Кожен основний екран у `../default/screens/` має проп `palette`.
