# Plan: Bug Fixes + Edit Habit Feature

## Bug 1 — Dark theme applies only to background

### Root cause
`global.scss` sets CSS custom properties (`--bg`, `--surface`, `--text`, `--border`) under `[data-theme="dark"]`,
but the SCSS components use **hardcoded SCSS variables** (`$color-surface`, `$color-text`, etc.) that are
resolved at build time. CSS vars are never consumed by any component.

### Fix

**`src/styles/_tokens.scss`** — добавити CSS custom properties поряд зі SCSS змінними:
```scss
:root {
  --color-bg:             #{$color-bg};
  --color-surface:        #{$color-surface};
  --color-text:           #{$color-text};
  --color-text-secondary: #{$color-text-secondary};
  --color-text-muted:     #{$color-text-muted};
  --color-border:         #{$color-border};
  --color-border-light:   #{$color-border-light};
  --color-accent-bg:      #{$color-accent-bg};
}

[data-theme="dark"] {
  --color-bg:             #{$color-bg-dark};
  --color-surface:        #{$color-surface-dark};
  --color-text:           #{$color-text-dark};
  --color-text-secondary: #aaaaaa;
  --color-text-muted:     #666666;
  --color-border:         #{$color-border-dark};
  --color-border-light:   #333333;
  --color-accent-bg:      #1e3330;
}
```

**`src/styles/_tokens.scss`** — перевизначити SCSS змінні щоб вони посилались на CSS vars:
```scss
$color-bg:             var(--color-bg);
$color-surface:        var(--color-surface);
$color-text:           var(--color-text);
$color-text-secondary: var(--color-text-secondary);
$color-text-muted:     var(--color-text-muted);
$color-border:         var(--color-border);
$color-border-light:   var(--color-border-light);
$color-accent-bg:      var(--color-accent-bg);
```

**`src/styles/global.scss`** — видалити дубльований `[data-theme="dark"]` блок (він тепер у `_tokens.scss`).
Залишити тільки `background` і `color` на `html`/`body` щоб вони теж реагували.

### Files to change
- `src/styles/_tokens.scss`
- `src/styles/global.scss`

---

## Bug 2 — Statistics calendar not updating after DateEditSheet save

### Root cause
`useStatistics` hook має `useMemo` з депенденсями `[habits, logs, filterIds]`.
Проблема не в мемоізації — `logs` оновлюється правильно через `saveLogsForDate`.

Справжня причина: **`ProgressCalendar` рендерить `CircularProgress` з `progress`
тільки для дат де є хоч один лог** (бо `progressByDate.get(dateStr) ?? 0` повертає 0 для дат без логів після збереження).

Перевірити логіку `useStatistics`:
```ts
// Баг тут — якщо всі звички знято з дня, то logsByDate не матиме цей день
// і map.set() для нього ніколи не викликається → прогрес залишається з попереднього рендеру
for (const [date, completedIds] of logsByDate) { ... }
```

Якщо `saveLogsForDate` зберігає порожній масив (`[]`), то для цієї дати логів немає,
`logsByDate` не міститиме цей день, і `progressByDate` не отримає `0` — він просто
не буде оновлений, показуючи старий кеш `useMemo`.

### Fix

В `useStatistics.ts` додати явний прохід по всіх датах з логами **і** по датах без логів
після `saveLogsForDate`. Найпростіше рішення — зібрати всі унікальні дати з логів і
виставити `0` для тих, де після фільтрації нічого не лишилось:

```ts
// Зібрати всі дати з логів (включно з тими, де після фільтру 0 записів)
const allLogDates = new Set(logs.map(l => l.date));

for (const date of allLogDates) {
  const completedIds = logsByDate.get(date) ?? new Set();
  const activeOnDate = habits.filter(h => { ... });
  const total = ...;
  map.set(date, total === 0 ? 0 : completedIds.size / total);
}
```

