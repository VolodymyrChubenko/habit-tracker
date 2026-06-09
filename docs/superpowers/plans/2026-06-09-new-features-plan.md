# План: 3 нові фічі (Statistics swipe, Streak tiles, Drag & Drop)

**Дата:** 2026-06-09
**Стек:** TS strict, React 18, Zustand, date-fns, Vitest

Виконуй кроки по порядку. Кожен блок коду — повний вміст файлу (заміна) або явно позначений як patch/snippet.

---

## 0. Залежності

```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Потрібні лише для Feature 3 (Drag & Drop з підтримкою тачу).

---

## Feature 3 — частина A: типи + store (порядок звичок)

### `src/types/index.ts` (заміна)

Додано `order: number` у `Habit`.

```typescript
export type HabitId = string;
export type DateString = string; // "yyyy-MM-dd"

export interface Habit {
  id: HabitId;
  name: string;
  color: string; // hex "#7CB9A8"
  createdAt: DateString;
  archivedAt?: DateString;
  order: number;
}

export interface HabitLog {
  habitId: HabitId;
  date: DateString;
  completedAt: string; // ISO timestamp
}

export type Theme = 'light' | 'dark' | 'system';
export type StatScope = 'active' | 'archived';
export type ActiveTab = 'today' | 'statistics' | 'settings';
```

### `src/store/habitsStore.ts` (заміна)

Додано: `order` при `addHabit`, екшен `reorderHabits`, версія персисту + міграція старих даних.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Habit, HabitId, HabitLog, DateString } from '../types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (name: string, color: string) => void;
  updateHabit: (habitId: HabitId, patch: Partial<Pick<Habit, 'name' | 'color'>>) => void;
  deleteHabit: (habitId: HabitId) => void;
  completeHabit: (habitId: HabitId, date: DateString) => void;
  uncompleteHabit: (habitId: HabitId, date: DateString) => void;
  archiveHabit: (habitId: HabitId) => void;
  unarchiveHabit: (habitId: HabitId) => void;
  saveLogsForDate: (date: DateString, completedHabitIds: HabitId[], scopeHabitIds: HabitId[]) => void;
  reorderHabits: (orderedIds: HabitId[]) => void;
}

const nextOrder = (habits: Habit[]): number =>
  habits.reduce((max, h) => Math.max(max, h.order ?? 0), -1) + 1;

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (name, color) =>
        set(state => ({
          habits: [
            ...state.habits,
            {
              id: nanoid(),
              name,
              color,
              createdAt: format(new Date(), 'yyyy-MM-dd'),
              order: nextOrder(state.habits),
            },
          ],
        })),

      updateHabit: (habitId, patch) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, ...patch } : h,
          ),
        })),

      deleteHabit: (habitId) =>
        set(state => ({
          habits: state.habits.filter(h => h.id !== habitId),
          logs: state.logs.filter(l => l.habitId !== habitId),
        })),

      completeHabit: (habitId, date) => {
        const already = get().logs.some(l => l.habitId === habitId && l.date === date);
        if (already) return;
        set(state => ({
          logs: [...state.logs, { habitId, date, completedAt: new Date().toISOString() }],
        }));
      },

      uncompleteHabit: (habitId, date) =>
        set(state => ({
          logs: state.logs.filter(l => !(l.habitId === habitId && l.date === date)),
        })),

      archiveHabit: (habitId) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, archivedAt: format(new Date(), 'yyyy-MM-dd') } : h,
          ),
        })),

      unarchiveHabit: (habitId) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, archivedAt: undefined } : h,
          ),
        })),

      saveLogsForDate: (date, completedHabitIds, scopeHabitIds) =>
        set(state => {
          const scope = new Set(scopeHabitIds);
          return {
            logs: [
              ...state.logs.filter(l => l.date !== date || !scope.has(l.habitId)),
              ...completedHabitIds.map(habitId => ({
                habitId,
                date,
                completedAt: new Date().toISOString(),
              })),
            ],
          };
        }),

      reorderHabits: (orderedIds) =>
        set(state => {
          const position = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            habits: state.habits.map(h =>
              position.has(h.id) ? { ...h, order: position.get(h.id)! } : h,
            ),
          };
        }),
    }),
    {
      name: 'habit-tracker-storage',
      version: 1,
      // міграція старих даних без поля order: присвоюємо за поточним індексом
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as HabitsState;
        if (version === 0 && state?.habits) {
          state.habits = state.habits.map((h, i) => ({ ...h, order: h.order ?? i }));
        }
        return state;
      },
    },
  ),
);
```

