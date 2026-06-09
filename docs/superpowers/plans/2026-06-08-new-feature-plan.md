# План: Active / Archived / Deleted звички + scoped статистика

## Контекст

Habit tracker (React 19 + TS strict, Vite, Zustand persist, React Router v7, date-fns).
Звички мають три стани:

- **Active** — `!habit.archivedAt`. Доступні на `Today`. Прогрес у `Статистиці`.
- **Archived** — `habit.archivedAt` встановлено (кнопка "Зупинити звичку"). Окрема read-only сторінка `Архів навичок`.
- **Deleted** — hard delete (`deleteHabit` уже видаляє звичку + логи). Ніде не відображаються. **Змін не потребує.**

## Цілі

1. Прогрес у календарі `Статистики` рахується **тільки за активними звичками** (знаменник = активні звички, валідні на дату). Стосується і редагування минулих дат.
2. Нова сторінка `Архів навичок` — копія вигляду `Статистики`, але: заголовок "Архів навичок", закриття хрестиком вгорі праворуч, **read-only** (не можна відмічати виконання, не можна повертати з архіву), у фільтрі **лише архівні** звички. Вхід — посилання "Архів" у хедері `Статистики`. Таб "Статистика" у футері відкриває звичайну `Статистику`.
3. Видалені звички — нічого не показуємо (готово).

## Ключові архітектурні рішення

- Ввести `StatScope = 'active' | 'archived'` і параметризувати `useStatistics`.
- `Архів` — окремий route `/statistics/archive` (не таб). Таб "Статистика" має `end:false`, тож лишається активним на обох.
- Спільний UI винести в `StatBoard` (фільтр + навігація місяцями + календар). Сторінки відрізняються хедером і read-only режимом.
- `HabitSelector` зробити stateless через prop `habits` (щоб архів передавав архівні).
- `saveLogsForDate` приймає scope редагованих id, щоб не стирати логи поза scope (важливо для збереження логів архівних звичок).

---

## Зміни по файлах

### 1. `src/types/index.ts` — додати тип

```ts
export type StatScope = 'active' | 'archived';
```

### 2. `src/store/habitsStore.ts` — scoped `saveLogsForDate`

Оновити сигнатуру в інтерфейсі:

```ts
saveLogsForDate: (
  date: DateString,
  completedHabitIds: HabitId[],
  scopeHabitIds: HabitId[],
) => void;
```

Реалізація:

```ts
saveLogsForDate: (date, completedHabitIds, scopeHabitIds) =>
  set(state => {
    const scope = new Set(scopeHabitIds);
    return {
      logs: [
        // лишаємо: інші дати + логи цієї дати поза scope (напр. архівні)
        ...state.logs.filter(l => l.date !== date || !scope.has(l.habitId)),
        ...completedHabitIds.map(habitId => ({
          habitId,
          date,
          completedAt: new Date().toISOString(),
        })),
      ],
    };
  }),
```

`completedHabitIds ⊆ scopeHabitIds`. Для `DateEditSheet` scope = id активних звичок.

### 3. `src/hooks/useStatistics.ts` — scope

```ts
import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import type { DateString, HabitId, StatScope } from '../types';

export const useStatistics = (scope: StatScope, filterIds?: HabitId[]) => {
  const habits = useHabitsStore(s => s.habits);
  const logs = useHabitsStore(s => s.logs);

  const progressByDate = useMemo(() => {
    const scopedHabits = habits.filter(h =>
      scope === 'active' ? !h.archivedAt : !!h.archivedAt,
    );
    const scopedIds = new Set(scopedHabits.map(h => h.id));

    const map = new Map<DateString, number>();
    const logsByDate = new Map<DateString, Set<HabitId>>();

    for (const log of logs) {
      if (!scopedIds.has(log.habitId)) continue;
      if (filterIds && !filterIds.includes(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.habitId);
    }

    // дати, де всі логи зняли → явний 0 (тільки по scoped логах)
    for (const log of logs) {
      if (!scopedIds.has(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
    }

    for (const [date, completedIds] of logsByDate) {
      const trackable = scopedHabits.filter(h => {
        if (h.archivedAt && h.archivedAt < date) return false;
        if (h.createdAt > date && !completedIds.has(h.id)) return false;
        return true;
      });
      const total = filterIds
        ? trackable.filter(h => filterIds.includes(h.id)).length
        : trackable.length;
      map.set(date, total === 0 ? 0 : completedIds.size / total);
    }

    return map;
  }, [habits, logs, scope, filterIds]);

  return { progressByDate };
};
```

Per-date фільтр спільний для обох scope: для активних `archivedAt` undefined (перша умова no-op); для архівних — обмежує внеском у вікно `[createdAt, archivedAt]`.

