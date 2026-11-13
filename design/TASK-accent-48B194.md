# Задача: акцент М'яти → #48B194

Дизайн: `design/default/` (`_light.scss`, `_dark.scss`, `README.md`, `screens/*.dc.html`), значення — `design/palettes.json`.
Один токен акценту на все (заливки, текст, іконки, рамки). Текст/іконки на акцентній заливці — **білі** в обох темах.
Контраст свідомо прийнятий: #48B194 на #FAF7F0 — 2.46:1, білий на #48B194 — 2.63:1.

## 1. `src/styles/themes/_light.scss` (палітра default)
- `--color-accent: #48B194;` (було #367565)
- `--color-accent-bg: #EEF6F2;` (було #EBF5F2)
- `--color-on-accent: #FFFFFF;` — без змін

## 2. `src/styles/themes/_dark.scss` (палітра default)
- `--color-accent: #48B194;` (було #7CB9A8)
- `--color-on-accent: #FFFFFF;` (було #1A1A1A)
- `--color-accent-bg: #1E3330;` — без змін

## 3. Напівпрозорі похідні
Якщо десь захардкоджено rgba старого акценту — замінити на `rgba(72,177,148,…)`:
- today-фон у календарі: `0.14` (було 0.12)
- тінь FAB/кнопок: `0.4`
(`tint($color-accent, …)` перераховується сам — нічого не робити.)

## 4. Заставка
SplashScreen бере `$color-accent` → стане #48B194 автоматично. Якщо `--color-splash-*` задані окремо — accent #48B194 в обох темах.

## 5. Не чіпати
- Інші палітри (matcha, crimson, gallery, frost, dune).
- Кольори челенджів (`ColorPicker` PRESETS, `#7CB9A8` у типах і тестах).
- `--color-toast-action: #8FD1BF`.
- Компоненти — заміни `$color-accent` на інший токен не потрібні.

## 6. Перевірка
1. `npm run build` + `npm test`.
2. `grep -rn "367565\|rgba(54, *117\|rgba(124, *185" src` — порожньо (окрім кольорів челенджів #7CB9A8).
3. Візуально, світла й темна, проти `design/default/screens/`: Today, Statistics, Settings, NewChallenge, Achievements — FAB, кнопки, чекбокси, активна вкладка, «Архів» — #48B194; галочки й текст на заливці — білі.
