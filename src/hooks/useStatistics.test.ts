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

    const { result } = renderHook(() => useStatistics());
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

    const { result } = renderHook(() => useStatistics());
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

    const { result } = renderHook(() => useStatistics());
    // h1 done, h2 retroactively done → 2/2 = 1
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });
});
