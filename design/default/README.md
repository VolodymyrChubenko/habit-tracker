# Challenge Tracker — основний дизайн (палітра «М'ята»)

Референс UI, звірений 1:1 з кодом (`src/styles/themes/*`, `*.module.scss`, компоненти) станом на 12.11.2026.
Джерело правди для кольорів — `src/styles/themes/_light.scss` і `_dark.scss`; ця папка їх дзеркалить.

## Структура

- `screens/*.dc.html` — по файлу на екран. Основні екрани мають проп `palette` (default/matcha/crimson/gallery/frost/dune); `Palette*.dc.html` — порівняльні ряди палітр. Основні файли містять розмітку й логіку,
  `*Dark.dc.html` та інші короткі файли — обгортки з пропсами (`<dc-import>`).
- Файли потребують runtime Claude Design — читай їх як специфікацію: inline-стилі + об'єкт `THEMES`.
  Синтаксис: `{{x}}` — підстановка, `<sc-for>` — цикл, `<sc-if>` — умова, `data-props` — пропси екрана.

## Екрани → компоненти коду

| Файл | Екран | Компонент у коді | Пропси / стани |
|---|---|---|---|
| Main | Заставка (фінальний кадр анімації) | SplashScreen | однакова в обох темах |
| Today / TodayEmpty | Сьогодні | pages/Today, ChallengeItem, DoneList, ReminderBanner | empty, reminderActive, doneExpanded |
| NewChallenge / NewChallengeReminder | Новий челендж | AddChallengeSheet, ReminderField, ColorPicker | mode=new/filled, reminderOn |
| EditChallenge | Редагувати челендж | EditChallengeSheet | mode=edit, confirmDelete |
| Statistics / StatisticsFiltered | Статистика | StatBoard, ChallengeSelector, ProgressCalendar, StreakTiles | filter |
| DayEdit | Відмітити виконані за минулий день | DateEditSheet | — |
| Archive / ArchiveEmpty | Архів навичок | pages/Archive, ArchivedChallengeList | view, confirmDelete |
| Achievements / AchievementDetail | Досягнення + шит деталей | pages/Achievements, AchievementSheet | detail |
| Settings | Налаштування + новий блок «Палітра» | pages/Settings | push, palette |

## Ключові розміри

- Контент: padding 16/16/24; заголовок сторінки 24/600.
- Картка челенджу: radius 12, padding 15, gap 12, крапка 12, кружок 28 (border 2), назва 16/500; список gap 8.
- Виконана картка: opacity .65, назва text-secondary + line-through, кружок залитий кольором.
- Нагадування на картці: `box-shadow: card, 0 0 0 1.5px accent` (не border).
- Bottom nav: margin 0 12 12, padding 6, radius 18; таб padding 8/4, іконка 20 (stroke 2.2), підпис 10/500 (активний 600); центральний «+» 52px, top −20, border 4px кольору bg.
- Sheet: radius 20, padding 20, handle 36×4 (mb 20), заголовок 17/600, overlay rgba(0,0,0,.35), max-height 85dvh.
- Календар: картка radius 16, padding 12; клітинка 1:1, radius 8, gap 2; кільце 34px, r 13, stroke 2.5; число 10px; сьогодні — фон accent 12%.
- Плитки «Статус»: лише серії ≥ 2 днів.

## Токени (з src/styles/themes)

| Токен | Світла | Темна |
|---|---|---|
| --color-bg | #FAF7F0 | #1C1A17 |
| --color-surface | #FFFFFF | #2A2723 |
| --color-text | #333333 | #F0F0F0 |
| --color-text-secondary | #6B6B6B | #AAAAAA |
| --color-text-muted | #707070 | #9A9A9A |
| --color-border | #F0EDE6 | #3A3632 |
| --color-border-light | #F5F2EC | #33302B |
| --color-accent | #367565 | #7CB9A8 |
| --color-on-accent | #FFFFFF | #1A1A1A |
| --color-on-danger | #FFFFFF | #1A1A1A |
| --color-accent-bg | #EBF5F2 | #1E3330 |
| --color-accent-warm | #E8A87C | #E8A87C |
| --color-accent-purple / -bg | #9B89D4 / #F0EBF8 | #9B89D4 / #2E2A3D |
| --color-danger | #C23B3B | #F07A7A |
| --color-overlay | rgba(0,0,0,.35) | rgba(0,0,0,.35) |
| --color-sheet-row | #FAF7F0 | #211F1B |
| --color-sheet-title / -subtitle | #333333 / #707070 | #F2F2F2 / #9A9A9A |
| --color-checkbox-border | #E0DDD8 | #4D4943 |
| --color-sheet-handle | #F0EDE6 | #4D4943 |
| --color-ring-track-past / -future | #E6E2D9 / #EFEBE3 | #47433D / #393530 |
| --color-day-text-past / -future | #666666 / #949494 | #BDBDBD / #858585 |
| --color-medal-gold / silver / bronze | #E8C55C / #C9CDD4 / #D9A06B | те саме |
| --shadow-card | 0 1px 4px rgba(0,0,0,.06) | 0 1px 4px rgba(0,0,0,.25) |
| --shadow-nav | 0 -1px 10px rgba(0,0,0,.07) | 0 -1px 10px rgba(0,0,0,.3) |

Кольори челенджів (ColorPicker PRESETS): #7CB9A8, #E8A87C, #9B89D4, #F06B7E, #5BA4CF.
Шрифт: Montserrat.

## Що варто знати

- Два баги продакшну (кремові рядки DateEditSheet і білі кільця майбутніх днів у темній темі)
  у локальному коді вже виправлені токенами `--color-sheet-*` і `--color-ring-track-*`.
- Заставка в темній темі тепер темна (`--color-splash-*` у `_dark.scss`); `--color-icon-border` у темній — #3A3632.
- Новий токен `--color-toast-action` (#8FD1BF) для кнопки дії в тості — потребує правки Toast.module.scss.
- Дані на екранах — з реального телефона; «розпочато [ДАТА СТАРТУ]» у AchievementDetail — плейсхолдер.
- Контраст виправлено (WCAG AA ≥ 4.5:1): оновлені значення в `_light.scss` / `_dark.scss` цієї папки — замінюють `src/styles/themes/`.