### `src/hooks/useHabits.ts` (заміна)

Сортування за `order`.

```typescript
import { useHabitsStore } from '../store/habitsStore';
import type { Habit } from '../types';

const byOrder = (a: Habit, b: Habit): number => a.order - b.order;

export const useHabits = () => {
  const habits = useHabitsStore(s => s.habits);
  const activeHabits = habits.filter(h => !h.archivedAt).sort(byOrder);
  const archivedHabits = habits.filter(h => !!h.archivedAt).sort(byOrder);
  return { activeHabits, archivedHabits };
};
```

---

## Feature 3 — частина B: Drag & Drop у списку Today

### `src/pages/Today/HabitList.tsx` (заміна)

```typescript
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHabitsStore } from '../../store/habitsStore';
import { useHabits } from '../../hooks/useHabits';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';

interface Props {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
}

interface RowProps {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
}

const SortableRow = ({ habit, onToggle, onEdit }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={onEdit} />
    </div>
  );
};

export const HabitList = ({ habits, onEdit }: Props) => {
  const { completeHabit, reorderHabits } = useHabitsStore();
  const { activeHabits } = useHabits();
  const date = today();

  const sensors = useSensors(
    // 8px рух перед стартом drag, щоб тап по картці не запускав перетягування
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = habits.map(h => h.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reorderedVisible = arrayMove(ids, oldIndex, newIndex);

    // повний порядок активних: переставлені todo + решта (виконані) в кінці
    const visibleSet = new Set(reorderedVisible);
    const rest = activeHabits.map(h => h.id).filter(id => !visibleSet.has(id));
    reorderHabits([...reorderedVisible, ...rest]);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
        {habits.map(habit => (
          <SortableRow
            key={habit.id}
            habit={habit}
            onToggle={() => completeHabit(habit.id, date)}
            onEdit={() => onEdit(habit)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

> **Примітка по UX:** drag застосовано лише до невиконаних звичок. `DoneList` лишаємо без змін — порядок виконаних не редагується, вони відсортуються за `order` автоматично.

---

## Feature 1 — свайп місяців

### `src/hooks/useSwipe.ts` (новий файл)

```typescript
import { useRef, type TouchEvent } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface Options {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 }: Options): SwipeHandlers => {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = (e: TouchEvent): void => {
    startX.current = e.changedTouches[0].clientX;
    startY.current = e.changedTouches[0].clientY;
  };

  const onTouchEnd = (e: TouchEvent): void => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // ігноруємо вертикальні свайпи (скрол), реагуємо лише на горизонтальні
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

    dx < 0 ? onSwipeLeft() : onSwipeRight();
  };

  return { onTouchStart, onTouchEnd };
};
```

---

## Feature 2 — стрейк-плитки

### `src/utils/streakUtils.ts` (новий файл)

```typescript
import { format, subDays, parseISO } from 'date-fns';
import type { DateString, Habit } from '../types';

const toStr = (d: Date): DateString => format(d, 'yyyy-MM-dd');

/**
 * Поточний стрейк (днів поспіль).
 * - сьогодні виконано → включаємо сьогодні, рахуємо назад
 * - сьогодні НЕ виконано → рахуємо від учора (сьогодні ще не "пропуск")
 * - перший пропуск зупиняє підрахунок
 * - дні до createdAt не вважаються пропуском
 */