Але це не повністю вирішує проблему, бо якщо день повністю очищений (`saveLogsForDate(date, [])`),
то `allLogDates` теж не міститиме цей день.

**Правильне рішення** — зберігати прогрес через `Map` ініціалізований нулями для всіх
розрахованих дат, або в `ProgressCalendar` примусово ре-рендерити через `key` при зміні місяця.

Найчистіше: передавати `logs` як додаткову залежність безпосередньо щоб React
бачив зміну референсу — вже є. Перевірити чи `saveLogsForDate` справді тригерить
новий референс `logs` масиву → так, `set()` у zustand завжди створює новий об'єкт.

**Реальна проблема після детального аналізу**: при збереженні **порожнього** списку
(`saveLogsForDate(date, [])`) стара точка `progressByDate.get(date)` залишається з
попереднього `useMemo` якщо `logsByDate` більше не має цього дня.

Fix в `useStatistics.ts`:
```ts
// Після побудови logsByDate, явно виставити 0 для всіх дат що були в logs але більше не є
// Зібрати всі дати що колись мали логи для цього фільтру:
const previousDates = new Set(
  logs
    .filter(l => !filterIds || filterIds.includes(l.habitId))
    .map(l => l.date)
);
// Але якщо saveLogsForDate очистила день — logs вже не має цих записів!
// Тому потрібен інший підхід.
```

**Кінцевий fix** — ініціалізувати `map` нулями для всіх можливих дат через `habits[].createdAt`
до сьогоднішнього дня, або просто повернути `0` для будь-якої дати де `logsByDate` не має записів
але є активні звички. Для цього в `ProgressCalendar` при кліку на дату після збереження
потрібно форсувати оновлення.

**Найпростіший і правильний fix**: в `DateEditSheet` після `saveLogsForDate` — нічого,
бо `onClose()` вже є. Проблема що `useStatistics` не перераховує дні з `0` логів.

Додати в `useStatistics` прохід по `progressByDate` з явним `0` для очищених дат:

```ts
// В кінці useMemo, після основного циклу:
// Для дат де були логи в попередньому стані але тепер їх немає — map вже не має цих дат
// Рішення: повернути спеціальний sentinel або використати окремий Set для "visited dates"
```

**Фінальне просте рішення**: замінити в `ProgressCalendar` дефолт з `?? 0` на явну
перевірку — не потрібно. Проблема глибше.

Справжнє рішення — змінити `useStatistics` щоб він **явно виставляв `0`** для дат
де `logsByDate` не має записів але `habits` мали б активні звички. Для цього потрібно
знати які дати "цікаві" — можна взяти їх з поточного відображуваного місяця.

Або простіше — **передати місяць/рік в `useStatistics`** і повертати прогрес для всіх
днів місяця, не тільки тих де є логи.

**Обраний підхід**: залишити `useStatistics` як є, але виправити функцію так, щоб
`logsByDate` будувався враховуючи і дні, де все було знято. Для цього зберігати
`Map<DateString, Set>` де Set може бути порожнім:

```ts
// Ініціалізувати порожніми Set для всіх дат, де є хоч якийсь лог (до фільтрації)
const allDatesWithActivity = new Set(logs.map(l => l.date));
for (const date of allDatesWithActivity) {
  if (!logsByDate.has(date)) logsByDate.set(date, new Set());
}
```

Це дасть `0` для дат де всі логи були видалені через фільтр або де `saveLogsForDate(date, [])`.

### Files to change
- `src/hooks/useStatistics.ts`

---

## Feature — Edit Habit Sheet

### New type в `src/types/index.ts`
Нічого нового не потрібно. `archivedAt` вже є для "зупинки".
Для "видалення" — додати `deletedAt?: DateString` або просто фільтрувати з `habits` (hard delete).

Рішення: **hard delete** через новий `deleteHabit` action в store. Логи теж видаляються.

