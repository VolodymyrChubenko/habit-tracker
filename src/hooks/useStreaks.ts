import { useMemo } from 'react';
import { useChallengesStore } from '../store/challengesStore';
import { calcStreak } from '../utils/streakUtils';
import { today } from '../utils/dateUtils';
import type { Challenge, ChallengeId, DateString } from '../types';

interface StreakResult {
  challenge: Challenge;
  streak: number;
}

export const useStreaks = (challenges: Challenge[], filterIds: ChallengeId[] | null): StreakResult[] => {
  const logs = useChallengesStore(s => s.logs);

  return useMemo(() => {
    const todayStr = today();

    const completedByChallenge = new Map<ChallengeId, Set<DateString>>();
    for (const log of logs) {
      if (!completedByChallenge.has(log.challengeId)) completedByChallenge.set(log.challengeId, new Set());
      completedByChallenge.get(log.challengeId)!.add(log.date);
    }

    const filtered = filterIds
      ? challenges.filter(h => filterIds.includes(h.id))
      : challenges;

    return filtered
      .map(challenge => ({
        challenge,
        streak: calcStreak(challenge, completedByChallenge.get(challenge.id) ?? new Set(), todayStr),
      }))
      .filter(r => r.streak >= 2);
  }, [logs, challenges, filterIds]);
};
