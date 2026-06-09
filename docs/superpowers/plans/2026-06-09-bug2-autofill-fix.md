# Fix: Bug 2 — iOS "Автозаповнити контакт" (повторна спроба)

> **Контекст:** `autoComplete="off"` не прибрав autofill-бар на iPhone 12 Pro (PWA). Бар "Автозаповнити контакт" керується не лише `autoComplete`, а евристикою iOS WebKit: вона аналізує `name`, `id`, `placeholder`, текст `<label>` на тригер-слова, та нативний атрибут `textContentType`.

**Files to change:**
- `src/pages/Today/AddHabitSheet.tsx`
- `src/pages/Today/EditHabitSheet.tsx`

---

## Root cause

1. **Тригер-слово `name`.** Поточний `name="habit-name"` містить слово `name`, яке iOS прямо мапить на поле імені/контакту. Це найімовірніша причина.
2. `autoComplete="off"` WebKit **ігнорує** для евристики контактів — він не є kill-switch на iOS.
3. Нативний `textContentType` не заданий (за замовчуванням iOS вгадує тип сам).

---

## Підхід (від найімовірнішого до гарантованого)

### Спосіб A — прибрати тригер-слово `name` з атрибутів (спробувати першим)

Перейменувати `name`/`id`, щоб не містили слова `name`:

**`AddHabitSheet.tsx`:**
```tsx
<input
  id="habit-title"
  name="habit-title"
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

> Якщо `htmlFor` десь посилається на старий `id` — синхронізувати. У поточному коді `<label htmlFor="habit-name">` → змінити на `htmlFor="habit-title"`.

**`EditHabitSheet.tsx`:**
```tsx
<input
  id="habit-title-edit"
  name="habit-title-edit"
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

`<label htmlFor="edit-habit-name">` → `htmlFor="habit-title-edit"`.

---

### Спосіб B — гарантований kill-switch `autoComplete="new-password"`

Якщо Спосіб A не прибрав бар повністю — для password-полів iOS не пропонує контакти:

```tsx
autoComplete="new-password"
```

**Мінус:** iOS може показати дрібну іконку «ключ/паролі» праворуч у полі. Бар "Автозаповнити контакт" зникає напевно. Для текстового поля назви звички — прийнятний компроміс.

---

### Спосіб C — нативний `textContentType` (додатково, якщо A+B мало)

React не мапить цей iOS-атрибут у camelCase, передаємо через spread у нижньому регістрі:

```tsx
<input
  // ...решта атрибутів
  {...{ textcontenttype: 'oneTimeCode' }}
/>
```

> `textcontenttype: 'oneTimeCode'` або `'none'` — iOS не пропонує контакт для таких типів. Працює нестабільно через React (атрибут може не дійти до WebKit як kebab/lowercase), тому це **доповнення**, а не основне рішення. Якщо TS лається — `// @ts-expect-error iOS-only attribute, відсутній у типах React`.

---

## Рекомендований порядок перевірки на пристрої

```
1. Спосіб A (rename name/id + label htmlFor) → тест на iPhone 12 Pro.
   У ~більшості випадків бару вже немає.
2. Якщо лишився → додати Спосіб B (autoComplete="new-password").
3. Якщо все ще лишається (рідко) → Спосіб C як доповнення.
```

## Перевірка готовності

- [ ] При фокусі на input "Нова звичка" немає бару "Автозаповнити контакт".
- [ ] При фокусі на input "Редагувати звичку" — те саме.
- [ ] `<label htmlFor>` оновлено під нові `id` (доступність не зламана).
- [ ] `npm run build` зелений (TS strict).
- [ ] Якщо застосовано Спосіб B — перевірити, що дрібна password-іконка не заважає UX.

## Notes

- Зміна суто на рівні HTML-атрибутів input. Логіка форми, store, типи — не зачіпаються.
- Edge case: автозаповнення інших полів у застосунку відсутнє, тож побічних ефектів немає.