### Store changes — `src/store/habitsStore.ts`
Додати:
```ts
updateHabit: (habitId: HabitId, patch: Partial<Pick<Habit, 'name' | 'color'>>) => void;
deleteHabit: (habitId: HabitId) => void; // видаляє звичку + всі її логи
```

### New component — `src/pages/Today/EditHabitSheet.tsx`
```
src/pages/Today/EditHabitSheet.tsx
src/pages/Today/EditHabitSheet.module.scss  (або розширити AddHabitSheet.module.scss)
```

UI структура (аналогічно `AddHabitSheet`):
```
<BottomSheet onClose>
  <h3>Редагувати звичку</h3>
  
  [input: назва]
  [ColorPicker: колір]
  
  [button: Зберегти зміни]   ← updateHabit + onClose
  
  ── небезпечна зона ──
  
  [button: Зупинити звичку]  ← archiveHabit + onClose (з підтвердженням або toast)
  [button: Видалити звичку]  ← підтвердження → deleteHabit + onClose
</BottomSheet>
```

### Changes in `src/pages/Today/HabitList.tsx`
- Прибрати `onArchive` prop або залишити для сумісності
- Змінити `onToggle` логіку: коротке натиснення = toggle done, довге = НЕ потрібне
- Додати `onClick` на картку (або окрему кнопку ✎) для відкриття `EditHabitSheet`

### Changes in `src/pages/Today/index.tsx`
- Прибрати `handleArchive` логіку (переноситься в `EditHabitSheet`)
- Додати стан `editingHabit: Habit | null`
- Рендерити `<EditHabitSheet habit={editingHabit} ... />`

### Changes in `src/components/HabitItem/HabitItem.tsx`
- Прибрати long-press логіку (`pressTimer`, `handlePressStart`, `handlePressEnd`)
- Змінити: натиснення на картку = `onEdit()`, натиснення на circle button = `onToggle()`
- Оновити `Props`: замінити `onArchive` на `onEdit`

### Changes in `src/components/HabitItem/HabitItem.test.tsx`
- Оновити тести під нові пропси

### Store test — `src/store/habitsStore.test.ts`
Додати тести для `updateHabit` і `deleteHabit`.

---

## Implementation order

```
1. Bug 1  — src/styles/_tokens.scss + src/styles/global.scss
2. Bug 2  — src/hooks/useStatistics.ts
3. Feature:
   a. src/store/habitsStore.ts          (+ типи якщо потрібно)
   b. src/pages/Today/EditHabitSheet.tsx + .module.scss
   c. src/components/HabitItem/HabitItem.tsx  (прибрати long-press, додати onEdit)
   d. src/pages/Today/HabitList.tsx           (передати onEdit)
   e. src/pages/Today/index.tsx               (стан editingHabit, рендер EditHabitSheet)
   f. Тести: habitsStore.test.ts, HabitItem.test.tsx
```

## Edge cases to watch

- `deleteHabit` має видаляти і `logs` де `habitId === id`
- `EditHabitSheet` відкривається на вже архівованій звичці? → `DoneList` не передає `onEdit`, тільки toggle. Або передає, але кнопка "Зупинити" замінюється на "Відновити" (`archivedAt` є → `unarchiveHabit`).
- `updateHabit` patch повинен ігнорувати порожній `name.trim()` (валідація в UI).
- Після `deleteHabit` — якщо звичка була у `DoneList` того ж дня, вона зникає коректно бо `useTodayProgress` фільтрує по `activeHabits` (але `deleteHabit` прибирає з `habits` зовсім — ок).
- Dark theme: `$color-accent` і `$color-accent-warm` не міняються в темній темі — це ок (акцент залишається однаковим). Але `$shadow-*` використовують `rgba(0,0,0,...)` — в темній темі тіні можна прибрати або зменшити.
- SCSS `box-shadow` і `border` з hardcoded `#E8E4DC`, `#333`, `rgba(124,185,168,...)` в inline styles в Statistics/DateEditSheet — їх теж треба переглянути для dark theme, але це поза скоупом Bug 1.
