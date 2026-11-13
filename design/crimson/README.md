# Палітра «Кармін»

Референс: Leaf Skin #A6B8A0 · Muted Violet #8B729C · Electric Crimson #E20942 (`tracker/2.jpg`).
Змінюються лише кольори; розміри, шрифт і компоненти — як у `../default/`.
Кольори челенджів (ColorPicker PRESETS) — дані користувача, від палітри не залежать.

## Файли

- `_light_crimson.scss` — селектор `[data-palette="crimson"]`
- `_dark_crimson.scss` — селектор `[data-palette="crimson"][data-theme="dark"]`

Імена змінних ті самі, що в `src/styles/themes/_light.scss`, тож компоненти не змінюються.

## Токени

| Змінна | Світла | Темна |
|---|---|---|
| `--color-bg` | #F2F5F0 | #1A171D |
| `--color-surface` | #FFFFFF | #27222C |
| `--color-text` | #2A2230 | #F2EEF4 |
| `--color-text-secondary` | #5E5468 | #C3BACB |
| `--color-text-muted` | #6E6578 | #A79DB1 |
| `--color-border` | #DEE5DA | #3B3541 |
| `--color-border-light` | #E9EEE6 | #322C38 |
| `--color-accent` | #C80A3C | #FF5C7F |
| `--color-accent-bg` | #FCE4EA | #43202B |
| `--color-accent-warm` | #8B729C | #A6B8A0 |
| `--color-accent-purple` | #8B729C | #B9A3C9 |
| `--color-accent-purple-bg` | #EEE8F2 | #3A3044 |
| `--color-on-accent` | #FFFFFF | #1A171D |
| `--color-danger` | #9E1B32 | #FF9B8F |
| `--color-on-danger` | #FFFFFF | #1A171D |
| `--color-sheet-row` | #F2F5F0 | #201C24 |
| `--color-sheet-title` | #2A2230 | #F2EEF4 |
| `--color-sheet-subtitle` | #5E5468 | #C3BACB |
| `--color-checkbox-border` | #CBD3C7 | #4E4656 |
| `--color-sheet-handle` | #DEE5DA | #4E4656 |
| `--color-ring-track-past` | #D9E0D5 | #463F4D |
| `--color-ring-track-future` | #E7ECE4 | #36303C |
| `--color-day-text-past` | #4F4659 | #D3CBDA |
| `--color-day-text-future` | #7F778A | #8D8497 |
| `--color-icon-border` | #DEE5DA | #3B3541 |
| `--color-theme-preview-light` | #F2F5F0 | #F2F5F0 |
| `--color-theme-preview-dark` | #26222B | #27222C |
| `--shadow-card` | 0 1px 4px rgba(0,0,0,0.06) | 0 1px 4px rgba(0,0,0,0.25) |
| `--shadow-nav` | 0 -1px 10px rgba(0,0,0,0.07) | 0 -1px 10px rgba(0,0,0,0.3) |

Також: `--color-overlay` rgba(0,0,0,.35); `--color-toast-bg/-text` = text/bg теми; `--color-splash-*` = фон/текст поточної теми (заставка в темній темі темна); медалі без змін.

`--color-toast-action` (кнопка дії в тості): світла #FF5C7F, темна #C80A3C.

## Контраст (WCAG, ≥ 4.5 для тексту)

| Пара | Світла | Темна |
|---|---|---|
| text на bg | 13.9 | 15.5 |
| text2 на surface | 7.1 | 8.3 |
| muted на surface | 5.5 | 6.0 |
| onAccent на accent | 5.9 | 6.0 |
| accent на surface | 5.9 | 5.2 |
| accent на accentBg | 4.9 | 4.8 |
| onDanger на danger | 7.9 | 8.7 |
| danger на surface | 7.9 | 7.6 |
| dayPast на surface | 8.9 | 9.9 |

## Переглянути

Канвас Claude Design → сторінка «Нові палітри», або `../default/screens/PaletteCrimson.dc.html`.
Кожен основний екран у `../default/screens/` має проп `palette`.
