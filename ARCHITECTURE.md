# Habit Tracker PWA — Architecture

> **Стек:** React 18 + TypeScript (strict) + Vite + Zustand + React Router v6  
> **Тип:** PWA, орієнтований на мобільні пристрої  
> **Зберігання:** localStorage (з розрахунком на міграцію на бекенд)

---

## Зміст

1. [Стек та залежності](#стек-та-залежності)
2. [Структура папок](#структура-папок)
3. [Типи даних](#типи-даних)
4. [Стейт менеджмент (Zustand)](#стейт-менеджмент)
5. [Роутинг](#роутинг)
6. [Екрани та компоненти](#екрани-та-компоненти)
7. [Хуки](#хуки)
8. [PWA конфігурація](#pwa-конфігурація)
9. [Міграція на бекенд](#міграція-на-бекенд)
10. [Команди для старту](#команди-для-старту)

---

## Стек та залежності

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "zustand": "^4",
    "date-fns": "^3"
  },
  "devDependencies": {
    "vite": "^5",
    "vite-plugin-pwa": "^0.20",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5"
  }
}
```

| Категорія       | Рішення            | Причина                                          |
|-----------------|--------------------|--------------------------------------------------|
| Bundler         | Vite               | Швидкий dev-сервер, вбудована PWA підтримка      |
| UI              | React 18 + TS strict | Основний стек                                  |
| Routing         | React Router v6    | Окремі URL, майбутній deep linking               |
| Глобальний стейт | Zustand           | Мінімум бойлерплейту, легко розширити на API     |
| Персистентність | zustand `persist`  | localStorage зараз → API пізніше                 |
| Дати            | date-fns           | Легка, tree-shakeable                            |
| PWA             | vite-plugin-pwa    | Service Worker + manifest автоматично            |

---

## Структура папок

```
src/
├── app/
│   ├── App.tsx                  # Кореневий компонент, layout з BottomNav
│   ├── router.tsx               # Визначення маршрутів
│   └── providers.tsx            # Глобальні провайдери (тема тощо)
│
├── pages/
│   ├── Today/
│   │   ├── index.tsx            # Сторінка Today
│   │   ├── HabitList.tsx        # Список активних звичок
│   │   ├── DoneList.tsx         # Акордіон зі списком виконаних
│   │   └── AddHabitSheet.tsx    # Bottom sheet — форма додавання звички
│   ├── Statistics/
│   │   ├── index.tsx            # Сторінка Statistics
│   │   ├── HabitSelector.tsx    # Вибір звички для фільтрації
│   │   └── ProgressCalendar.tsx # Календар з SVG-окружностями прогресу
│   └── Settings/
│       └── index.tsx            # Сторінка Settings
│
├── components/                  # Перевикористовувані UI компоненти
│   ├── HabitItem.tsx            # Картка звички (Today і Done)
│   ├── BottomNav.tsx            # Footer навігація (3 таби)
│   ├── ColorPicker.tsx          # Обгортка для input[type=color]
│   └── CircularProgress.tsx     # SVG окружність для календаря
│
├── store/
│   ├── habitsStore.ts           # Звички + логи + CRUD операції
│   └── settingsStore.ts         # Тема та інші налаштування
│
├── hooks/
│   ├── useHabits.ts             # Селектори і actions з habitsStore
│   ├── useTodayProgress.ts      # Логіка розбивки Today / Done
│   └── useStatistics.ts         # Обрахунок прогресу по датах
│
├── types/
│   └── index.ts                 # Всі TypeScript типи та інтерфейси
│
├── utils/
│   ├── dateUtils.ts             # Хелпери для date-fns
│   └── progressUtils.ts         # Розрахунок % заповнення окружності
│
└── assets/
```

---

## Типи даних

```typescript
// src/types/index.ts

export type HabitId = string;
export type DateString = string; // ISO формат: "2026-06-03"

export interface Habit {
  id: HabitId;
  name: string;
  color: string;        // HEX: "#FF5733"
  createdAt: DateString;
  archivedAt?: DateString;
}

// Розділено від Habit — щоб легко синхронізувати з бекендом пізніше
export interface HabitLog {
  habitId: HabitId;
  date: DateString;
  completedAt: string;  // ISO timestamp
}

export type ActiveTab = 'today' | 'statistics' | 'settings';
```

> **Ключове рішення:** `habits` і `logs` зберігаються окремо.  
> Це дозволяє: не мутувати Habit при кожному виконанні, ефективно рахувати статистику по будь-якому діапазону дат, та легко замінити logs на API calls пізніше.

---

## Стейт менеджмент

### habitsStore

```typescript
// src/store/habitsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Habit, HabitId, HabitLog, DateString } from '../types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];

  addHabit: (name: string, color: string) => void;
  completeHabit: (habitId: HabitId, date: DateString) => void;
  uncompleteHabit: (habitId: HabitId, date: DateString) => void;
  archiveHabit: (habitId: HabitId) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],
      logs: [],

      addHabit: (name, color) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              id: nanoid(),
              name,
              color,
              createdAt: format(new Date(), 'yyyy-MM-dd'),
            },
          ],
        })),

      completeHabit: (habitId, date) =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              habitId,
              date,
              completedAt: new Date().toISOString(),
            },
          ],
        })),

      uncompleteHabit: (habitId, date) =>
        set((state) => ({
          logs: state.logs.filter(
            (log) => !(log.habitId === habitId && log.date === date)
          ),
        })),

      archiveHabit: (habitId) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, archivedAt: format(new Date(), 'yyyy-MM-dd') }
              : h
          ),
        })),
    }),
    { name: 'habit-tracker-storage' }
  )
);
```

### settingsStore

```typescript
// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'habit-tracker-settings' }
  )
);
```

---

## Роутинг

```typescript
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import TodayPage from '../pages/Today';
import StatisticsPage from '../pages/Statistics';
import SettingsPage from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <TodayPage /> },          // /
      { path: 'statistics', element: <StatisticsPage /> }, // /statistics
      { path: 'settings', element: <SettingsPage /> },     // /settings
    ],
  },
]);
```

```tsx
// src/app/App.tsx
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export default function App() {
  return (
    <div className="app">
      <main className="app__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
```

---

## Екрани та компоненти

### Today (`/`)

**Логіка розбивки списків:**
```
activeHabits = habits.filter(h => !isCompletedToday(h.id))
doneHabits   = habits.filter(h =>  isCompletedToday(h.id))
```

**Компоненти:**
- `HabitList` — рендерить активні звички, по кліку → `completeHabit`
- `DoneList` — акордіон, по кліку на елемент → `uncompleteHabit`, повертає у Today
- `AddHabitSheet` — bottom sheet з формою (відкривається по кнопці `+`)

**Відкриття форми:** через локальний `useState` або URL-параметр `?add=true`

### Statistics (`/statistics`)

**Компоненти:**
- `HabitSelector` — мультивибір звичок (дефолт: всі)
- `ProgressCalendar` — відображає місяць, для кожної дати рахує прогрес

**Логіка прогресу:**
```typescript
// Всі звички обрано:
const progress = completedCount / totalActiveHabits; // 0..1

// Одна звичка обрана:
const isDone = logs.some(l => l.habitId === id && l.date === date);
// true → окружність, false → немає
```

**CircularProgress** — SVG компонент:
```tsx
// Параметри: size, strokeWidth, progress (0..1), color
// Реалізація через stroke-dasharray / stroke-dashoffset
```

**Редагування минулих дат:** по кліку на дату → відкривається sheet з чекбоксами звичок за той день.

### Settings (`/settings`)

Мінімальний MVP:
- Перемикач теми: Light / Dark / System

### BottomNav

```tsx
// Три таби: Today (/), Statistics (/statistics), Settings (/settings)
// Активний таб визначається через useLocation()
```

---

## Хуки

```typescript
// src/hooks/useTodayProgress.ts
// Повертає { activeHabits, doneHabits } для сьогоднішньої дати

// src/hooks/useStatistics.ts
// Повертає Map<DateString, number> де number = прогрес 0..1
// Фільтрує по обраних звичках

// src/hooks/useHabits.ts
// Зручні селектори: activeHabits (без archived), getHabitById тощо
```

---

## PWA конфігурація

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Habit Tracker',
        short_name: 'Habits',
        description: 'Відслідковуй щоденні звички',
        display: 'standalone',        // без браузерного UI
        orientation: 'portrait',      // мобільний додаток
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
```

---

## Міграція на бекенд

Оскільки `habits` і `logs` розділені, заміна локального сховища на API буде точковою:

```typescript
// Зараз (Zustand persist → localStorage):
completeHabit: (habitId, date) =>
  set((state) => ({
    logs: [...state.logs, { habitId, date, completedAt: new Date().toISOString() }],
  }))

// Пізніше (з бекендом, наприклад через react-query):
completeHabit: async (habitId, date) => {
  await api.logs.create({ habitId, date });
  await queryClient.invalidateQueries({ queryKey: ['logs'] });
}
```

**Що залишиться без змін:** всі компоненти, хуки, типи, утиліти.  
**Що зміниться:** тільки `store/*.ts` — заміна `persist` на API calls.

---

## Команди для старту

```bash
# Створення проєкту
npm create vite@latest habit-tracker -- --template react-ts
cd habit-tracker

# Встановлення залежностей
npm install react-router-dom zustand date-fns nanoid
npm install -D vite-plugin-pwa

# Запуск
npm run dev

# Білд
npm run build

# Перегляд PWA локально
npm run preview
```

---

## Порядок розробки (рекомендований)

1. `types/index.ts` — типи
2. `store/habitsStore.ts` — стейт і персистентність
3. `app/router.tsx` + `App.tsx` — роутинг і layout
4. `components/BottomNav.tsx` — навігація
5. `pages/Today/` — головний екран (HabitList → DoneList → AddHabitSheet)
6. `pages/Statistics/` — календар з прогресом
7. `pages/Settings/` — тема
8. `vite.config.ts` — PWA конфігурація
