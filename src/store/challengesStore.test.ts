import { describe, it, expect, beforeEach } from 'vitest';
import { useChallengesStore } from './challengesStore';

beforeEach(() => {
  useChallengesStore.setState({ challenges: [], logs: [] });
});

describe('addChallenge', () => {
  it('adds a challenge with id, name, color, createdAt', () => {
    useChallengesStore.getState().addChallenge('Медитація', '#7CB9A8');
    const { challenges } = useChallengesStore.getState();
    expect(challenges).toHaveLength(1);
    expect(challenges[0].name).toBe('Медитація');
    expect(challenges[0].color).toBe('#7CB9A8');
    expect(challenges[0].id).toBeTruthy();
    expect(challenges[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('completeChallenge', () => {
  it('adds a log entry for the given date', () => {
    useChallengesStore.getState().addChallenge('Читання', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-04');
    const { logs } = useChallengesStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].challengeId).toBe(challenges[0].id);
    expect(logs[0].date).toBe('2026-06-04');
  });

  it('does not duplicate if already completed', () => {
    useChallengesStore.getState().addChallenge('Спорт', '#9B89D4');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-04');
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-04');
    expect(useChallengesStore.getState().logs).toHaveLength(1);
  });
});

describe('uncompleteChallenge', () => {
  it('removes the log for the given challenge and date', () => {
    useChallengesStore.getState().addChallenge('Йога', '#7CB9A8');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-04');
    useChallengesStore.getState().uncompleteChallenge(challenges[0].id, '2026-06-04');
    expect(useChallengesStore.getState().logs).toHaveLength(0);
  });
});

describe('archiveChallenge', () => {
  it('sets archivedAt on the challenge', () => {
    useChallengesStore.getState().addChallenge('Читання', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().archiveChallenge(challenges[0].id);
    const archived = useChallengesStore.getState().challenges[0];
    expect(archived.archivedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('updateChallenge', () => {
  it('updates name and color of the challenge', () => {
    useChallengesStore.getState().addChallenge('Медитація', '#7CB9A8');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().updateChallenge(challenges[0].id, { name: 'Йога', color: '#E8A87C' });
    const updated = useChallengesStore.getState().challenges[0];
    expect(updated.name).toBe('Йога');
    expect(updated.color).toBe('#E8A87C');
  });

  it('does not change other challenges', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().updateChallenge(challenges[0].id, { name: 'A2' });
    expect(useChallengesStore.getState().challenges[1].name).toBe('B');
  });
});

describe('deleteChallenge', () => {
  it('removes the challenge from challenges list', () => {
    useChallengesStore.getState().addChallenge('Читання', '#7CB9A8');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().deleteChallenge(challenges[0].id);
    expect(useChallengesStore.getState().challenges).toHaveLength(0);
  });

  it('removes all logs for the deleted challenge', () => {
    useChallengesStore.getState().addChallenge('Читання', '#7CB9A8');
    useChallengesStore.getState().addChallenge('Спорт', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-01');
    useChallengesStore.getState().completeChallenge(challenges[1].id, '2026-06-01');
    useChallengesStore.getState().deleteChallenge(challenges[0].id);
    const logs = useChallengesStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].challengeId).toBe(challenges[1].id);
  });
});

describe('unarchiveChallenge', () => {
  it('clears archivedAt on the challenge', () => {
    useChallengesStore.getState().addChallenge('Читання', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().archiveChallenge(challenges[0].id);
    useChallengesStore.getState().unarchiveChallenge(challenges[0].id);
    expect(useChallengesStore.getState().challenges[0].archivedAt).toBeUndefined();
  });

  it('does not touch logs', () => {
    useChallengesStore.getState().addChallenge('Спорт', '#9B89D4');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-01');
    useChallengesStore.getState().archiveChallenge(challenges[0].id);
    useChallengesStore.getState().unarchiveChallenge(challenges[0].id);
    expect(useChallengesStore.getState().logs).toHaveLength(1);
  });
});

describe('reorderChallenges', () => {
  it('призначає order відповідно до переданого порядку id', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    useChallengesStore.getState().addChallenge('C', '#9B89D4');
    const [a, b, c] = useChallengesStore.getState().challenges;

    useChallengesStore.getState().reorderChallenges([c.id, a.id, b.id]);

    const byId = Object.fromEntries(
      useChallengesStore.getState().challenges.map(h => [h.name, h.order]),
    );
    expect(byId['C']).toBe(0);
    expect(byId['A']).toBe(1);
    expect(byId['B']).toBe(2);
  });

  it('не змінює order челенджів поза переданим списком', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    const [a, b] = useChallengesStore.getState().challenges;
    const originalBOrder = b.order;

    useChallengesStore.getState().reorderChallenges([a.id]);

    const updatedB = useChallengesStore.getState().challenges.find(h => h.id === b.id)!;
    expect(updatedB.order).toBe(originalBOrder);
  });

  it('addChallenge призначає зростаючий order', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    const challenges = useChallengesStore.getState().challenges;
    expect(challenges[0].order).toBe(0);
    expect(challenges[1].order).toBe(1);
  });
});

describe('saveLogsForDate', () => {
  it('replaces scoped logs for a date with the given challengeIds', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-01');
    useChallengesStore.getState().saveLogsForDate('2026-06-01', [challenges[1].id], [challenges[0].id, challenges[1].id]);
    const logs = useChallengesStore.getState().logs.filter(l => l.date === '2026-06-01');
    expect(logs).toHaveLength(1);
    expect(logs[0].challengeId).toBe(challenges[1].id);
  });

  it('keeps out-of-scope logs when saving a date', () => {
    useChallengesStore.getState().addChallenge('A', '#7CB9A8');
    useChallengesStore.getState().addChallenge('B', '#E8A87C');
    const { challenges } = useChallengesStore.getState();
    useChallengesStore.getState().completeChallenge(challenges[0].id, '2026-06-01');
    useChallengesStore.getState().completeChallenge(challenges[1].id, '2026-06-01');
    // edit only scope = [A]
    useChallengesStore.getState().saveLogsForDate('2026-06-01', [], [challenges[0].id]);
    const logs = useChallengesStore.getState().logs.filter(l => l.date === '2026-06-01');
    expect(logs).toHaveLength(1);
    expect(logs[0].challengeId).toBe(challenges[1].id); // B (out of scope) is preserved
  });
});