### 4. `src/pages/Statistics/HabitSelector.tsx` — stateless

Прибрати `useHabits`, додати `habits` у props:

```ts
import type { Habit, HabitId } from '../../types';

interface Props {
  habits: Habit[];
  selected: HabitId[] | null; // null = всі
  onChange: (ids: HabitId[] | null) => void;
}

export const HabitSelector = ({ habits, selected, onChange }: Props) => {
  // ...той самий JSX, але мапимо по habits замість activeHabits
};
```

### 5. `src/pages/Statistics/ProgressCalendar.tsx` — read-only режим

`onDayClick` зробити опціональним. Якщо не передано — клітинки не клікабельні (архів).

```ts
interface Props {
  year: number;
  month: number;
  progressByDate: Map<DateString, number>;
  onDayClick?: (date: DateString) => void;
}
```

У клітинці:

```tsx
const interactive = !!onDayClick;
// ...
<div
  key={cell.key}
  className={[
    styles.dayCell,
    cell.dateStr === todayStr ? styles.today : '',
    cell.dateStr > todayStr || !interactive ? styles.future : '',
  ].join(' ')}
  onClick={() =>
    interactive && cell.dateStr <= todayStr && onDayClick!(cell.dateStr)
  }
>
```

(`styles.future` дає `cursor: default` — перевикористовуємо для read-only.)

### 6. НОВИЙ `src/pages/Statistics/StatBoard.tsx` — спільний UI

```tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useStatistics } from '../../hooks/useStatistics';
import { HabitSelector } from './HabitSelector';
import { ProgressCalendar } from './ProgressCalendar';
import type { DateString, Habit, HabitId, StatScope } from '../../types';
import styles from './Statistics.module.scss';

interface Props {
  scope: StatScope;
  habits: Habit[];                       // звички для фільтра (active або archived)
  onDayClick?: (date: DateString) => void; // відсутній → read-only
}

export const StatBoard = ({ scope, habits, onDayClick }: Props) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterIds, setFilterIds] = useState<HabitId[] | null>(null);

  const { progressByDate } = useStatistics(scope, filterIds ?? undefined);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <HabitSelector habits={habits} selected={filterIds} onChange={setFilterIds} />

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>
          {format(new Date(year, month, 1), 'LLLL yyyy', { locale: uk })}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      <ProgressCalendar
        year={year}
        month={month}
        progressByDate={progressByDate}
        onDayClick={onDayClick}
      />
    </>
  );
};
```

### 7. `src/pages/Statistics/index.tsx` — використати StatBoard + посилання "Архів"

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from './StatBoard';
import { DateEditSheet } from './DateEditSheet';
import type { DateString } from '../../types';
import styles from './Statistics.module.scss';

export default function StatisticsPage() {
  const { activeHabits, archivedHabits } = useHabits();
  const [editDate, setEditDate] = useState<DateString | null>(null);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика</h1>
        {archivedHabits.length > 0 && (
          <Link to="/statistics/archive" className={styles.archiveLink}>
            Архів
          </Link>
        )}
      </div>

      <StatBoard scope="active" habits={activeHabits} onDayClick={setEditDate} />

      {editDate && (
        <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />
      )}
    </>
  );
}
```

> Рішення: посилання показуємо лише коли є архівні звички. (Альтернатива — показувати завжди; за бажанням прибрати умову.)

### 8. НОВИЙ `src/pages/Archive/index.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from '../Statistics/StatBoard';
import styles from '../Statistics/Statistics.module.scss';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { archivedHabits } = useHabits();

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Архів навичок</h1>
        <button
          className={styles.closeBtn}
          aria-label="Закрити архів"
          onClick={() => navigate('/statistics')}
        >
          ✕
        </button>
      </div>

      {archivedHabits.length === 0 ? (
        <p className={styles.empty}>Немає заархівованих навичок</p>
      ) : (
        // без onDayClick → read-only
        <StatBoard scope="archived" habits={archivedHabits} />
      )}
    </>
  );
}
```

### 9. `src/pages/Statistics/Statistics.module.scss` — хедер + посилання + X + empty

Додати:

```scss
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.archiveLink {
  font-size: 14px;
  font-weight: 600;
  color: $color-accent;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: $radius-pill;
  background: $color-accent-bg;
}

.closeBtn {
  font-size: 20px;
  line-height: 1;
  color: #e05c5c;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.empty {
  color: $color-text-secondary;
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
}
```

> `.title` уже має `margin-bottom: 16px`; усередині `.header` він задається flex-ом — за потреби прибрати нижній відступ у `.title` коли він у хедері (можна додати `.header .title { margin-bottom: 0; }`).

### 10. `src/app/router.tsx` — новий маршрут

```tsx
import ArchivePage from '../pages/Archive';

