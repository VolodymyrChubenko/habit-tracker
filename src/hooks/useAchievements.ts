import { useMemo } from 'react';
import { useChallengesStore } from '../store/challengesStore';
import { calcStreak, calcLongestStreak } from '../utils/streakUtils';
import { today } from '../utils/dateUtils';
import type { Challenge, ChallengeId, ChallengeLog, DateString } from '../types';

export interface AchievementEntry {
  challenge: Challenge;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  /** Позиція 1–3 у загальному рейтингу, або null. */
  medal: 1 | 2 | 3 | null;
}

const byRank = (a: AchievementEntry, b: AchievementEntry): number =>
  b.currentStreak - a.currentStreak ||
  b.longestStreak - a.longestStreak ||
  b.totalCompletions - a.totalCompletions;

/**
 * Рейтинг усіх челенджів для сторінки «Досягнення».
 * Активні вище архівних; всередині груп: поточний стрік ↓ →
 * найдовший стрік ↓ → всього виконань ↓. Медалі — перші 3 позиції списку.
 */
export const rankAchievements = (
  challenges: Challenge[],
  logs: ChallengeLog[],
  todayStr: DateString,
): AchievementEntry[] => {
  const completedByChallenge = new Map<ChallengeId, Set<DateString>>();
  for (const log of logs) {
    if (!completedByChallenge.has(log.challengeId)) completedByChallenge.set(log.challengeId, new Set());
    completedByChallenge.get(log.challengeId)!.add(log.date);
  }

  const toEntry = (challenge: Challenge): AchievementEntry => {
    const completed = completedByChallenge.get(challenge.id) ?? new Set<DateString>();
    return {
      challenge,
      currentStreak: calcStreak(challenge, completed, todayStr),
      longestStreak: calcLongestStreak(challenge, completed, todayStr),
      totalCompletions: completed.size,
      medal: null,
    };
  };

  const active = challenges.filter(c => !c.archivedAt).map(toEntry).sort(byRank);
  const archived = challenges.filter(c => c.archivedAt).map(toEntry).sort(byRank);

  return [...active, ...archived].map((entry, i) =>
    i < 3 ? { ...entry, medal: (i + 1) as 1 | 2 | 3 } : entry,
  );
};

export const useAchievements = (): AchievementEntry[] => {
  const challenges = useChallengesStore(s => s.challenges);
  const logs = useChallengesStore(s => s.logs);

  return useMemo(() => rankAchievements(challenges, logs, today()), [challenges, logs]);
};