export const calcStreak = (
  habit: Habit,
  completedDates: Set<DateString>,
  todayStr: DateString,
): number => {
  const todayDone = completedDates.has(todayStr);

  let cursor = todayDone ? parseISO(todayStr) : subDays(parseISO(todayStr), 1);
  let streak = 0;

  while (true) {
    const dateStr = toStr(cursor);
    if (dateStr < habit.createdAt) break;

    if (completedDates.has(dateStr)) {
      streak += 1;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }

  return streak;
};
```

### `src/hooks/useStreaks.ts` (новий файл)

```typescript
import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import { calcStreak } from '../utils/streakUtils';
import { today } from '../utils/dateUtils';
import type { Habit, HabitId, DateString } from '../types';

interface StreakResult {
  habit: Habit;
  streak: number;
}

export const useStreaks = (habits: Habit[], filterIds: HabitId[] | null): StreakResult[] => {
  const logs = useHabitsStore(s => s.logs);

  return useMemo(() => {
    const todayStr = today();

    const completedByHabit = new Map<HabitId, Set<DateString>>();
    for (const log of logs) {
      if (!completedByHabit.has(log.habitId)) completedByHabit.set(log.habitId, new Set());
      completedByHabit.get(log.habitId)!.add(log.date);
    }

    const filtered = filterIds
      ? habits.filter(h => filterIds.includes(h.id))
      : habits;

    return filtered
      .map(habit => ({
        habit,
        streak: calcStreak(habit, completedByHabit.get(habit.id) ?? new Set(), todayStr),
      }))
      .filter(r => r.streak >= 2); // плитку показуємо від 2 днів
  }, [logs, habits, filterIds]);
};
```

### `src/pages/Statistics/StreakTiles.tsx` (новий файл)

```typescript
import { useStreaks } from '../../hooks/useStreaks';
import type { Habit, HabitId, StatScope } from '../../types';
import styles from './StreakTiles.module.scss';

interface Props {
  scope: StatScope;
  habits: Habit[];
  filterIds: HabitId[] | null;
}

const dayWord = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дні';
  return 'днів';
};

