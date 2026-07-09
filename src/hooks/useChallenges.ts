import { useChallengesStore } from '../store/challengesStore';
import type { Challenge } from '../types';

const byOrder = (a: Challenge, b: Challenge): number => a.order - b.order;

export const useChallenges = () => {
  const challenges = useChallengesStore(s => s.challenges);
  const activeChallenges = challenges.filter(h => !h.archivedAt).sort(byOrder);
  const archivedChallenges = challenges.filter(h => !!h.archivedAt).sort(byOrder);
  return { activeChallenges, archivedChallenges };
};
