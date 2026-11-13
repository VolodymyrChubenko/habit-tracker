# Палітра «Іній»

Референс: Frost Glass #D3DCDB · Deep Ice #4D6474 · Cold Mist #A3B4BC (`tracker/4.jpg`).
Змінюються лише кольори; розміри, шрифт і компоненти — як у `../default/`.
Кольори челенджів (ColorPicker PRESETS) — дані користувача, від палітри не залежать.

## Файли

- `_light_frost.scss` — селектор `[data-palette="frost"]`
- `_dark_frost.scss` — селектор `[data-palette="frost"][data-theme="dark"]`

Імена змінних ті самі, що в `src/styles/themes/_light.scss`, тож компоненти не змінюються.

## Токени

| Змінна | Світла | Темна |
|---|---|---|
| `--color-bg` | #EEF2F2 | #151B1F |
| `--color-surface` | #FFFFFF | #212A30 |
| `--color-text` | #1F2A31 | #ECF1F2 |
| `--color-text-secondary` | #4D6474 | #B7C4CA |
| `--color-text-muted` | #586D7A | #9BAAB2 |
| `--color-border` | #D3DCDB | #35424B |
| `--color-border-light` | #E2E8E8 | #2C3840 |
| `--color-accent` | #4D6474 | #A3B4BC |
| `--color-accent-bg` | #E1E8EC | #2E3C45 |
| `--color-accent-warm` | #7F98A6 | #D3DCDB |
| `--color-accent-purple` | #4D6474 | #A3B4BC |
| `--color-accent-purple-bg` | #E1E8EC | #2E3C45 |
| `--color-on-accent` | #FFFFFF | #151B1F |
| `--color-danger` | #B3261E | #FF8E84 |
| `--color-on-danger` | #FFFFFF | #151B1F |
| `--color-sheet-row` | #EEF2F2 | #1A2226 |
| `--color-sheet-title` | #1F2A31 | #ECF1F2 |
| `--color-sheet-subtitle` | #4D6474 | #B7C4CA |
| `--color-checkbox-border` | #C3CDCF | #46545D |
| `--color-sheet-handle` | #D3DCDB | #46545D |
| `--color-ring-track-past` | #CCD6D6 | #3C4A53 |
| `--color-ring-track-future` | #DFE6E6 | #2E3940 |
| `--color-day-text-past` | #3F525F | #C8D3D8 |
| `--color-day-text-future` | #71848F | #83939B |
| `--color-icon-border` | #D3DCDB | #35424B |
| `--color-theme-preview-light` | #EEF2F2 | #EEF2F2 |
| `--color-theme-preview-dark` | #212A30 | #212A30 |
| `--shadow-card` | 0 1px 4px rgba(0,0,0,0.06) | 0 1px 4px rgba(0,0,0,0.25) |
| `--shadow-nav` | 0 -1px 10px rgba(0,0,0,0.07) | 0 -1px 10px rgba(0,0,0,0.3) |

Також: `--color-overlay` rgba(0,0,0,.35); `--color-toast-bg/-text` = text/bg теми; `--color-splash-*` = фон/текст поточної теми (заставка в темній темі темна); медалі без змін.

`--color-toast-action` (кнопка дії в тості): світла #A3B4BC, темна #4D6474.

## Контраст (WCAG, ≥ 4.5 для тексту)

| Пара | Світла | Темна |
|---|---|---|
| text на bg | 13.0 | 15.3 |
| text2 на surface | 6.2 | 8.2 |
| muted на surface | 5.4 | 6.1 |
| onAccent на accent | 6.2 | 8.1 |
| accent на surface | 6.2 | 6.8 |
| accent на accentBg | 5.0 | 5.3 |
| onDanger на danger | 6.5 | 7.8 |
| danger на surface | 6.5 | 6.6 |
| dayPast на surface | 8.1 | 9.6 |

## Переглянути

Канвас Claude Design → сторінка «Нові палітри», або `../default/screens/PaletteFrost.dc.html`.
Кожен основний екран у `../default/screens/` має проп `palette`.
