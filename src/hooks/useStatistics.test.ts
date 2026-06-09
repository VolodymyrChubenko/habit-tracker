import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHabitsStore } from '../store/habitsStore';
import { useStatistics } from './useStatistics';

beforeEach(() => {
  useHabitsStore.setState({ habits: [], logs: [] });
});

describe('useStatistics — retroactive completions before createdAt', () => {
  it('counts a log on a date before habit createdAt when retroactively added', () => {
    useHabitsStore.setState({
      habits: [{ id: 'h1', name: 'Test', color: '#7CB9A8', createdAt: '2026-06-10' }],
      logs: [{ habitId: 'h1', date: '2026-06-01', completedAt: '2026-06-10T10:00:00.000Z' }],
    });

    const { result } = renderHook(() => useStatistics('active'));
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });

  it('does not include a habit in total for a date before createdAt when no log exists', () => {
    useHabitsStore.setState({
      habits: [
        { id: 'h1', name: 'Old', color: '#7CB9A8', createdAt: '2026-06-01' },
        { id: 'h2', name: 'New', color: '#E8A87C', createdAt: '2026-06-10' },
      ],
      logs: [{ habitId: 'h1', date: '2026-06-01', completedAt: '2026-06-01T10:00:00.000Z' }],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // h2 not in total (created after), h1 done → 1/1 = 1
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });

  it('includes retroactive habit in total alongside habits that existed on the date', () => {
    useHabitsStore.setState({
      habits: [
        { id: 'h1', name: 'Old', color: '#7CB9A8', createdAt: '2026-06-01' },
        { id: 'h2', name: 'New', color: '#E8A87C', createdAt: '2026-06-10' },
      ],
      logs: [
        { habitId: 'h1', date: '2026-06-01', completedAt: '2026-06-01T10:00:00.000Z' },
        { habitId: 'h2', date: '2026-06-01', completedAt: '2026-06-10T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // h1 done, h2 retroactively done → 2/2 = 1
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });
});

describe('useStatistics — scope separation', () => {
  it('archived habit does not affect active scope progress', () => {
    useHabitsStore.setState({
      habits: [
        { id: 'h1', name: 'Active', color: '#7CB9A8', createdAt: '2026-06-01' },
        { id: 'h2', name: 'Archived', color: '#E8A87C', createdAt: '2026-06-01', archivedAt: '2026-06-05' },
      ],
      logs: [
        { habitId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
        { habitId: 'h2', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // active scope: only h1 counts → 1/1 = 1
    expect(result.current.progressByDate.get('2026-06-03')).toBe(1);
  });

  it('archived habit with logs is visible in archived scope', () => {
    useHabitsStore.setState({
      habits: [
        { id: 'h1', name: 'Archived', color: '#7CB9A8', createdAt: '2026-06-01', archivedAt: '2026-06-05' },
      ],
      logs: [
        { habitId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('archived'));
    expect(result.current.progressByDate.get('2026-06-03')).toBe(1);
  });

  it('active scope counts only active habits; archived scope counts only archived', () => {
    useHabitsStore.setState({
      habits: [
        { id: 'h1', name: 'Active', color: '#7CB9A8', createdAt: '2026-06-01' },
        { id: 'h2', name: 'Archived', color: '#E8A87C', createdAt: '2026-06-01', archivedAt: '2026-06-10' },
      ],
      logs: [
        { habitId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
        { habitId: 'h2', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const { result: activeResult } = renderHook(() => useStatistics('active'));
    // active scope: h1 only → 1/1
    expect(activeResult.current.progressByDate.get('2026-06-03')).toBe(1);

    const { result: archivedResult } = renderHook(() => useStatistics('archived'));
    // archived scope: h2 only → 1/1
    expect(archivedResult.current.progressByDate.get('2026-06-03')).toBe(1);
  });
});
