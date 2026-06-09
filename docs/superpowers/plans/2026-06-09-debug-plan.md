# Plan: Mobile/PWA Bug Fixes (iOS)

> **Контекст:** Habit Tracker PWA (React 19 + TS strict, Vite, Zustand, React Router v7). Деплой на Vercel, встановлено як PWA на iPhone 12 Pro. Три баги, специфічні для мобільного/iOS.

**Стек:** React 19, TypeScript strict, SASS modules, Vite.

---

## Bug 1 — Клавіатура перекриває BottomSheet

### Root cause
`.sheet` притиснутий до низу екрана (`.backdrop { align-items: flex-end }`). На iOS Safari/standalone PWA програмна клавіатура виїжджає поверх контенту, а `100dvh` / layout viewport не зменшується — sheet з `input` лишається під клавіатурою. Користувач не бачить поле вводу (bug1.jpg).

### Рішення
`VisualViewport API`: клавіатура зменшує `window.visualViewport.height`. Різниця між `window.innerHeight` і `visualViewport.height` = висота клавіатури. Піднімаємо sheet на цю висоту через `padding-bottom` (не `transform` — щоб не ламати внутрішній скрол `.sheet`).

### Files to change
- **Create:** `src/hooks/useKeyboardInset.ts`
- **Modify:** `src/components/BottomSheet/BottomSheet.tsx`

### Steps

- [ ] **Step 1: Create `src/hooks/useKeyboardInset.ts`**

```ts
import { useEffect, useState } from 'react';

/** Висота екранної клавіатури в px (0 коли прихована). iOS VisualViewport. */
export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = (): void => {
      const next = window.innerHeight - vv.height - vv.offsetTop;
      setInset(next > 0 ? next : 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
};
```

- [ ] **Step 2: Apply inset in `BottomSheet.tsx`**

Імпортувати хук і додати `paddingBottom` до `.sheet`:

```tsx
import { useEffect } from 'react';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import styles from './BottomSheet.module.scss';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = ({ onClose, children }: Props) => {
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        style={{ paddingBottom: keyboardInset || undefined }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  );
};
```

> Якщо `paddingBottom` накладається на існуючий `padding: 20px` у `.sheet` — це ок, inline `paddingBottom` перекриває нижній. За потреби додати `+ 20` для збереження відступу від клавіатури.

### Edge cases
- `visualViewport` може бути `undefined` (старі браузери) → хук повертає 0, поведінка як зараз. Не регресія.
- Анімація `slideUp` у `.sheet` не конфліктує — padding змінюється після монтування.
- Перевірити: дуже довгий контент sheet + клавіатура → `overflow-y: auto` на `.sheet` має дати скрол до input.

---

## Bug 2 — iOS пропонує "Автозаповнити контакт"

### Root cause
iOS евристично визначає текстовий `input` як поле імені та показує autofill-бар з контактом (bug2.jpg). `autoComplete` не заданий.

### Fix
Додати атрибути на обидва текстові input. На iOS `autoComplete="off"` іноді ігнорується для імен — підсилюємо `autoCorrect`, `autoCapitalize`, `spellCheck` і явним `name`.

### Files to change
- **Modify:** `src/pages/Today/AddHabitSheet.tsx`
- **Modify:** `src/pages/Today/EditHabitSheet.tsx`

### Steps

- [ ] **Step 1: `AddHabitSheet.tsx` — input "habit-name"**

Додати атрибути:

```tsx
<input
  id="habit-name"
  name="habit-name"
  className={styles.input}
  value={name}
  onChange={e => setName(e.target.value)}
  placeholder="Наприклад: Медитація"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="sentences"
  spellCheck={false}
  autoFocus
/>
```

- [ ] **Step 2: `EditHabitSheet.tsx` — input "edit-habit-name"**

Ті самі атрибути:

```tsx
<input
  id="edit-habit-name"
  name="edit-habit-name"
  className={styles.input}
  value={name}
  onChange={e => setName(e.target.value)}
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="sentences"
  spellCheck={false}
  autoFocus
/>
```

### Edge cases
- Якщо autofill-бар все ще з'являється на впертих версіях iOS — fallback: `autoComplete="new-password"` гарантовано вимикає контактний autofill (iOS не мапить його на адресну книгу), але може показати іконку паролів. Спробувати спершу `"off"`, перевірити на пристрої.

---

## Bug 3 — Заборонити масштабування (pinch-zoom)

### Root cause
`index.html` має `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` без обмеження масштабу. Користувач наближає додаток, ламаючи layout (bug3.jpg).

### Fix
Лише meta viewport — додати `maximum-scale=1.0, user-scalable=no` + `viewport-fit=cover` (корисно для PWA safe-area).

### Files to change
- **Modify:** `index.html`

### Steps

- [ ] **Step 1: Оновити meta viewport**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

- [ ] **Step 2 (опціонально): Оновити `<title>`**

`index.html` досі має `<title>vite-scaffold-tmp</title>` — замінити на `Habit Tracker` (косметика, не баг).

### Edge cases
- `user-scalable=no` ігнорується деякими версіями iOS Safari (accessibility). Якщо pinch-zoom все ще проходить на пристрої — escalation до JS-блоку (`touch-action: manipulation` + `gesturestart` preventDefault). **Поза скоупом цього плану** — спершу перевірити чисто meta-рішення на iPhone 12 Pro.
- `viewport-fit=cover` може відкрити safe-area inset навколо контенту в standalone PWA. Перевірити, що `.app` (max-width 480px, центрований) виглядає коректно; за потреби додати `padding: env(safe-area-inset-*)`.

---

## Implementation order

```
1. Bug 3  — index.html meta viewport (найшвидше, ізольовано)
2. Bug 2  — AddHabitSheet.tsx + EditHabitSheet.tsx (атрибути input)
3. Bug 1  — useKeyboardInset.ts (новий хук) + BottomSheet.tsx
4. Перевірка: npm run build (TS strict, без помилок)
5. Деплой на Vercel, ручний тест на iPhone 12 Pro:
   - відкрити "+" → input видно над клавіатурою, без autofill-бару
   - редагувати звичку → те саме
   - спроба pinch-zoom → заблоковано
```

## Перевірка готовності

- [ ] BottomSheet з input повністю видимий над клавіатурою (Add + Edit).
- [ ] Немає бару "Автозаповнити контакт" при фокусі на input.
- [ ] Pinch-zoom заблоковано в PWA.
- [ ] `npm run build` зелений (TS strict).
- [ ] Тести не зачеплені (зміни не торкаються логіки store/hooks, окрім нового хука без тестів — за бажанням додати тест на `useKeyboardInset` з мок `visualViewport`).

## Notes
- `useKeyboardInset` — суто браузерний side-effect, юніт-тест опціональний (треба мокати `window.visualViewport`).
- Жодних змін у store, типах, статистиці — ризик регресії мінімальний.
