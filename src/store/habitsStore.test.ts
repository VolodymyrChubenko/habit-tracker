import { describe, it, expect, beforeEach } from 'vitest';
import { useHabitsStore } from './habitsStore';

beforeEach(() => {
  useHabitsStore.setState({ habits: [], logs: [] });
});

describe('addHabit', () => {
  it('adds a habit with id, name, color, createdAt', () => {
    useHabitsStore.getState().addHabit('Медитація', '#7CB9A8');
    const { habits } = useHabitsStore.getState();
    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Медитація');
    expect(habits[0].color).toBe('#7CB9A8');
    expect(habits[0].id).toBeTruthy();
    expect(habits[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('completeHabit', () => {
  it('adds a log entry for the given date', () => {
    useHabitsStore.getState().addHabit('Читання', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    const { logs } = useHabitsStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].habitId).toBe(habits[0].id);
    expect(logs[0].date).toBe('2026-06-04');
  });

  it('does not duplicate if already completed', () => {
    useHabitsStore.getState().addHabit('Спорт', '#9B89D4');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    expect(useHabitsStore.getState().logs).toHaveLength(1);
  });
});

describe('uncompleteHabit', () => {
  it('removes the log for the given habit and date', () => {
    useHabitsStore.getState().addHabit('Йога', '#7CB9A8');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-04');
    useHabitsStore.getState().uncompleteHabit(habits[0].id, '2026-06-04');
    expect(useHabitsStore.getState().logs).toHaveLength(0);
  });
});

describe('archiveHabit', () => {
  it('sets archivedAt on the habit', () => {
    useHabitsStore.getState().addHabit('Читання', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().archiveHabit(habits[0].id);
    const archived = useHabitsStore.getState().habits[0];
    expect(archived.archivedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('saveLogsForDate', () => {
  it('replaces all logs for a date with the given habitIds', () => {
    useHabitsStore.getState().addHabit('A', '#7CB9A8');
    useHabitsStore.getState().addHabit('B', '#E8A87C');
    const { habits } = useHabitsStore.getState();
    useHabitsStore.getState().completeHabit(habits[0].id, '2026-06-01');
    useHabitsStore.getState().saveLogsForDate('2026-06-01', [habits[1].id]);
    const logs = useHabitsStore.getState().logs.filter(l => l.date === '2026-06-01');
    expect(logs).toHaveLength(1);
    expect(logs[0].habitId).toBe(habits[1].id);
  });
});