export const StreakTiles = ({ habits, filterIds }: Props) => {
  const streaks = useStreaks(habits, filterIds);

  if (streaks.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.heading}>Статус</p>
      <div className={styles.grid}>
        {streaks.map(({ habit, streak }) => (
          <div key={habit.id} className={styles.tile} style={{ borderLeftColor: habit.color }}>
            <span className={styles.name}>{habit.name}</span>
            <span className={styles.count} style={{ color: habit.color }}>{streak}</span>
            <span className={styles.label}>{dayWord(streak)} поспіль</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### `src/pages/Statistics/StreakTiles.module.scss` (новий файл)

```scss
@use '../../styles/tokens' as *;

.section { margin-top: 18px; }

.heading {
  font-size: 11px;
  font-weight: 600;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tile {
  background: $color-surface;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  border-left: 3px solid transparent;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: 13px;
  font-weight: 500;
  color: $color-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}

.label {
  font-size: 12px;
  color: $color-text-secondary;
}
```

---

## Інтеграція F1 + F2: `src/pages/Statistics/StatBoard.tsx` (заміна)

```typescript
import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useStatistics } from '../../hooks/useStatistics';
import { useSwipe } from '../../hooks/useSwipe';
import { HabitSelector } from './HabitSelector';
import { ProgressCalendar } from './ProgressCalendar';
import { StreakTiles } from './StreakTiles';
import type { DateString, Habit, HabitId, StatScope } from '../../types';
import styles from './Statistics.module.scss';

interface Props {
  scope: StatScope;
  habits: Habit[];
  onDayClick?: (date: DateString) => void;
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

  const swipe = useSwipe({ onSwipeLeft: nextMonth, onSwipeRight: prevMonth });

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

      <div {...swipe}>
        <ProgressCalendar
          year={year}
          month={month}
          progressByDate={progressByDate}
          onDayClick={onDayClick}
        />
      </div>

      <StreakTiles scope={scope} habits={habits} filterIds={filterIds} />
    </>
  );
};
```

> `StreakTiles` рендериться в `StatBoard`, тому з'явиться і на `/statistics` (active), і на `/statistics/archive` (archived). Якщо стрейки в архіві небажані — додай умову `{scope === 'active' && <StreakTiles .../>}`.

---

## Тести

### `src/utils/streakUtils.test.ts` (новий файл)

```typescript
import { describe, it, expect } from 'vitest';
import { calcStreak } from './streakUtils';
import type { Habit, DateString } from '../types';

const habit = (createdAt: DateString, archivedAt?: DateString): Habit => ({
  id: 'h1',
  name: 'Test',
  color: '#7CB9A8',
  createdAt,
  archivedAt,
  order: 0,
});

const dates = (...ds: DateString[]): Set<DateString> => new Set(ds);

describe('calcStreak — сьогодні відмічено', () => {
  it('рахує сьогодні + попередні дні поспіль', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('стрейк = 1, якщо лише сьогодні (вчора пропущено)', () => {
    const done = dates('2026-06-09');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(1);
  });
});

describe('calcStreak — сьогодні НЕ відмічено', () => {
  it('рахує від учора, якщо сьогодні ще не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(3);
  });

  it('обнуляє стрейк, якщо вчора пропущено і сьогодні не зроблено', () => {
    const done = dates('2026-06-06', '2026-06-07'); // 08 пропущено, 09 не зроблено
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — пропуск у середині', () => {
  it('зупиняє підрахунок на першому пропуску', () => {
    const done = dates('2026-06-09', '2026-06-08', '2026-06-06'); // 07 пропущено
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — межа createdAt', () => {
  it('день до createdAt не вважається пропуском', () => {
    const done = dates('2026-06-07', '2026-06-08', '2026-06-09');
    expect(calcStreak(habit('2026-06-07'), done, '2026-06-09')).toBe(3);
  });

  it('не рахує дні до createdAt', () => {
    const done = dates('2026-06-09', '2026-06-08'); // createdAt 08
    expect(calcStreak(habit('2026-06-08'), done, '2026-06-09')).toBe(2);
  });
});

describe('calcStreak — порожні / нульові випадки', () => {
  it('повертає 0, якщо логів немає', () => {
    expect(calcStreak(habit('2026-06-01'), dates(), '2026-06-09')).toBe(0);
  });

  it('повертає 0 для старого стрейку без зв\'язку із сьогодні/вчора', () => {
    const done = dates('2026-06-01', '2026-06-02', '2026-06-03');
    expect(calcStreak(habit('2026-06-01'), done, '2026-06-09')).toBe(0);
  });
});

describe('calcStreak — ретроактивне виправлення', () => {
  it('відновлює стрейк після виправлення пропущеного дня', () => {
    const before = dates('2026-06-06', '2026-06-07'); // 08 missing, 09 not done
    expect(calcStreak(habit('2026-06-01'), before, '2026-06-09')).toBe(0);

    const after = dates('2026-06-06', '2026-06-07', '2026-06-08');
    expect(calcStreak(habit('2026-06-01'), after, '2026-06-09')).toBe(3);
  });
});
```

> Тести використовують фіксований `todayStr` як аргумент — не залежать від системної дати, тому стабільні.

### `src/store/habitsStore.test.ts` — додати в кінець файлу (snippet)

```typescript
describe('reorderHabits', () => {
  it('призначає order відповідно до переданого порядку id', () => {
    useHabitsStore.getState().addHabit('A', '#7CB9A8');
    useHabitsStore.getState().addHabit('B', '#E8A87C');
    useHabitsStore.getState().addHabit('C', '#9B89D4');
    const [a, b, c] = useHabitsStore.getState().habits;

    useHabitsStore.getState().reorderHabits([c.id, a.id, b.id]);

    const byId = Object.fromEntries(
      useHabitsStore.getState().habits.map(h => [h.name, h.order]),
    );
    expect(byId['C']).toBe(0);
    expect(byId['A']).toBe(1);
    expect(byId['B']).toBe(2);
  });

  it('не змінює order звичок поза переданим списком', () => {
    useHabitsStore.getState().addHabit('A', '#7CB9A8');
    useHabitsStore.getState().addHabit('B', '#E8A87C');
    const [a, b] = useHabitsStore.getState().habits;
    const originalBOrder = b.order;

    useHabitsStore.getState().reorderHabits([a.id]); // лише A

    const updatedB = useHabitsStore.getState().habits.find(h => h.id === b.id)!;
    expect(updatedB.order).toBe(originalBOrder);
  });

  it('addHabit призначає зростаючий order', () => {
    useHabitsStore.getState().addHabit('A', '#7CB9A8');
    useHabitsStore.getState().addHabit('B', '#E8A87C');
    const habits = useHabitsStore.getState().habits;
    expect(habits[0].order).toBe(0);
    expect(habits[1].order).toBe(1);
  });
});
```

---

## ⚠️ Виправити існуючі тести (обов'язково — інакше білд впаде)

`order` тепер обов'язкове поле `Habit`. Існуючі тести створюють `Habit` без нього.

### `src/components/HabitItem/HabitItem.test.tsx`

Знайди:
```typescript
const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01' };
```
Заміни на:
```typescript
const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 };
```

### `src/hooks/useStatistics.test.ts`

У кожному `useHabitsStore.setState({ habits: [...] })` додай `order: <n>` до кожного об'єкта звички. Приклад:
```typescript
habits: [{ id: 'h1', name: 'Test', color: '#7CB9A8', createdAt: '2026-06-10', order: 0 }],
```
Це 5 блоків `setState` — додай `order` усім звичкам (можна 0, 1, 2... або всім 0, для цих тестів значення не критичне).

> Існуючі тести в `habitsStore.test.ts` створюють звички через `addHabit`, тому `order` присвоюється автоматично — їх правити не треба.

---

## Перевірка

```bash
npm run test        # vitest — усі тести, включно з новими
npx tsc --noEmit    # перевірка типів (order має бути всюди)
npm run dev         # ручна перевірка свайпу, плиток, DnD
```

### Ручний чеклист
- [ ] Statistics: свайп ліворуч → наступний місяць, праворуч → попередній (1 місяць за раз)
- [ ] Свайп по календарю не конфліктує з вертикальним скролом сторінки
- [ ] Плитки з'являються лише при стрейку ≥ 2
- [ ] Фільтр «Всі» → плитки всіх; вибрана звичка → лише її плитка
- [ ] Пропуск учора (і сьогодні не відмічено) → плитка зникає
- [ ] Виправлення минулого дня в DateEditSheet → плитка одразу оновлюється
- [ ] Today: long-press (мобільний) / drag (десктоп) переставляє звичку
- [ ] Звичайний тап по картці відкриває редагування (не запускає drag)
- [ ] Тап по кружечку відмічає виконання (не запускає drag)
- [ ] Новий порядок зберігається після перезавантаження
- [ ] Старі збережені дані (без order) мігрують без помилок

---

## Підсумок файлів

**Нові:**
- `src/hooks/useSwipe.ts`
- `src/utils/streakUtils.ts`
- `src/utils/streakUtils.test.ts`
- `src/hooks/useStreaks.ts`
- `src/pages/Statistics/StreakTiles.tsx`
- `src/pages/Statistics/StreakTiles.module.scss`

**Замінені:**
- `src/types/index.ts`
- `src/store/habitsStore.ts`
- `src/hooks/useHabits.ts`
- `src/pages/Today/HabitList.tsx`
- `src/pages/Statistics/StatBoard.tsx`

**Відредаговані (patch):**
- `src/store/habitsStore.test.ts` (+ reorderHabits describe)
- `src/components/HabitItem/HabitItem.test.tsx` (+ order)
- `src/hooks/useStatistics.test.ts` (+ order у всіх habits)

**package.json:** + `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
