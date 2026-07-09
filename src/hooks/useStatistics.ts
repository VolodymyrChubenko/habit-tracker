import { useMemo } from 'react';
import { useChallengesStore } from '../store/challengesStore';
import type { DateString, ChallengeId, StatScope } from '../types';

export const useStatistics = (scope: StatScope, filterIds?: ChallengeId[]) => {
  const challenges = useChallengesStore(s => s.challenges);
  const logs = useChallengesStore(s => s.logs);

  const progressByDate = useMemo(() => {
    const scopedChallenges = challenges.filter(h =>
      scope === 'active' ? !h.archivedAt : !!h.archivedAt,
    );
    const scopedIds = new Set(scopedChallenges.map(h => h.id));

    const map = new Map<DateString, number>();
    const logsByDate = new Map<DateString, Set<ChallengeId>>();

    for (const log of logs) {
      if (!scopedIds.has(log.challengeId)) continue;
      if (filterIds && !filterIds.includes(log.challengeId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.challengeId);
    }

    // include dates where all filtered logs were removed (show 0 progress)
    for (const log of logs) {
      if (!scopedIds.has(log.challengeId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
    }

    for (const [date, completedIds] of logsByDate) {
      const trackable = scopedChallenges.filter(h => {
        if (h.archivedAt && h.archivedAt < date) return false;
        if (h.createdAt > date && !completedIds.has(h.id)) return false;
        return true;
      });
      const total = filterIds
        ? trackable.filter(h => filterIds.includes(h.id)).length
        : trackable.length;
      map.set(date, total === 0 ? 0 : completedIds.size / total);
    }

    return map;
  }, [challenges, logs, scope, filterIds]);

  return { progressByDate };
};
