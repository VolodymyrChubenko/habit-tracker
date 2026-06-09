# План: Bug «Архів» завжди видимий + Manage archived habits (delete + restore)

> **Стек:** React 19 + TS strict, Vite, Zustand persist, React Router v7, date-fns, Vitest.
> **Розташування у репо:** `docs/superpowers/plans/2026-06-09-feature-plan.md`

**Узгоджені рішення по фічі:**
- UI: список карток під календарем на `/statistics/archive`.
- Дії на картці: **Відновити** (unarchive, миттєво) + **Видалити** (hard delete, патерн «натисни двічі»).
- `deleteHabit` у store вже є (чистить звичку + логи). Бракує `unarchiveHabit`.

---

## Task 1 — Bug: кнопка «Архів» завжди видима + порожній календар

**Files:** `src/pages/Statistics/index.tsx`, `src/pages/Archive/index.tsx`

- [ ] **Step 1: Прибрати умову показу лінка «Архів»**

`src/pages/Statistics/index.tsx` — лінк завжди, `archivedHabits` більше не потрібен (інакше впаде `noUnusedLocals`):

```tsx
export default function StatisticsPage() {
  const { activeHabits } = useHabits();
  const [editDate, setEditDate] = useState<DateString | null>(null);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика</h1>
        <Link to="/statistics/archive" className={styles.archiveLink}>
          Архів
        </Link>
      </div>

      <StatBoard scope="active" habits={activeHabits} onDayClick={setEditDate} />

      {editDate && <DateEditSheet date={editDate} onClose={() => setEditDate(null)} />}
    </>
  );
}
```

- [ ] **Step 2: Archive завжди рендерить календар (StatBoard з порожнім archived → порожній календар)**

`src/pages/Archive/index.tsx` — прибрати empty-state гілку (фінальний вигляд у Task 3, поки що без списку):

```tsx
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

      <StatBoard scope="archived" habits={archivedHabits} />
    </>
  );
}
```

