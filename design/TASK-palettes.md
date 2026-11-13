# Задача: палітри + оновлена «М'ята»

Контекст: React 18 + TS (strict) + Vite + Zustand. Кольори — CSS-змінні в `src/styles/themes/`,
SCSS-аліаси в `src/styles/_tokens.scss`. Специфікація — `design/README.md`, токени — `design/palettes.json`,
макети — `design/default/screens/*.dc.html` (читати як специфікацію, не імпортувати).
Змінюються кольори; компоненти — лише там, де вказано нижче.

## 1. Оновити «М'яту» (палітра default)

- Заміни `src/styles/themes/_light.scss` і `_dark.scss` файлами з `design/default/`.
  Що всередині: контраст WCAG AA, тепла темна тема (#1C1A17 / #2A2723), темна заставка в темній темі,
  темна плашка дзвіночка, рамка іконок #3A3632, сильніші тіні в темній, новий токен `--color-toast-action`.
- `_light_default.scss` / `_dark_default.scss` (резервні копії) — онови так само або видали, якщо не потрібні.

## 2. Нові палітри

- Скопіюй `design/{matcha,crimson,gallery,frost,dune}/_{light,dark}_<name>.scss` у `src/styles/themes/`.
- `src/styles/global.scss`: підключи їх ПІСЛЯ `themes/light` і `themes/dark`
  (`[data-palette]` має перекривати `:root`; `[data-palette][data-theme="dark"]` — вищий за специфічністю).

## 3. Новий токен для тосту

- `src/styles/_tokens.scss`: `$color-toast-action: var(--color-toast-action);`
- `Toast.module.scss`: `.action { color: $color-toast-action; }` (замість `$color-accent`).

## 4. Стан і застосування

- `src/types`: `export type Palette = 'default' | 'matcha' | 'crimson' | 'gallery' | 'frost' | 'dune';`
- `settingsStore`: поле `palette: Palette` (за замовчуванням `'default'`) + `setPalette`.
  Підніми `version` persist до 3; у `migrate`: `state.palette = state.palette ?? 'default'`.
- `src/app/App.tsx`: поряд із `data-theme` став `document.documentElement.dataset.palette = palette`;
  для `'default'` — прибирай атрибут. Палітра й тема незалежні; «Як у системі» працює з будь-якою палітрою.

## 5. Налаштування → блок «Палітра»

Нова секція між «Нагадування» і «Зовнішній вигляд», як у `design/default/screens/Settings.dc.html`:

- заголовок секції — як у сусідніх (12px/600, uppercase, border-bottom `--color-border-light`);
- сітка 3 колонки, gap 8, padding 12px 16px 16px;
- картка — `button role="radio" aria-checked`, radius 12, border 2px
  (вибрана: `--color-accent`, інші: `--color-border`), padding 6px 6px 8px, gap 7;
- превʼю — висота 40, radius 8, border 1px `--color-border-light`, фон = bg палітри в поточній темі
  (з `design/palettes.json` → `<name>.<light|dark>.bg`, бо CSS-змінні знають лише активну палітру),
  три кружки 18px з рамкою 2px кольору фону й накладанням −4px:
  default `#367565 #7CB9A8 #E8A87C` · matcha `#261815 #B3CC10 #774023` · crimson `#A6B8A0 #8B729C #E20942`
  · gallery `#C34811 #0B369A #D9D1CA` · frost `#D3DCDB #4D6474 #A3B4BC` · dune `#240F22 #AE1203 #FFDFB6`;
- назва 12px, вибрана — 600: М'ята, Матча, Кармін, Галерея, Іній, Дюна;
- обгортка `role="radiogroup" aria-label="Палітра"`.

## 6. Місця, де `--color-on-accent` у темних темах став темним

Тепер у темних темах (і в «М'яті») `--color-on-accent` темний. Перевір, де він стоїть НЕ на акценті:

- `ChallengeItem` `.check` — галочка на кольорі челенджу: зроби завжди `#FFF`.
- `Settings` `MoonIcon` — stroke завжди `#FFF` (іконка на темному превʼю теми).
- Пошукай інші `on-accent`/`$color-on-accent` поза кнопками з фоном `--color-accent` і виправ так само.

## 7. Перевірка

- `npm run build`, `npm run test:run` (онови тести settingsStore під нове поле й міграцію).
- Пройди всі екрани в кожній з 6 палітр, у світлій і темній темі: Сьогодні, Новий/Редагувати челендж,
  Статистика + Архів + редагування дня, Досягнення + деталі, Налаштування, заставка, тост.
- Кольори челенджів (ColorPicker PRESETS) не змінюй.
- Інші компоненти, крім названих (App, settingsStore, types, global.scss, _tokens.scss, Toast, ChallengeItem, Settings), не чіпай.