// children:
{ index: true, element: <TodayPage /> },
{ path: 'statistics', element: <StatisticsPage /> },
{ path: 'statistics/archive', element: <ArchivePage /> },
{ path: 'settings', element: <SettingsPage /> },
```

Таб "Статистика" у `BottomNav` має `end:false` → лишається активним на `/statistics/archive`. Змін у `BottomNav` не треба.

### 11. `src/pages/Statistics/DateEditSheet.tsx` — передати scope у save

```tsx
const handleSave = () => {
  saveLogsForDate(date, [...checked], activeHabits.map(h => h.id));
  onClose();
};
```

(`activeHabits` уже береться з `useHabits()`.)

---

## Оновлення тестів

### `src/hooks/useStatistics.test.ts`
- Усі виклики `useStatistics()` → `useStatistics('active')`.
- Додати кейс scope:
  - архівна звичка **не** впливає на `scope:'active'` прогрес;
  - архівна звичка з логами видима у `scope:'archived'`;
  - дата з логом активної + архівної: active рахує 1/N_active, archived рахує окремо.

### `src/store/habitsStore.test.ts`
- `saveLogsForDate` тест: оновити виклик до 3 аргументів.
- Додати кейс: лог поза `scopeHabitIds` **зберігається** після save (регресія для архівних).

```ts
it('keeps out-of-scope logs when saving a date', () => {
  useHabitsStore.getState().addHabit('A', '#7CB9A8');
  useHabitsStore.getState().addHabit('B', '#E8A87C');
  const { habits } = useHabitsStore.getState();
  useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-01');
  useHabitsStore.getState().completeHabit(habits[1].id, '2026-06-01');
  // редагуємо тільки scope = [A]
  useHabitsStore.getState().saveLogsForDate('2026-06-01', [], [habits[0].id]);
  const logs = useHabitsStore.getState().logs.filter(l => l.date === '2026-06-01');
  expect(logs).toHaveLength(1);
  expect(logs[0].habitId).toBe(habits[1].id); // B (поза scope) лишився
});
```

---

## Порядок реалізації

```
1. types            — StatScope
2. habitsStore      — saveLogsForDate (scope) + оновити тест
3. useStatistics    — scope + оновити тест
4. HabitSelector    — stateless (prop habits)
5. ProgressCalendar — onDayClick опціональний + read-only
6. StatBoard        — новий спільний компонент
7. Statistics/index — StatBoard + Link "Архів"
8. Archive/index    — нова сторінка (read-only)
9. Statistics.module.scss — header/archiveLink/closeBtn/empty
10. router          — /statistics/archive
11. DateEditSheet   — передати scope у save
12. Запустити npm run test:run + npm run build
```

## Edge cases

- **Збереження дати не чіпає архівні логи** — гарантується scope у `saveLogsForDate`. Без цього `DateEditSheet` (показує лише active) стирав би лог архівної звички за ту дату.
- **Активна → архівна після виконань**: минулі логи зникають зі `Статистики` (scope active) і з'являються в `Архіві` — це очікувано (повний поділ).
- **Знаменник active**: звичка, створена після обраної дати, не входить у знаменник минулих дат, якщо немає ретро-логу (логіка `createdAt > date`).
- **`StatBoard` стан місяця** не шериться між Статистикою і Архівом (різні інстанси route) — кожна відкривається на поточному місяці.
- **Порожній архів**: посилання "Архів" приховане; якщо зайти на `/statistics/archive` напряму — показуємо empty-state.
- **Повернення з архіву заборонене**: архівні звички ніде не редагуються (Today показує лише active; Архів read-only), тож `unarchive` дії немає — вимога виконана без додаткового коду.
- **Dark theme**: inline-стилі з хардкодом (`#FAF7F0`, `#E0DDD8`, `#222`, `#aaa`) у `DateEditSheet`/`HabitSelector` лишаються поза скоупом цих фіч, але варто згодом перевести на токени.

## Перевірка готовності

- [ ] `Статистика`: прогрес = виконані/активні (1/5, 2/5 …), архівні не впливають.
- [ ] Редагування минулої дати рахує знаменник по активних і не стирає архівні логи.
- [ ] `Архів навичок`: заголовок, X закриває на `/statistics`, фільтр лише архівних, клітинки не клікабельні.
- [ ] Таб "Статистика" активний на обох сторінках.
- [ ] Видалена звичка зникає звідусіль (звичка + логи).
- [ ] `npm run test:run` і `npm run build` зелені.