> `.empty` у `Statistics.module.scss` стає мертвим — видалити.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Statistics/index.tsx src/pages/Archive/index.tsx src/pages/Statistics/Statistics.module.scss
git commit -m "fix: always show Архів link with empty calendar fallback"
```

---

## Task 2 — Store: `unarchiveHabit`

**Files:** `src/store/habitsStore.ts`, `src/store/habitsStore.test.ts`

- [ ] **Step 1: Додати failing-тест**

`src/store/habitsStore.test.ts`:

```ts
describe('unarchiveHabit', () => {
  it('clears archivedAt on the habit', () => {
    useHabitsStore.getState().addHabit('Читання', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().archiveHabit(habits[0].id);
    useHabitsStore.getState().unarchiveHabit(habits[0].id);
    expect(useHabitsStore.getState().habits[0].archivedAt).toBeUndefined();
  });

  it('does not touch logs', () => {
    useHabitsStore.getState().addHabit('Спорт', '#9B89D4');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-01');
    useHabitsStore.getState().archiveHabit(habits[0].id);
    useHabitsStore.getState().unarchiveHabit(habits[0].id);
    expect(useHabitsStore.getState().logs).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Додати action в інтерфейс і реалізацію**

`src/store/habitsStore.ts` — в `interface HabitsState` після `archiveHabit`:

```ts
unarchiveHabit: (habitId: HabitId) => void;
```

реалізація поряд з `archiveHabit`:

```ts
unarchiveHabit: (habitId) =>
  set(state => ({
    habits: state.habits.map(h =>
      h.id === habitId ? { ...h, archivedAt: undefined } : h,
    ),
  })),
```

- [ ] **Step 3: Тести + commit**

```bash
npm run test:run src/store/habitsStore.test.ts
git add src/store/habitsStore.ts src/store/habitsStore.test.ts
git commit -m "feat: add unarchiveHabit store action"
```

---

## Task 3 — Feature: `ArchivedHabitList` (delete + restore)

**Files:** `src/pages/Archive/ArchivedHabitList.tsx`, `src/pages/Archive/ArchivedHabitList.module.scss`, `src/pages/Archive/index.tsx`

- [ ] **Step 1: `ArchivedHabitList.module.scss`**

```scss
@use '../../styles/tokens' as *;

.section { margin-top: 20px; }

.label {
  font-size: 11px;
  font-weight: 600;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.list { display: flex; flex-direction: column; gap: 8px; }

.card {
  background: $color-surface;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.meta { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }

.name {
  font-size: 14px;
  font-weight: 500;
  color: $color-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date { font-size: 11px; color: $color-text-muted; }

.restore {
  font-size: 13px;
  font-weight: 600;
  color: $color-accent;
  background: $color-accent-bg;
  border: none;
  border-radius: $radius-pill;
  padding: 6px 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.delete {
  font-size: 13px;
  font-weight: 600;
  color: #e05c5c;
  background: none;
  border: 1.5px solid #e05c5c;
  border-radius: $radius-pill;
  padding: 5px 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.deleteConfirm {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #e05c5c;
  border: none;
  border-radius: $radius-pill;
  padding: 6px 12px;
  cursor: pointer;
  flex-shrink: 0;
}
```

- [ ] **Step 2: `ArchivedHabitList.tsx`**

```tsx
import { useState } from 'react';
import { useHabitsStore } from '../../store/habitsStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { Habit, HabitId } from '../../types';
import styles from './ArchivedHabitList.module.scss';

interface Props {
  habits: Habit[];
}

export const ArchivedHabitList = ({ habits }: Props) => {
  const { unarchiveHabit, deleteHabit } = useHabitsStore();
  const [confirmId, setConfirmId] = useState<HabitId | null>(null);

  if (habits.length === 0) return null;

  // перший клік — арм підтвердження, другий по тій самій картці — видалення
  const handleDelete = (id: HabitId) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteHabit(id);
    setConfirmId(null);
  };

  return (
    <div className={styles.section}>
      <p className={styles.label}>Заархівовані звички</p>
      <div className={styles.list}>
        {habits.map(h => (
          <div key={h.id} className={styles.card}>
            <span className={styles.dot} style={{ background: h.color }} />
            <div className={styles.meta}>
              <span className={styles.name}>{h.name}</span>
              {h.archivedAt && (
                <span className={styles.date}>
                  Архівовано {formatDisplayDate(h.archivedAt)}
                </span>
              )}
            </div>
            <button className={styles.restore} onClick={() => unarchiveHabit(h.id)}>
              Відновити
            </button>
            <button
              className={confirmId === h.id ? styles.deleteConfirm : styles.delete}
              onClick={() => handleDelete(h.id)}
            >
              {confirmId === h.id ? 'Точно?' : 'Видалити'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Підключити список у `Archive/index.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { StatBoard } from '../Statistics/StatBoard';
import { ArchivedHabitList } from './ArchivedHabitList';
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

      <StatBoard scope="archived" habits={archivedHabits} />
      <ArchivedHabitList habits={archivedHabits} />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Archive/
git commit -m "feat: archived habits management list (restore + delete)"
```

---

## Task 4 — Фінальна перевірка

- [ ] `npm run test:run` — усі зелені
- [ ] `npm run build` — без TS-помилок
- [ ] Ручна перевірка:
  - `/statistics`: лінк «Архів» видно завжди; перехід → порожній календар, якщо архіву немає.
  - `/statistics/archive`: «Відновити» повертає звичку в Today і прибирає з архіву; «Видалити» → «Точно?» → друге натискання видаляє звичку + її логи.

```bash
npm run test:run && npm run build
```

---

## Edge cases

- **Restore → перерендер:** звичка зникає зі списку архіву й з archived-календаря, з'являється в Today. Якщо архів спорожнів — `ArchivedHabitList` повертає `null`, календар лишається порожнім (з Task 1).
- **`confirmId` після restore іншої картки:** стан вказує на іншу звичку — нешкідливо. За бажанням можна скидати `confirmId` у restore-хендлері.
- **`deleteHabit` вже чистить логи** — окремих змін не треба.
- **`formatDisplayDate`** дає «день тижня, d місяць» без року — для дати архівації прийнятно.
- **`archivedAt: undefined`** при серіалізації `persist` ключ просто випадає з JSON — коректно.

## Порядок реалізації

```
1. Bug   — Statistics/index.tsx + Archive/index.tsx + прибрати .empty
2. Store — unarchiveHabit + тести
3. Feature — ArchivedHabitList (.tsx + .module.scss) + Archive/index.tsx
4. Перевірка — test:run + build + ручний прохід
```
