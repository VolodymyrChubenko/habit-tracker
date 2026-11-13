# Палітра «Галерея»

Референс: Burnt Terracotta #C34811 · Gallery Blue #0B369A · Stone Linen #D9D1CA (`tracker/3.jpg`).
Змінюються лише кольори; розміри, шрифт і компоненти — як у `../default/`.
Кольори челенджів (ColorPicker PRESETS) — дані користувача, від палітри не залежать.

## Файли

- `_light_gallery.scss` — селектор `[data-palette="gallery"]`
- `_dark_gallery.scss` — селектор `[data-palette="gallery"][data-theme="dark"]`

Імена змінних ті самі, що в `src/styles/themes/_light.scss`, тож компоненти не змінюються.

## Токени

| Змінна | Світла | Темна |
|---|---|---|
| `--color-bg` | #F4F1EE | #121521 |
| `--color-surface` | #FFFFFF | #1E2232 |
| `--color-text` | #1E2230 | #EEF0F6 |
| `--color-text-secondary` | #5B5650 | #B8BDCD |
| `--color-text-muted` | #6B655F | #9EA4B7 |
| `--color-border` | #E2DBD4 | #32374B |
| `--color-border-light` | #ECE6E0 | #2A2F42 |
| `--color-accent` | #0B369A | #93ABFF |
| `--color-accent-bg` | #E3E9F7 | #1F2B52 |
| `--color-accent-warm` | #C34811 | #E8733A |
| `--color-accent-purple` | #C34811 | #EE8A57 |
| `--color-accent-purple-bg` | #F8E6DC | #3A2418 |
| `--color-on-accent` | #FFFFFF | #121521 |
| `--color-danger` | #B3261E | #FF8E7E |
| `--color-on-danger` | #FFFFFF | #121521 |
| `--color-sheet-row` | #F4F1EE | #171B29 |
| `--color-sheet-title` | #1E2230 | #EEF0F6 |
| `--color-sheet-subtitle` | #5B5650 | #B8BDCD |
| `--color-checkbox-border` | #D2CAC2 | #454B61 |
| `--color-sheet-handle` | #E2DBD4 | #454B61 |
| `--color-ring-track-past` | #DDD5CD | #3B4157 |
| `--color-ring-track-future` | #EAE4DE | #2C3144 |
| `--color-day-text-past` | #4E4943 | #C9CEDC |
| `--color-day-text-future` | #7F7973 | #878DA1 |
| `--color-icon-border` | #E2DBD4 | #32374B |
| `--color-theme-preview-light` | #F4F1EE | #F4F1EE |
| `--color-theme-preview-dark` | #1E2232 | #1E2232 |
| `--shadow-card` | 0 1px 4px rgba(0,0,0,0.06) | 0 1px 4px rgba(0,0,0,0.25) |
| `--shadow-nav` | 0 -1px 10px rgba(0,0,0,0.07) | 0 -1px 10px rgba(0,0,0,0.3) |

Також: `--color-overlay` rgba(0,0,0,.35); `--color-toast-bg/-text` = text/bg теми; `--color-splash-*` = фон/текст поточної теми (заставка в темній темі темна); медалі без змін.

`--color-toast-action` (кнопка дії в тості): світла #93ABFF, темна #0B369A.

## Контраст (WCAG, ≥ 4.5 для тексту)

| Пара | Світла | Темна |
|---|---|---|
| text на bg | 14.1 | 16.0 |
| text2 на surface | 7.3 | 8.4 |
| muted на surface | 5.8 | 6.4 |
| onAccent на accent | 10.5 | 8.2 |
| accent на surface | 10.5 | 7.1 |
| accent на accentBg | 8.6 | 6.2 |
| onDanger на danger | 6.5 | 8.2 |
| danger на surface | 6.5 | 7.1 |
| dayPast на surface | 8.9 | 10.0 |

## Переглянути

Канвас Claude Design → сторінка «Нові палітри», або `../default/screens/PaletteGallery.dc.html`.
Кожен основний екран у `../default/screens/` має проп `palette`.
