import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adoptLegacyStorageKey } from '../utils/storageMigration';

const LEGACY_KEY = 'habit-tracker-storage';
const CURRENT_KEY = 'challenge-tracker-storage';

const legacyPayload = JSON.stringify({
  state: {
    habits: [
      { id: 'a', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-01-01', order: 0 },
      { id: 'b', name: 'Біг', color: '#E4A672', createdAt: '2026-01-02', order: 1 },
    ],
    logs: [
      { habitId: 'a', date: '2026-01-03', completedAt: '2026-01-03T10:00:00.000Z' },
      { habitId: 'b', date: '2026-01-03', completedAt: '2026-01-03T11:00:00.000Z' },
    ],
  },
  version: 1,
});

/** Re-imports the store so `persist` rehydrates from whatever is in localStorage now. */
async function freshStore() {
  vi.resetModules();
  const mod = await import('./challengesStore');
  return mod.useChallengesStore;
}

beforeEach(() => {
  localStorage.clear();
});

describe('adoptLegacyStorageKey', () => {
  it('moves the payload to the new key and drops the old one', () => {
    localStorage.setItem(LEGACY_KEY, legacyPayload);

    adoptLegacyStorageKey(LEGACY_KEY, CURRENT_KEY);

    expect(localStorage.getItem(CURRENT_KEY)).toBe(legacyPayload);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('never clobbers data already written under the new key', () => {
    localStorage.setItem(LEGACY_KEY, legacyPayload);
    localStorage.setItem(CURRENT_KEY, '{"state":{"challenges":[]},"version":2}');

    adoptLegacyStorageKey(LEGACY_KEY, CURRENT_KEY);

    expect(localStorage.getItem(CURRENT_KEY)).toBe('{"state":{"challenges":[]},"version":2}');
  });
});

describe('challengesStore rehydration from legacy "habit" data', () => {
  it('carries habits over as challenges and rewrites habitId -> challengeId', async () => {
    localStorage.setItem(LEGACY_KEY, legacyPayload);

    const store = await freshStore();
    const { challenges, logs } = store.getState();

    expect(challenges.map(c => c.name)).toEqual(['Медитація', 'Біг']);
    expect(challenges[0].order).toBe(0);
    expect(logs).toHaveLength(2);
    expect(logs.map(l => l.challengeId)).toEqual(['a', 'b']);
    expect(logs.every(l => !('habitId' in l))).toBe(true);
    expect((store.getState() as unknown as { habits?: unknown }).habits).toBeUndefined();
  });

  it('starts empty when there is no legacy data', async () => {
    const store = await freshStore();
    expect(store.getState().challenges).toEqual([]);
    expect(store.getState().logs).toEqual([]);
  });
});
