import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChallengesStore } from '../store/challengesStore';
import { useStatistics } from './useStatistics';

beforeEach(() => {
  useChallengesStore.setState({ challenges: [], logs: [] });
});

describe('useStatistics — retroactive completions before createdAt', () => {
  it('counts a log on a date before challenge createdAt when retroactively added', () => {
    useChallengesStore.setState({
      challenges: [{ id: 'h1', name: 'Test', color: '#7CB9A8', createdAt: '2026-06-10', order: 0 }],
      logs: [{ challengeId: 'h1', date: '2026-06-01', completedAt: '2026-06-10T10:00:00.000Z' }],
    });

    const { result } = renderHook(() => useStatistics('active'));
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });

  it('does not include a challenge in total for a date before createdAt when no log exists', () => {
    useChallengesStore.setState({
      challenges: [
        { id: 'h1', name: 'Old', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 },
        { id: 'h2', name: 'New', color: '#E8A87C', createdAt: '2026-06-10', order: 1 },
      ],
      logs: [{ challengeId: 'h1', date: '2026-06-01', completedAt: '2026-06-01T10:00:00.000Z' }],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // h2 not in total (created after), h1 done → 1/1 = 1
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });

  it('includes retroactive challenge in total alongside challenges that existed on the date', () => {
    useChallengesStore.setState({
      challenges: [
        { id: 'h1', name: 'Old', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 },
        { id: 'h2', name: 'New', color: '#E8A87C', createdAt: '2026-06-10', order: 1 },
      ],
      logs: [
        { challengeId: 'h1', date: '2026-06-01', completedAt: '2026-06-01T10:00:00.000Z' },
        { challengeId: 'h2', date: '2026-06-01', completedAt: '2026-06-10T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // h1 done, h2 retroactively done → 2/2 = 1
    expect(result.current.progressByDate.get('2026-06-01')).toBe(1);
  });
});

describe('useStatistics — scope separation', () => {
  it('archived challenge does not affect active scope progress', () => {
    useChallengesStore.setState({
      challenges: [
        { id: 'h1', name: 'Active', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 },
        { id: 'h2', name: 'Archived', color: '#E8A87C', createdAt: '2026-06-01', archivedAt: '2026-06-05', order: 1 },
      ],
      logs: [
        { challengeId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
        { challengeId: 'h2', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('active'));
    // active scope: only h1 counts → 1/1 = 1
    expect(result.current.progressByDate.get('2026-06-03')).toBe(1);
  });

  it('archived challenge with logs is visible in archived scope', () => {
    useChallengesStore.setState({
      challenges: [
        { id: 'h1', name: 'Archived', color: '#7CB9A8', createdAt: '2026-06-01', archivedAt: '2026-06-05', order: 0 },
      ],
      logs: [
        { challengeId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useStatistics('archived'));
    expect(result.current.progressByDate.get('2026-06-03')).toBe(1);
  });

  it('active scope counts only active challenges; archived scope counts only archived', () => {
    useChallengesStore.setState({
      challenges: [
        { id: 'h1', name: 'Active', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 },
        { id: 'h2', name: 'Archived', color: '#E8A87C', createdAt: '2026-06-01', archivedAt: '2026-06-10', order: 1 },
      ],
      logs: [
        { challengeId: 'h1', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
        { challengeId: 'h2', date: '2026-06-03', completedAt: '2026-06-03T10:00:00.000Z' },
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
